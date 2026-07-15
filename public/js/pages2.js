/**
 * MeetIQ Pages - Processing, Report, History
 */

/* Processing Screen */
function renderProcessing(meetingId) {
  const steps = [
    {id:'upload',label:'Uploading File',icon:'📤'},
    {id:'extracting_audio',label:'Extracting Audio',icon:'🎵'},
    {id:'transcribing',label:'Generating Transcript',icon:'📝'},
    {id:'diarizing',label:'Identifying Speakers',icon:'👥'},
    {id:'analyzing',label:'Analyzing Meeting',icon:'🧠'},
    {id:'summarizing',label:'Generating Summary',icon:'📋'},
    {id:'generating_report',label:'Creating Report',icon:'📄'},
    {id:'completed',label:'Completed',icon:'✅'},
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
  let done = false;
  while (!done) {
    try {
      const res = await api.getProgress(meetingId);
      const m = res.data.meeting;
      const status = m.status;
      const progress = m.processingProgress || 0;

      document.getElementById('proc-bar').style.width = progress + '%';
      document.getElementById('proc-pct').textContent = progress + '%';
      document.getElementById('proc-step').textContent = m.processingStep || status;

      const currentIdx = stepIds.indexOf(status);
      stepIds.forEach((sid, i) => {
        const el = document.getElementById('step-' + sid);
        if (!el) return;
        if (i < currentIdx) { el.className = 'step-item completed'; el.querySelector('.step-status').textContent = 'Done'; }
        else if (i === currentIdx) { el.className = 'step-item active'; el.querySelector('.step-status').textContent = 'In Progress'; }
        else { el.className = 'step-item'; el.querySelector('.step-status').textContent = 'Waiting'; }
      });

      if (status === 'completed') {
        done = true;
        showToast('Analysis complete! 🎉', 'success');
        setTimeout(() => navigateTo('report', meetingId), 1500);
      } else if (status === 'failed') {
        done = true;
        showToast('Analysis failed: ' + (m.errorMessage || 'Unknown error'), 'error');
      }
    } catch (e) {
      console.error('Poll error:', e);
    }
    if (!done) await new Promise(r => setTimeout(r, 2000));
  }
}

/* Report Page */
async function renderReport(meetingId) {
  const container = document.getElementById('page-content');
  container.innerHTML = '<div class="empty-state"><p>Loading report...</p></div>';
  try {
    // const res = await api.getReport(meetingId);
     const res = await api.getMeeting(id);
    const m = res.data.meeting;
    buildReportPage(m);
    // Load chat history
    loadChatHistory(meetingId);
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><h4>Report Not Ready</h4><p>${e.message}</p><button class="btn btn-primary" onclick="navigateTo('dashboard')">Go to Dashboard</button></div>`;
  }
}

function buildReportPage(m) {
  const container = document.getElementById('page-content');
  const isVideo = m.fileType === 'video';
  const colors = ['#6C5CE7','#00cec9','#fd79a8','#fdcb6e','#74b9ff'];

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
          <div class="transcript-header"><h3>Transcript</h3><div class="transcript-search"><input type="text" placeholder="Search transcript..." onkeyup="filterTranscript(this.value)"></div></div>
          <div class="transcript-body" id="transcript-body">
            ${(m.transcript||[]).map((seg,i) => `<div class="transcript-segment" data-start="${seg.startTime}" onclick="seekTo(${seg.startTime})"><span class="speaker-badge s${(m.participants||[]).findIndex(p=>p.name===seg.speaker)%5}">${esc(seg.speaker)}</span><span class="segment-text">${esc(seg.text)}</span><span class="segment-time">${formatTime(seg.startTime)}</span></div>`).join('')}
          </div>
        </div>
        <!-- Timeline -->
        <div class="timeline-panel">
          <div class="timeline-header"><h3>Timeline</h3></div>
          <div class="timeline-body">
            ${(m.transcript||[]).filter((_,i)=>i%3===0).map(seg => `<div class="timeline-item" onclick="seekTo(${seg.startTime})"><div class="timeline-dot"></div><span class="timeline-time">${formatTime(seg.startTime)}</span><span class="timeline-desc">${esc(seg.text.substring(0,60))}...</span></div>`).join('')}
          </div>
        </div>
        <!-- AI Chat -->
        <div class="chat-panel">
          <div class="chat-header"><h3>AI Chat</h3><span class="chat-badge">Powered by AI</span></div>
          <div class="chat-messages" id="chat-messages"><div class="chat-message assistant">Hi! Ask me anything about this meeting. Try "Who talked most?" or "List action items".</div></div>
          <div class="chat-input-area"><input type="text" id="chat-input" placeholder="Ask about this meeting..." onkeypress="if(event.key==='Enter')sendChatMessage('${m._id}')"><button onclick="sendChatMessage('${m._id}')"><i data-lucide="send"></i></button></div>
        </div>
      </div>
      <div class="report-right">
        <div class="report-accordion">
          ${buildAccordion('Executive Summary', 'file-text', '#6C5CE7', m.executiveSummary ? `<p>${esc(m.executiveSummary)}</p>` : '<p>Not available</p>', true)}
          ${buildAccordion('Meeting Overview', 'clipboard', '#00cec9', m.meetingOverview ? `<p>${esc(m.meetingOverview)}</p>` : '<p>Not available</p>')}
          ${buildAccordion('Participants', 'users', '#fd79a8', buildParticipantsHTML(m.participants, colors))}
          ${buildAccordion('Key Decisions', 'check-square', '#fdcb6e', buildDecisionsHTML(m.decisions))}
          ${buildAccordion('Action Items', 'list-checks', '#e17055', buildActionItemsHTML(m.actionItems))}
          ${buildAccordion('Important Quotes', 'quote', '#74b9ff', buildQuotesHTML(m.importantQuotes))}
          ${buildAccordion('Meeting Metrics', 'bar-chart-3', '#a29bfe', buildMetricsHTML(m.metrics))}
        </div>
      </div>
    </div>`;
  lucide.createIcons();
  setupMediaPlayer();
}

function buildAccordion(title, icon, color, content, open = false) {
  return `<div class="accordion-item ${open?'open':''}">
    <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
      <div style="display:flex;align-items:center"><div class="accordion-icon" style="background:${color}22;color:${color}"><i data-lucide="${icon}"></i></div>${title}</div>
      <i data-lucide="chevron-down"></i>
    </div>
    <div class="accordion-body"><div class="accordion-content">${content}</div></div>
  </div>`;
}

function buildParticipantsHTML(participants, colors) {
  if (!participants?.length) return '<p>No participants identified</p>';
  return `<div class="participant-list">${participants.map((p,i) => `
    <div class="participant-item">
      <div class="participant-avatar" style="background:${colors[i%5]}">${p.name.charAt(0)}</div>
      <div class="participant-info"><h4>${esc(p.name)}</h4><p>Speaking: ${formatDur(p.speakingTime)} (${p.speakingPercentage}%) · ${p.speechCount} turns</p>
        <div class="participant-bar"><div class="participant-bar-fill" style="width:${p.speakingPercentage}%;background:${colors[i%5]}"></div></div>
      </div>
    </div>`).join('')}</div>`;
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
  return decisions.map(d => `<div class="decision-item"><p>• ${esc(d.text)}</p>${d.madeBy?`<span class="decision-by">by ${esc(d.madeBy)}</span>`:''}</div>`).join('');
}

function buildQuotesHTML(quotes) {
  if (!quotes?.length) return '<p>No notable quotes</p>';
  return quotes.map(q => `<div class="quote-item"><p>"${esc(q.text)}"</p>${q.speaker?`<span class="quote-speaker">— ${esc(q.speaker)}</span>`:''}</div>`).join('');
}

function buildMetricsHTML(metrics) {
  if (!metrics) return '<p>No metrics available</p>';
  return `<div class="metrics-grid">
    <div class="metric-item"><div class="metric-val">${metrics.totalSpeakers}</div><div class="metric-lbl">Speakers</div></div>
    <div class="metric-item"><div class="metric-val">${metrics.totalWords}</div><div class="metric-lbl">Words</div></div>
    <div class="metric-item"><div class="metric-val">${metrics.engagementScore}%</div><div class="metric-lbl">Engagement</div></div>
    <div class="metric-item"><div class="metric-val">${metrics.meetingEfficiency}%</div><div class="metric-lbl">Efficiency</div></div>
  </div>
  <div style="margin-top:12px"><strong style="font-size:13px">Sentiment:</strong> <span style="font-size:13px;color:var(--success);text-transform:capitalize">${metrics.averageSentiment}</span></div>
  ${metrics.topicsDiscussed?.length ? `<div class="topics-list" style="margin-top:12px">${metrics.topicsDiscussed.map(t=>`<span class="topic-tag">${esc(t)}</span>`).join('')}</div>` : ''}`;
}

/* Media Player */
function setupMediaPlayer() {
  const player = document.getElementById('media-player');
  if (!player) return;
  player.addEventListener('timeupdate', () => {
    const pct = (player.currentTime / player.duration) * 100;
    document.getElementById('timeline-fill').style.width = pct + '%';
    document.getElementById('player-time').textContent = `${formatTime(Math.floor(player.currentTime))} / ${formatTime(Math.floor(player.duration||0))}`;
    // Highlight active transcript
    document.querySelectorAll('.transcript-segment').forEach(seg => {
      const st = parseFloat(seg.dataset.start);
      seg.classList.toggle('active', player.currentTime >= st && player.currentTime < st + 15);
    });
  });
}

function togglePlay() {
  const p = document.getElementById('media-player');
  if (!p) return;
  if (p.paused) { p.play(); document.getElementById('play-icon').setAttribute('data-lucide','pause'); }
  else { p.pause(); document.getElementById('play-icon').setAttribute('data-lucide','play'); }
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
  if (p) { p.currentTime = seconds; p.play(); document.getElementById('play-icon')?.setAttribute('data-lucide','pause'); lucide.createIcons(); }
}

function filterTranscript(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.transcript-segment').forEach(seg => {
    const text = seg.textContent.toLowerCase();
    seg.style.display = text.includes(q) ? '' : 'none';
  });
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
    chatBox.innerHTML += `<div class="chat-message assistant">${esc(res.data.answer)}</div>`;
  } catch {
    chatBox.innerHTML += `<div class="chat-message assistant">Sorry, I couldn't process your question. Please try again.</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadChatHistory(meetingId) {
  try {
    const res = await api.getChatHistory(meetingId);
    const msgs = res.data.messages || [];
    if (msgs.length) {
      const chatBox = document.getElementById('chat-messages');
      msgs.forEach(m => { chatBox.innerHTML += `<div class="chat-message ${m.role}">${esc(m.content)}</div>`; });
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch {}
}
