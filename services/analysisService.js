/**
 * ==========================================================
 * MeetIQ Analysis Service
 * ==========================================================
 * Generates complete meeting intelligence using a single
 * Ollama request.
 * ==========================================================
 */

const ollama = require("./ollamaService");

class AnalysisService {

    /**
     * ------------------------------------------------------
     * JSON Schema
     * ------------------------------------------------------
     */

   getSchema() {

    return `

Return ONLY valid JSON.

{
  "executiveSummary": "",
  "keyHighlights": [
    ""
  ],
  "actionItems": [
    {
      "text": "",
      "assignee": "",
      "priority": "Medium"
    }
  ],
  "decisions": [
    {
      "text": "",
      "madeBy": ""
    }
  ],
  "nextSteps": [
    ""
  ]
}

`;

}

    /**
     * ------------------------------------------------------
     * Build Prompt
     * ------------------------------------------------------
     */

 buildPrompt(transcript) {

    return `

You are an AI Meeting Assistant.

Read the meeting transcript carefully.

Return ONLY valid JSON.

Generate these five sections:

1. Executive Summary
2. Key Highlights
3. Action Items
4. Decisions
5. Next Steps

Key Highlights requirements:
- Generate 4 to 6 highlights.
- Each highlight must be one concise sentence.
- Include only important topics, findings, discussions, or outcomes.
- Do not copy the transcript word-for-word.
- Do not invent information.
- If there are no meaningful highlights, return an empty array.

Action Items requirements:
- Include only actions explicitly discussed in the meeting.
- Identify the assignee only when the transcript provides enough information.
- Otherwise use "Unassigned".
- Priority must be High, Medium, or Low.

Decision requirements:
- Include only decisions actually made during the meeting.
- Do not treat general discussion as a decision.

Next Steps requirements:
- Include only concrete follow-up steps discussed in the meeting.

Do not explain anything.

Do not use markdown.

${this.getSchema()}

Meeting Transcript:

${transcript}

`;

}
    /**
     * ------------------------------------------------------
     * Extract JSON
     * ------------------------------------------------------
     */

    extractJSON(response) {

        if (!response)
            throw new Error("Empty AI response.");

        response = response.trim();

        // Remove markdown fences
        response = response.replace(/```json/gi, "");
        response = response.replace(/```/g, "");

        const firstBrace = response.indexOf("{");
        const lastBrace = response.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1)
            throw new Error("JSON not found.");

        return response.substring(firstBrace, lastBrace + 1);

    }

    /**
     * ------------------------------------------------------
     * Parse JSON
     * ------------------------------------------------------
     */

    parseResponse(response) {

        try {

            const json = this.extractJSON(response);

            return JSON.parse(json);

        }

        catch (err) {

            throw new Error(
                "Invalid JSON returned by AI."
            );

        }

    }
        /**
     * ------------------------------------------------------
     * Retry AI
     * ------------------------------------------------------
     */

    async askAI(prompt, retries = 3) {

        let lastError = null;

        for (let i = 0; i < retries; i++) {

            try {

                const response =
                    await ollama.generate(prompt);

                return this.parseResponse(response);

            }

            catch (err) {

                lastError = err;

                console.log(
                    `AI Retry ${i + 1}/${retries}`
                );

            }

        }

        throw lastError;

    }
        /**
     * ------------------------------------------------------
     * Empty Result
     * ------------------------------------------------------
     */

    emptyResult() {

   return {
    executiveSummary: "",
    keyHighlights: [],
    actionItems: [],
    decisions: [],
    nextSteps: []
};

}
        /**
     * ------------------------------------------------------
     * Analyze Meeting
     * ------------------------------------------------------
     */

   async analyze(transcript) {

    try {

        const prompt = this.buildPrompt(transcript);

        const aiResult = await this.askAI(prompt);

        console.log(
            "========== AI RESULT =========="
        );

        console.log(
            JSON.stringify(aiResult, null, 2)
        );

        console.log(
            "================================"
        );

        return this.validate(aiResult);

    } catch (error) {

        console.error(
            "Analysis Error:",
            error.message
        );

        return this.emptyResult();

    }

}
        /**
     * ------------------------------------------------------
     * Validate Result
     * ------------------------------------------------------
     */


validate(data) {

    return {

        executiveSummary:

            data.executiveSummary || "",

        keyHighlights:

            Array.isArray(data.keyHighlights)

                ? data.keyHighlights

                    .filter(highlight =>
                        typeof highlight === "string" &&
                        highlight.trim() !== ""
                    )

                    .map(highlight =>
                        highlight.trim()
                    )

                : [],

        actionItems:

            Array.isArray(data.actionItems)

                ? data.actionItems

                    .filter(item =>

                        item &&

                        item.text &&

                        item.text.trim() !== ""

                    )

                    .map(item => ({

                        text:

                            item.text.trim(),

                        assignee:

                            item.assignee || "Unassigned",

                        priority:

                            (() => {

                                const p =

                                    (item.priority || "medium")

                                        .toLowerCase();

                                if (p === "high")

                                    return "High";

                                if (p === "low")

                                    return "low";

                                return "medium";

                            })()

                    }))

                : [],

        decisions:

            Array.isArray(data.decisions)

                ? data.decisions

                    .filter(item =>

                        item &&

                        item.text &&

                        item.text.trim() !== ""

                    )

                    .map(item => ({

                        text:

                            item.text.trim(),

                        madeBy:

                            item.madeBy || ""

                    }))

                : [],

        nextSteps:

            Array.isArray(data.nextSteps)

                ? data.nextSteps.filter(step =>

                    step &&

                    step.trim() !== ""

                )

                : []

    };

}

}

module.exports = new AnalysisService();