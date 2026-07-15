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

You answer questions ONLY using the meeting information below.

If the answer does not exist in the meeting,
reply exactly:

"I couldn't find that information in this meeting."

Never invent answers.
Never use outside knowledge.
Keep answers short and professional.

==================================================

MEETING TITLE

${meeting.title}

==================================================

EXECUTIVE SUMMARY

${meeting.executiveSummary}

==================================================

MEETING OVERVIEW

${meeting.meetingOverview}

==================================================

DETAILED SUMMARY

${meeting.detailedSummary}

==================================================

KEY DISCUSSION POINTS

${(meeting.keyDiscussionPoints || []).join("\n")}

==================================================

ACTION ITEMS

${JSON.stringify(meeting.actionItems || [], null, 2)}

==================================================

DECISIONS

${JSON.stringify(meeting.decisions || [], null, 2)}

==================================================

DEADLINES

${JSON.stringify(meeting.deadlines || [], null, 2)}

==================================================

RISKS

${(meeting.risks || []).join("\n")}

==================================================

BLOCKERS

${(meeting.blockers || []).join("\n")}

==================================================

NEXT STEPS

${(meeting.nextSteps || []).join("\n")}

==================================================

IMPORTANT QUOTES

${JSON.stringify(meeting.importantQuotes || [], null, 2)}

==================================================

TRANSCRIPT

${meeting.fullTranscript}

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

                    "Sorry, I couldn't answer that question."

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

            "What are the action items?",

            "What decisions were made?",

            "What are the deadlines?",

            "What are the next steps?",

            "What risks were identified?",

            "Who is responsible for each task?",

            "What did Rahul commit to?",

            "Is deployment discussed?",

            "Was authentication mentioned?"

        ];

    }
        /**
     * ------------------------------------------------------
     * Fast Local Answers
     * ------------------------------------------------------
     */

    localAnswer(meeting, question) {

        const q = question.toLowerCase();

        if (q.includes("action")) {

            return meeting.actionItems;

        }

        if (q.includes("decision")) {

            return meeting.decisions;

        }

        if (q.includes("deadline")) {

            return meeting.deadlines;

        }

        if (q.includes("risk")) {

            return meeting.risks;

        }

        if (q.includes("blocker")) {

            return meeting.blockers;

        }

        if (q.includes("next")) {

            return meeting.nextSteps;

        }

        return null;

    }
}
module.exports = new ChatService();