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

        console.log("=================================");
        console.log("Starting Whisper transcription");
        console.log("Audio file:", audioFile);
        console.log("=================================");

        // Check audio file exists
        if (!fs.existsSync(audioFile)) {

            throw new Error(
                `Audio file not found: ${audioFile}`
            );

        }

        // Check audio file is not empty
        const audioStats = fs.statSync(audioFile);

        if (audioStats.size === 0) {

            throw new Error(
                `Audio file is empty: ${audioFile}`
            );

        }

        console.log(
            "Audio file size:",
            audioStats.size,
            "bytes"
        );

        // --------------------------------------------------
        // Remove .wav from output filename
        //
        // Input:
        // 1790749321428.wav
        //
        // Output base:
        // 1790749321428
        //
        // Whisper creates:
        // 1790749321428.txt
        // --------------------------------------------------

        const outputBase = path.join(
            path.dirname(audioFile),
            path.basename(
                audioFile,
                path.extname(audioFile)
            )
        );

        const command =
            `"${this.whisper}" ` +
            `-m "${this.model}" ` +
            `-otxt ` +
            `-of "${outputBase}" ` +
            `"${audioFile}"`;

        console.log("Whisper command:");
        console.log(command);

        try {

            const {
                stdout,
                stderr
            } = await execAsync(command);

            if (stdout) {

                console.log(
                    "Whisper stdout:"
                );

                console.log(stdout);

            }

            if (stderr) {

                console.log(
                    "Whisper stderr:"
                );

                console.log(stderr);

            }

        } catch (error) {

            console.error(
                "Whisper execution failed"
            );

            console.error(
                error.message
            );

            if (error.stdout) {

                console.error(
                    "Whisper stdout:"
                );

                console.error(
                    error.stdout
                );

            }

            if (error.stderr) {

                console.error(
                    "Whisper stderr:"
                );

                console.error(
                    error.stderr
                );

            }

            throw new Error(
                `Whisper execution failed: ${error.message}`
            );

        }

        // Whisper output file
        const txtFile =
            outputBase + ".txt";

        console.log(
            "Expected transcript:",
            txtFile
        );

        // Verify transcript exists
        if (!fs.existsSync(txtFile)) {

            throw new Error(
                `Whisper completed but transcript was not generated: ${txtFile}`
            );

        }

        console.log(
            "Transcript successfully generated."
        );

        return txtFile;

    }


    /**
     * ------------------------------------------------------
     * Read Transcript
     * ------------------------------------------------------
     */

    readTranscript(txtFile) {

        if (!fs.existsSync(txtFile)) {

            throw new Error(
                `Transcript not generated: ${txtFile}`
            );

        }

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

    clean(text) {

        return text
            .replace(/\r/g, " ")
            .replace(/\n+/g, "\n")
            .replace(/[ ]+/g, " ")
            .trim();

    }


    /**
     * ------------------------------------------------------
     * Count Words
     * ------------------------------------------------------
     */

    countWords(transcript) {

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

    estimateReadingMinutes(words) {

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

    detectLanguage(text) {

        if (/[ऀ-ॿ]/.test(text))
            return "Hindi";

        if (/[ঀ-৿]/.test(text))
            return "Bengali";

        if (/[઀-૿]/.test(text))
            return "Gujarati";

        if (/[ఀ-౿]/.test(text))
            return "Telugu";

        if (/[ಀ-೿]/.test(text))
            return "Kannada";

        if (/[ഀ-ൿ]/.test(text))
            return "Malayalam";

        if (/[଀-୿]/.test(text))
            return "Odia";

        if (/[அ-௿]/.test(text))
            return "Tamil";

        return "English";

    }


    /**
     * ------------------------------------------------------
     * Cleanup Generated Files
     * ------------------------------------------------------
     */

    cleanup(audioFile) {

        const extensions = [
            ".txt",
            ".json",
            ".srt",
            ".vtt",
            ".csv"
        ];

        for (const ext of extensions) {

            const file =
                audioFile + ext;

            try {

                if (fs.existsSync(file)) {

                    fs.unlinkSync(file);

                }

            } catch (error) {

                console.warn(
                    `Could not delete ${file}:`,
                    error.message
                );

            }

        }

    }


    /**
     * ------------------------------------------------------
     * Complete Transcription
     * ------------------------------------------------------
     */

    async transcribe(audioFile) {

        console.log(
            "\n========== TRANSCRIPTION =========="
        );

        console.log(
            "Received audio file:"
        );

        console.log(audioFile);

        // Check audio file before Whisper
        if (!fs.existsSync(audioFile)) {

            throw new Error(
                `Audio file does not exist: ${audioFile}`
            );

        }

        const txtFile =
            await this.runWhisper(audioFile);

        console.log(
            "Reading transcript:",
            txtFile
        );

        let transcript =
            this.readTranscript(txtFile);

        transcript =
            this.clean(transcript);

        if (
            !transcript ||
            transcript.length < 10
        ) {

            throw new Error(
                `Transcript is empty or too short: ${txtFile}`
            );

        }

        const words =
            this.countWords(transcript);

        const readingMinutes =
            this.estimateReadingMinutes(
                words
            );

        const language =
            this.detectLanguage(
                transcript
            );

        console.log(
            "Transcript words:",
            words
        );

        console.log(
            "Detected language:",
            language
        );

        console.log(
            "==================================\n"
        );

        return {

            transcript,

            words,

            readingMinutes,

            language

        };

    }

}

module.exports =
    new TranscriptionService();