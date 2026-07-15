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

"executiveSummary":"",

"actionItems":[

{

"text":"",

"assignee":"",

"priority":"Medium"

}

],

"decisions":[

{

"text":"",

"madeBy":""

}

],

"nextSteps":[

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

Generate ONLY these four sections:

1. Executive Summary
2. Action Items
3. Decisions
4. Next Steps

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

            if (!transcript || transcript.trim().length < 20) {

                throw new Error(
                    "Transcript is empty or too short."
                );

            }

            const prompt =
                this.buildPrompt(transcript);

            const aiResult =
                await this.askAI(prompt);

            return this.validate(aiResult);

        }

        catch (err) {

            console.error(
                "Analysis Error:",
                err.message
            );

            return this.emptyResult();

        }

    }
        /**
     * ------------------------------------------------------
     * Validate Result
     * ------------------------------------------------------
     */

    /**
 * ------------------------------------------------------
 * Validate Result
 * ------------------------------------------------------
 */

validate(data) {

    return {

        executiveSummary:

            data.executiveSummary || "",

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