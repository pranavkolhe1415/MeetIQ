/**
 * ==========================================================
 * MeetIQ AI Chat
 * ==========================================================
 */

let currentMeetingId = null;

let messages = [];

function setMeeting(id){

    currentMeetingId = id;

}

function scrollChat(){

    const box = document.getElementById(

        "chat-messages"

    );

    if(box){

        box.scrollTop = box.scrollHeight;

    }

}

function escapeHTML(text){

    const div=document.createElement("div");

    div.textContent=text;

    return div.innerHTML;

}

function addMessage(role,text){

    messages.push({

        role,

        text

    });

    renderMessages();

}

function renderMessages(){

    const box=document.getElementById(

        "chat-messages"

    );

    if(!box) return;

    box.innerHTML="";

    messages.forEach(msg=>{

        const item=document.createElement("div");

        item.className=

            msg.role==="user"

            ?

            "chat-user"

            :

            "chat-ai";

        item.innerHTML=

        `
        <div class="chat-bubble">

            ${escapeHTML(msg.text)}

        </div>
        `;

        box.appendChild(item);

    });

    scrollChat();

}
async function loadSuggestions(){

    if(!currentMeetingId)

        return;

    try{

        const res=

        await api.getSuggestions(

            currentMeetingId

        );

        const wrap=document.getElementById(

            "chat-suggestions"

        );

        if(!wrap) return;

        wrap.innerHTML="";

        res.suggestions.forEach(q=>{

            const btn=

            document.createElement(

                "button"

            );

            btn.className=

            "suggestion-btn";

            btn.innerText=q;

            btn.onclick=()=>{

                document.getElementById(

                    "chat-input"

                ).value=q;

                sendChat();

            };

            wrap.appendChild(btn);

        });

    }

    catch(err){

        console.log(err);

    }

}
async function sendChat(){

    const input=document.getElementById(

        "chat-input"

    );

    const text=input.value.trim();

    if(!text) return;

    addMessage(

        "user",

        text

    );

    input.value="";

    addMessage(

        "assistant",

        "Thinking..."

    );

    try{

        const res=

        await api.askAI(

            currentMeetingId,

            text

        );

        messages.pop();

        addMessage(

            "assistant",

            typeof res.answer==="string"

            ?

            res.answer

            :

            JSON.stringify(

                res.answer,

                null,

                2

            )

        );

    }

    catch(err){

        messages.pop();

        addMessage(

            "assistant",

            err.message

        );

    }

}
function initChat(meetingId){

    currentMeetingId=

    meetingId;

    messages=[];

    renderMessages();

    loadSuggestions();

}
document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        const input=

        document.getElementById(

            "chat-input"

        );

        if(input){

            input.addEventListener(

                "keypress",

                e=>{

                    if(

                        e.key==="Enter"

                    ){

                        sendChat();

                    }

                }

            );

        }

    }

);