/**
 * MeetIQ Pages - Processing, Report, History
 */

let currentMeetingId = null;
/* Processing Screen */
function renderProcessing(meetingId) {
  const steps = [
    { id: 'upload', label: 'Uploading File', icon: '📤' },
    { id: 'extracting_audio', label: 'Extracting Audio', icon: '🎵' },
    { id: 'transcribing', label: 'Generating Transcript', icon: '📝' },
    { id: 'diarizing', label: 'Identifying Speakers', icon: '👥' },
    { id: 'analyzing', label: 'Analyzing Meeting', icon: '🧠' },
    { id: 'summarizing', label: 'Generating Summary', icon: '📋' },
    { id: 'generating_report', label: 'Creating Report', icon: '📄' },
    { id: 'completed', label: 'Completed', icon: '✅' },
  ];
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="processing-screen">
      <div class="processing-visual"><div class="processing-ring"></div><div class="processing-ring"></div><div class="processing-brain">🧠</div></div>
      <h2>AI is Analyzing Your Meeting</h2>
      <p class="processing-subtitle" id="proc-step">Preparing...</p>
      <div class="processing-steps" id="proc-steps">
        ${steps.map(s => `<div class="step-item" data-step="${s.id}" id="step-${s.id}"><div class="step-icon">${s.icon}</div><div class="step-text">${s.label}</div><div class="step-status">Waiting</div></div>`).join('')}
      </div>
      <div class="processing-progress-bar" style="margin-top:24px"><div class="progress-bar"><div class="progress-bar-fill" id="proc-bar" style="width:0%"></div></div><div class="processing-percent" id="proc-pct">0%</div></div>
    </div>`;
  pollProgress(meetingId, steps);
}

async function pollProgress(meetingId, steps) {

  const stepIds = steps.map(s => s.id);

  while (true) {

    try {

      const res = await api.getMeeting(meetingId);

      const meeting = res.data.meeting;

      const progress = meeting.processingProgress || 0;

      const status = meeting.status;

      const currentStep = meeting.processingStep || "Preparing...";
      const stepMap = {

        "Waiting for processing": "upload",

        "Starting AI Pipeline...": "upload",

        "Extracting Audio": "extracting_audio",

        "Generating Transcript": "transcribing",

        "Identifying Speakers": "diarizing",

        "Analyzing Meeting": "analyzing",

        "Generating Summary": "summarizing",

        "Generating PDF...": "generating_report",

        "Completed": "completed"

      };

      const activeStep = stepMap[currentStep];

      const currentIndex = stepIds.indexOf(activeStep);
      // Update Progress Bar
      document.getElementById("proc-bar").style.width = progress + "%";
      document.getElementById("proc-pct").innerText = progress + "%";
      document.getElementById("proc-step").innerText = currentStep;

      // Reset all steps
      stepIds.forEach(id => {

        const row = document.getElementById("step-" + id);

        if (!row) return;

        row.classList.remove("active", "completed");

        row.querySelector(".step-status").innerText = "Waiting";

      });



      if (currentIndex >= 0) {

        for (let i = 0; i < currentIndex; i++) {

          const row = document.getElementById("step-" + stepIds[i]);

          row.classList.add("completed");

          row.querySelector(".step-status").innerText = "Done";

        }

        const active = document.getElementById("step-" + stepIds[currentIndex]);

        active.classList.add("active");

        active.querySelector(".step-status").innerText = "Running";

      }

      // Completed
      if (status === "completed") {

        stepIds.forEach(id => {

          const row = document.getElementById("step-" + id);

          row.classList.add("completed");

          row.querySelector(".step-status").innerText = "Done";

        });

        document.getElementById("proc-bar").style.width = "100%";
        document.getElementById("proc-pct").innerText = "100%";
        document.getElementById("proc-step").innerText = "Meeting Analysis Complete";

        showToast("Analysis Completed!", "success");

        setTimeout(() => {

          navigateTo("report", meetingId);

        }, 1500);

        break;

      }

      if (status === "failed") {

        showToast("Meeting Processing Failed", "error");

        break;

      }

    } catch (err) {

      console.error(err);

      break;

    }

    await new Promise(r => setTimeout(r, 1000));

  }

}

/* Report Page */
async function renderReport(meetingId) {
  const container = document.getElementById('page-content');
  container.innerHTML = '<div class="empty-state"><p>Loading report...</p></div>';
  try {
    // const res = await api.getReport(meetingId);
    const res = await api.getMeeting(meetingId);
    const m = res.data.meeting;
    buildReportPage(m);
    // Load chat history
    // loadChatHistory(meetingId);
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><h4>Report Not Ready</h4><p>${e.message}</p><button class="btn btn-primary" onclick="navigateTo('dashboard')">Go to Dashboard</button></div>`;
  }
}

function buildReportPage(m) {
  currentMeetingId = m._id;
  const container = document.getElementById('page-content');
  const isVideo = m.fileType === 'video';
  const colors = ['#6C5CE7', '#00cec9', '#fd79a8', '#fdcb6e', '#74b9ff'];

  container.innerHTML = `
    <div class="report-header">
      <h1>${esc(m.title)}</h1>
      <div class="report-header-actions">
        <button class="btn btn-outline btn-sm" onclick="downloadPDF('${m._id}')"><i data-lucide="download"></i> Download PDF</button>
        <button class="btn btn-ghost btn-sm" onclick="navigateTo('history')"><i data-lucide="arrow-left"></i> Back</button>
      </div>
    </div>
    <div class="report-layout">
      <div class="report-left">
        <!-- Media Player -->
        <div class="media-player">
          <div class="player-container" id="player-container">
            ${isVideo ? `<video id="media-player" src="/uploads/${m.fileName}" preload="metadata"></video>` :
      `<div class="audio-visual"><i data-lucide="music"></i><p>${esc(m.title)}</p><audio id="media-player" src="/uploads/${m.fileName}" preload="metadata"></audio></div>`}
          </div>
          <div class="player-controls">
            <button onclick="togglePlay()"><i data-lucide="play" id="play-icon"></i></button>
            <div class="player-timeline" id="player-timeline" onclick="seekMedia(event)"><div class="player-timeline-fill" id="timeline-fill"></div></div>
            <span class="player-time" id="player-time">00:00 / ${formatTime(m.duration)}</span>
            <button onclick="toggleMute()"><i data-lucide="volume-2" id="volume-icon"></i></button>
          </div>
        </div>
        <!-- Transcript -->
<div class="transcript-panel">

    <div class="transcript-header">

        <div>

            <h3>📝 Meeting Transcript</h3>

            <p class="transcript-subtitle">

                ${m.metrics?.wordCount || 0} Words • ${formatTime(m.duration)}

            </p>

        </div>

    </div>

    <div id="transcript-body">

        ${renderTranscript(m.fullTranscript,

    m.duration)}

    </div>

</div>
       <!-- Meeting Outline -->

${buildMeetingOutline(m)}
        <!-- AI Chat -->
        <div class="chat-panel">
          <div class="chat-header"><h3>AI Chat</h3><span class="chat-badge">Powered by AI</span></div>
          <div class="chat-messages" id="chat-messages"><div class="chat-message assistant">

<b>Ask me about this meeting.</b>

<br><br>

Try one of these:

</div>

<div class="chat-suggestions">

<button onclick="askSuggestion(currentMeetingId,'Summarize this meeting')">

📄 Summary

</button>

<button onclick="askSuggestion(currentMeetingId,'List all action items')">

✅ Action Items

</button>

<button onclick="askSuggestion(currentMeetingId,'What decisions were made?')">

📌 Decisions

</button>

<button onclick="askSuggestion(currentMeetingId,'What are the next steps?')">

➡ Next Steps

</button>

</div></div>
          <div class="chat-input-area"><input type="text" id="chat-input" placeholder="Try: Summarize this meeting..." onkeypress="if(event.key==='Enter')sendChatMessage('${m._id}')"><button onclick="sendChatMessage('${m._id}')"><i data-lucide="send"></i></button></div>
        </div>
      </div>
      <div class="report-right">
        <div class="report-accordion">
          ${buildAccordion('Executive Summary', 'file-text', '#6C5CE7', m.executiveSummary ? `<p>${esc(m.executiveSummary)}</p>` : '<p>Not available</p>', true)}
          ${buildKeyHighlights(m)}
          ${buildAccordion('Key Decisions', 'check-square', '#fdcb6e', buildDecisionsHTML(m.decisions))}
          ${buildAccordion('Action Items', 'list-checks', '#e17055', buildActionItemsHTML(m.actionItems))}
         
          
        </div>
      </div>
    </div>`;
  lucide.createIcons();
  setTimeout(() => {

    document.getElementById("chat-input")?.focus();

  }, 300);
  setupMediaPlayer();
}

function buildAccordion(title, icon, color, content, open = false) {
  return `<div class="accordion-item ${open ? 'open' : ''}">
    <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
      <div style="display:flex;align-items:center"><div class="accordion-icon" style="background:${color}22;color:${color}"><i data-lucide="${icon}"></i></div>${title}</div>
      <i data-lucide="chevron-down"></i>
    </div>
    <div class="accordion-body"><div class="accordion-content">${content}</div></div>
  </div>`;
}


function buildActionItemsHTML(items) {
  if (!items?.length) return '<p>No action items identified</p>';
  return items.map(item => `
    <div class="action-item">
      <div class="action-check" onclick="this.classList.toggle('checked')"></div>
      <div class="action-text">${esc(item.text)}
        <div class="action-meta"><span class="priority-tag ${item.priority}">${item.priority}</span><span class="assignee-tag">${esc(item.assignee)}</span></div>
      </div>
    </div>`).join('');
}

function buildDecisionsHTML(decisions) {
  if (!decisions?.length) return '<p>No decisions identified</p>';
  return decisions.map(d => `<div class="decision-item"><p>• ${esc(d.text)}</p>${d.madeBy ? `<span class="decision-by">by ${esc(d.madeBy)}</span>` : ''}</div>`).join('');
}




/* Media Player */
function setupMediaPlayer() {
  const player = document.getElementById('media-player');
  if (!player) return;
  player.addEventListener('timeupdate', () => {
    const pct = (player.currentTime / player.duration) * 100;
    document.getElementById('timeline-fill').style.width = pct + '%';
    document.getElementById('player-time').textContent = `${formatTime(Math.floor(player.currentTime))} / ${formatTime(Math.floor(player.duration || 0))}`;
    // Highlight active transcript
    document.querySelectorAll('.transcript-card').forEach(seg => {
      const st = parseFloat(seg.dataset.start);
      seg.classList.toggle('active', player.currentTime >= st && player.currentTime < st + 15);
    });
  });
}

function togglePlay() {
  const p = document.getElementById('media-player');
  if (!p) return;
  if (p.paused) { p.play(); document.getElementById('play-icon').setAttribute('data-lucide', 'pause'); }
  else { p.pause(); document.getElementById('play-icon').setAttribute('data-lucide', 'play'); }
  lucide.createIcons();
}

function toggleMute() {
  const p = document.getElementById('media-player');
  if (!p) return;
  p.muted = !p.muted;
  document.getElementById('volume-icon').setAttribute('data-lucide', p.muted ? 'volume-x' : 'volume-2');
  lucide.createIcons();
}

function seekMedia(e) {
  const p = document.getElementById('media-player');
  const tl = document.getElementById('player-timeline');
  if (!p || !tl) return;
  const rect = tl.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  p.currentTime = pct * p.duration;
}

function seekTo(seconds) {
  const p = document.getElementById('media-player');
  if (p) { p.currentTime = seconds; p.play(); document.getElementById('play-icon')?.setAttribute('data-lucide', 'pause'); lucide.createIcons(); }
}

function filterTranscript(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.transcript-card').forEach(seg => {
    const text = seg.textContent.toLowerCase();
    seg.style.display = text.includes(q) ? '' : 'none';
  });
}

async function typeMessage(element, text, speed = 15) {

  element.innerHTML = "";

  for (let i = 0; i < text.length; i++) {

    element.innerHTML += text.charAt(i);

    element.parentElement.scrollTop =
      element.parentElement.scrollHeight;

    await new Promise(resolve =>
      setTimeout(resolve, speed)
    );

  }

}

/* Chat */
async function sendChatMessage(meetingId) {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const chatBox = document.getElementById('chat-messages');
  chatBox.innerHTML += `<div class="chat-message user">${esc(msg)}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    // const res = await api.sendChat(meetingId, msg);
    const res = await api.askAI(meetingId, msg);
    console.log(res);
   const aiBubble = document.createElement("div");

aiBubble.className = "chat-message assistant";

chatBox.appendChild(aiBubble);

chatBox.scrollTop = chatBox.scrollHeight;

console.log("Full Response:", res);
console.log("res.data:", res.data);

const answer =
    res.answer ||
    res.data?.answer ||
    res.data?.data?.answer ||
    "No response received.";

await typeMessage(
    aiBubble,
    answer,
    12
);

    aiBubble.className = "chat-message assistant";

    chatBox.appendChild(aiBubble);

    chatBox.scrollTop = chatBox.scrollHeight;



  } catch (err) {

    console.error(err);

    const aiBubble = document.createElement("div");

    aiBubble.className = "chat-message assistant";

    chatBox.appendChild(aiBubble);

    await typeMessage(

      aiBubble,

      "Sorry, I couldn't process your question.",

      12

    );

  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function askSuggestion(meetingId, question) {

  document.getElementById("chat-input").value = question;

  await sendChatMessage(meetingId);

}

// async function loadChatHistory(meetingId) {
//   try {
//     const res = await api.getChatHistory(meetingId);
//     const msgs = res.data.messages || [];
//     if (msgs.length) {
//       const chatBox = document.getElementById('chat-messages');
//       msgs.forEach(m => { chatBox.innerHTML += `<div class="chat-message ${m.role}">${esc(m.content)}</div>`; });
//       chatBox.scrollTop = chatBox.scrollHeight;
//     }
//   }
//     catch (err) {
//         console.error(err);
//     }
// }  
async function loadChatHistory() {
    return;
}



  let progressTimer = null;

function renderTranscript(text, duration = 0) {

    if (!text) {

        return `

            <div class="transcript-empty">

                Transcript not available.

            </div>

        `;

    }

    const paragraphs = text
    .replace(/\n/g, " ")
    .match(/.{1,280}(\s|$)/g) || [];
    const total = paragraphs.length;

    return paragraphs.map((paragraph, index) => `

       <div

class="transcript-card"

onclick="jumpToTranscript(${index},${total},${duration})"

>

            <div class="transcript-time">

                ⏱ ${formatTranscriptTime(index, total, duration)}

            </div>

            <div class="transcript-speaker">

                👤 Speaker 1

            </div>

            <div class="transcript-text">

                ${esc(paragraph)}

            </div>

        </div>

    `).join("");

}
function formatTranscriptTime(index,total,duration){

    if(!duration || duration<=0){

        duration = total * 20;

    }

    const seconds = Math.floor(

        (index / Math.max(total,1)) * duration

    );

    const mins = String(

        Math.floor(seconds / 60)

    ).padStart(2,"0");

    const secs = String(

        seconds % 60

    ).padStart(2,"0");

    return `${mins}:${secs}`;

}

function buildKeyHighlights(meeting){

    const highlights = [];

    if(meeting.executiveSummary){

        meeting.executiveSummary
        .split(".")
        .forEach(item=>{

            item=item.trim();

            if(item.length>30)

                highlights.push(item);

        });

    }

    if(Array.isArray(meeting.decisions)){

        meeting.decisions.forEach(d=>{

            if(d.text)

                highlights.push(d.text);

        });

    }

    if(Array.isArray(meeting.actionItems)){

        meeting.actionItems.forEach(a=>{

            if(a.text)

                highlights.push(a.text);

        });

    }

    if(Array.isArray(meeting.nextSteps)){

        meeting.nextSteps.forEach(step=>{

            if(step)

                highlights.push(step);

        });

    }

    const unique=[...new Set(highlights)].slice(0,8);

    if(unique.length===0){

        return "";

    }

    return `

    <div class="highlights-panel">

        <div class="highlights-header">

            ⭐ Key Highlights

        </div>

        <div class="highlights-grid">

            ${unique.map(item=>`

                <div class="highlight-card">

                    <div class="highlight-icon">

                        📌

                    </div>

                    <div class="highlight-text">

                        ${esc(item)}

                    </div>

                </div>

            `).join("")}

        </div>

    </div>

    `;

}

function buildMeetingOutline(meeting){

    const outline = [];

    if(meeting.executiveSummary){

        meeting.executiveSummary

        .split(".")

        .forEach(sentence=>{

            sentence = sentence.trim();

            if(sentence.length > 25){

                outline.push(sentence);

            }

        });

    }

    if(Array.isArray(meeting.actionItems)){

        meeting.actionItems.forEach(item=>{

            if(item.text){

                outline.push(item.text);

            }

        });

    }

    if(Array.isArray(meeting.decisions)){

        meeting.decisions.forEach(item=>{

            if(item.text){

                outline.push(item.text);

            }

        });

    }

    const unique = [...new Set(outline)].slice(0,8);

    if(unique.length===0){

        return "";

    }

    return `

<div class="outline-panel">

<div class="outline-header">

📑 Meeting Outline

</div>

<div class="outline-list">

${unique.map((item,index)=>`

<div class="outline-item">

<div class="outline-number">

${index+1}

</div>

<div class="outline-text">

${esc(item)}

</div>

</div>

`).join("")}

</div>

</div>

`;

}
function jumpToTranscript(index,total,duration){

    const media = document.querySelector("video,audio");

    if(!media) return;

    const time =

        Math.floor(

            (index / Math.max(total,1))

            * duration

        );

    media.currentTime = time;

    media.play();

}

