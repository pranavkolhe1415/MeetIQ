/**
 * ==========================================================
 * MeetIQ Vector Service
 * ==========================================================
 * Stores embeddings for semantic search.
 * ==========================================================
 */

class VectorService {

    constructor() {

        this.memory = new Map();

    }

    /**
     * Save embedding
     */
    save(meetingId, embedding, text) {

        this.memory.set(meetingId.toString(), {

            embedding,

            text

        });

    }

    /**
     * Get embedding
     */

    get(meetingId) {

        return this.memory.get(

            meetingId.toString()

        );

    }

    /**
     * Get all vectors
     */

    getAll() {

        return [...this.memory.values()];

    }
/**
 * Cosine Similarity
 */

similarity(a,b){

    let dot=0;

    let magA=0;

    let magB=0;

    for(let i=0;i<a.length;i++){

        dot+=a[i]*b[i];

        magA+=a[i]*a[i];

        magB+=b[i]*b[i];

    }

    magA=Math.sqrt(magA);

    magB=Math.sqrt(magB);

    return dot/(magA*magB);

}
/**
 * Search
 */

search(queryEmbedding,limit=5){

    const results=[];

    for(const item of this.memory.values()){

        results.push({

            score:this.similarity(

                queryEmbedding,

                item.embedding

            ),

            text:item.text

        });

    }

    return results

        .sort((a,b)=>b.score-a.score)

        .slice(0,limit);

}
}

module.exports = new VectorService();