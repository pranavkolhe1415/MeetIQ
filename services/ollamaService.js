/**
 * ==========================================================
 * MeetIQ - Ollama Service
 * ==========================================================
 * Handles communication with the local Ollama server.
 * Model: gemma2:2b
 * Base URL: http://127.0.0.1:11434
 * ==========================================================
 */

const fetch = require("node-fetch");

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://127.0.0.1:11434";

const MODEL =
  process.env.OLLAMA_MODEL || "gemma2:2b";

const DEFAULT_OPTIONS = {
  temperature: 0.2,
  top_p: 0.9,
  num_predict: 1024,
};

class OllamaService {

  /**
   * Check whether Ollama is running.
   */
  async healthCheck() {

    try {

      const response = await fetch(`${OLLAMA_URL}/api/tags`);

      return response.ok;

    } catch (error) {

      return false;

    }

  }

  /**
   * Send prompt to Ollama.
   */
  async generate(prompt, options = {}) {

    const body = {

      model: MODEL,

      prompt,

      stream: false,

      options: {

        ...DEFAULT_OPTIONS,

        ...options

      }

    };

    const response = await fetch(

      `${OLLAMA_URL}/api/generate`,

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"

        },

        body: JSON.stringify(body)

      }

    );

    if (!response.ok) {

      throw new Error(

        `Ollama request failed (${response.status})`

      );

    }

    const data = await response.json();

    return data.response.trim();

  }

  /**
   * Ask AI to return ONLY JSON.
   */
  /**
 * Ask Ollama to return JSON and safely parse it.
 */
async generateJSON(prompt) {

    const jsonPrompt = `
You are an AI meeting assistant.

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. Do NOT use markdown.
3. Do NOT explain anything.
4. Do NOT write \`\`\`json.
5. Response must begin with { and end with }.

${prompt}
`;

    const text = await this.generate(jsonPrompt);

    let cleaned = text.trim();

    // Remove markdown fences
    cleaned = cleaned.replace(/```json/gi, "");
    cleaned = cleaned.replace(/```/g, "");

    // Extract JSON object if AI added extra text
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
        cleaned = cleaned.substring(start, end + 1);
    }

    try {

        return JSON.parse(cleaned);

    } catch (error) {

        console.log("\n========== AI RAW RESPONSE ==========\n");
        console.log(text);
        console.log("\n=====================================\n");

        throw new Error("AI returned invalid JSON.");

    }

}
  /**
   * Stream response (future support)
   */
  async stream(prompt, onChunk) {

    const response = await fetch(

      `${OLLAMA_URL}/api/generate`,

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"

        },

        body: JSON.stringify({

          model: MODEL,

          prompt,

          stream: true

        })

      }

    );

    if (!response.ok) {

      throw new Error("Unable to stream.");

    }

    const reader = response.body.getReader();

    const decoder = new TextDecoder();

    while (true) {

      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);

      chunk

        .split("\n")

        .filter(Boolean)

        .forEach(line => {

          try {

            const json = JSON.parse(line);

            if (json.response) {

              onChunk(json.response);

            }

          } catch (e) {}

        });

    }

  }

}

module.exports = new OllamaService();