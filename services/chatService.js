/**
 * ==========================================================
 * MeetIQ Chat Service
 * ==========================================================
 * Uses Ollama to answer questions about ONE meeting.
 * ==========================================================
 */

const ollama = require("./ollamaService");

class ChatService {

    /**
     * Ask Ollama
     */

    async ask(prompt){

        return await ollama.generate(prompt);

    }
    /**
     * ------------------------------------------------------
     * Build Chat Prompt
     * ------------------------------------------------------
     */

   buildPrompt(meeting, question) {

    return `

You are MeetIQ AI.

Answer ONLY using the meeting information below.

Rules:

- Do NOT invent information.
- Do NOT use outside knowledge.
- If the answer is not present in the meeting, reply:

"I couldn't find that information in this meeting."

- Keep answers under 120 words.
- Use bullet points whenever appropriate.

==================================================

MEETING TITLE

${meeting.title}

==================================================

EXECUTIVE SUMMARY

${meeting.executiveSummary || "Not available"}

==================================================

ACTION ITEMS

${JSON.stringify(meeting.actionItems || [], null, 2)}

==================================================

DECISIONS

${JSON.stringify(meeting.decisions || [], null, 2)}

==================================================

NEXT STEPS

${(meeting.nextSteps || []).join("\n")}

==================================================

TRANSCRIPT

${meeting.fullTranscript || ""}

==================================================

QUESTION

${question}

==================================================

ANSWER

`;

}
        /**
     * ------------------------------------------------------
     * Chat with Meeting
     * ------------------------------------------------------
     */

    async chat(meeting, question) {

        try {

            if (!meeting) {

                throw new Error("Meeting not found.");

            }

            if (!question || !question.trim()) {

                throw new Error("Question is required.");

            }

            const prompt = this.buildPrompt(

                meeting,

                question

            );

                        const local = this.localAnswer(

                meeting,

                question

            );

            if (local) {

                return {

                    success: true,

                    answer: local

                };

            }

            const response = await this.ask(

                prompt

            );

            return {

                success: true,

                answer: response.trim()

            };

        }

        catch (error) {

            console.error(

                "Chat Error:",

                error.message

            );

            return {

                success: false,

               answer:

"I couldn't find that information in this meeting. Try asking about the summary, action items, decisions, or next steps."

            };

        }

    }
        /**
     * ------------------------------------------------------
     * Suggested Questions
     * ------------------------------------------------------
     */

    getSuggestions() {

    return [

        "Summarize this meeting",

        "Give a short executive summary",

        "List all action items",

        "Who is assigned each task?",

        "What decisions were made?",

        "What are the next steps?",

        "Which task has the highest priority?",

        "List all pending work"

    ];

}
        /**
     * ------------------------------------------------------
     * Fast Local Answers
     * ------------------------------------------------------
     */

    localAnswer(meeting, question) {

    const q = question.toLowerCase();

    if (q.includes("summary")) {

        return meeting.executiveSummary ||
               "No executive summary available.";

    }

    if (q.includes("action")) {

        if (!meeting.actionItems.length)

            return "No action items found.";

        return meeting.actionItems
            .map((a, i) =>
                `${i + 1}. ${a.text}
Assigned: ${a.assignee}
Priority: ${a.priority}`)
            .join("\n\n");

    }

    if (q.includes("decision")) {

        if (!meeting.decisions.length)

            return "No decisions found.";

        return meeting.decisions
            .map((d, i) =>
                `${i + 1}. ${d.text}`)
            .join("\n");

    }

    if (q.includes("next")) {

        if (!meeting.nextSteps.length)

            return "No next steps found.";

        return meeting.nextSteps.join("\n");

    }

    return null;

}
}
module.exports = new ChatService();