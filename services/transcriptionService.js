/**
 * ==========================================================
 * MeetIQ Whisper.cpp Transcription Service
 * ==========================================================
 */

const fs = require("fs");
const path = require("path");
const util = require("util");
const { exec } = require("child_process");

const execAsync = util.promisify(exec);

class TranscriptionService {

    constructor() {

        this.whisper = path.join(

            __dirname,

            "..",

            "whisper",

            "whisper-cli.exe"

        );

        this.model = path.join(

            __dirname,

            "..",

            "whisper",

            "models",

            "ggml-base.en.bin"

        );

    }
        /**
     * ------------------------------------------------------
     * Execute Whisper
     * ------------------------------------------------------
     */

   async runWhisper(audioFile) {

    const outputBase = audioFile;

    const command = `"${this.whisper}" \
-m "${this.model}" \
-otxt \
-of "${outputBase}" \
"${audioFile}"`;

    console.log(command);

    await execAsync(command);

    return outputBase + ".txt";

}
        /**
     * ------------------------------------------------------
     * Read Transcript
     * ------------------------------------------------------
     */

    readTranscript(txtFile){

        if(!fs.existsSync(txtFile))

            throw new Error(

                "Transcript not generated."

            );

        return fs

            .readFileSync(

                txtFile,

                "utf8"

            )

            .trim();

    }
        /**
     * ------------------------------------------------------
     * Clean Transcript
     * ------------------------------------------------------
     */

    clean(text){

        return text

        .replace(/\r/g," ")

        .replace(/\n+/g,"\n")

        .replace(/[ ]+/g," ")

        .trim();

    }
        /**
     * ------------------------------------------------------
     * Count Words
     * ------------------------------------------------------
     */

    countWords(transcript){

        return transcript

            .split(/\s+/)

            .filter(Boolean)

            .length;

    }

    /**
     * ------------------------------------------------------
     * Estimate Reading Time
     * ------------------------------------------------------
     */

    estimateReadingMinutes(words){

        return Math.max(

            1,

            Math.ceil(words / 180)

        );

    }

    /**
     * ------------------------------------------------------
     * Detect Language
     * ------------------------------------------------------
     */

    detectLanguage(text){

        if(/[ऀ-ॿ]/.test(text))

            return "Hindi";

        if(/[ঀ-৿]/.test(text))

            return "Bengali";

        if(/[઀-૿]/.test(text))

            return "Gujarati";

        if(/[ఀ-౿]/.test(text))

            return "Telugu";

        if(/[ಀ-೿]/.test(text))

            return "Kannada";

        if(/[ഀ-ൿ]/.test(text))

            return "Malayalam";

        if(/[଀-୿]/.test(text))

            return "Odia";

        if(/[அ-௿]/.test(text))

            return "Tamil";

        return "English";

    }

    /**
     * ------------------------------------------------------
     * Cleanup Generated Files
     * ------------------------------------------------------
     */

    cleanup(audioFile){

        const extensions=[

            ".txt",

            ".json",

            ".srt",

            ".vtt",

            ".csv"

        ];

        for(const ext of extensions){

            const file=audioFile+ext;

            try{

                if(fs.existsSync(file))

                    fs.unlinkSync(file);

            }

            catch{}

        }

    }

    /**
     * ------------------------------------------------------
     * Complete Transcription
     * ------------------------------------------------------
     */

    /**
 * ------------------------------------------------------
 * Complete Transcription
 * ------------------------------------------------------
 */

async transcribe(audioFile) {

    const txtFile = await this.runWhisper(audioFile);

    let transcript = this.readTranscript(txtFile);

    transcript = this.clean(transcript);

    if (!transcript || transcript.length < 10) {

        throw new Error("Unable to generate transcript.");

    }

    const words = this.countWords(transcript);

    const readingMinutes = this.estimateReadingMinutes(words);

    const language = this.detectLanguage(transcript);

    return {

        transcript,

        words,

        readingMinutes,

        language

    };

}
}
module.exports = new TranscriptionService();