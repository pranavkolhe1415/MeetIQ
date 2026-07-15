/**
 * ==========================================================
 * MeetIQ Embedding Service
 * ==========================================================
 * Uses Ollama embedding models
 * ==========================================================
 */

const axios = require("axios");

class EmbeddingService {

    constructor() {

        this.url = "http://localhost:11434/api/embeddings";

        this.model =
            process.env.EMBED_MODEL ||
            "nomic-embed-text";

    }

    /**
     * Generate embedding
     */

    async embed(text) {

        const response = await axios.post(

            this.url,

            {

                model: this.model,

                prompt: text

            }

        );

        return response.data.embedding;

    }
/**
 * Embed Meeting
 */

async embedMeeting(meeting){

    const text = [

        meeting.title,

        meeting.executiveSummary,

        meeting.meetingOverview,

        meeting.fullTranscript

    ]

    .filter(Boolean)

    .join("\n\n");

    return await this.embed(text);

}
/**
 * Embed Query
 */

async embedQuery(question){

    return await this.embed(question);

}
/**
 * Health Check
 */

async health(){

    try{

        await this.embed("hello");

        return true;

    }

    catch{

        return false;

    }

}
}

module.exports = new EmbeddingService();