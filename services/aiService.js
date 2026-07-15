/**
 * ==========================================================
 * MeetIQ AI Service
 * ==========================================================
 * Complete AI Processing Pipeline
 *
 * Video/Audio
 *      ↓
 * FFmpeg
 *      ↓
 * Whisper.cpp
 *      ↓
 * Ollama AI
 *      ↓
 * MongoDB
 * ==========================================================
 */

const fs = require("fs");
const path = require("path");

const ffmpeg = require("fluent-ffmpeg");

// Configure FFmpeg
ffmpeg.setFfmpegPath(
    "C:\\Users\\PranavKolhe\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe"
);

ffmpeg.setFfprobePath(
    "C:\\Users\\PranavKolhe\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe"
);

const transcriptionService = require("./transcriptionService");
const analysisService = require("./analysisService");
class AIService {

    constructor(){

        this.audioFolder = path.join(

            __dirname,

            "..",

            "uploads",

            "audio"

        );

        if(!fs.existsSync(this.audioFolder)){

            fs.mkdirSync(

                this.audioFolder,

                {

                    recursive:true

                }

            );

        }

    }
        /**
     * ------------------------------------------------------
     * Detect Video
     * ------------------------------------------------------
     */

       /**
     * ------------------------------------------------------
     * Detect Video File
     * ------------------------------------------------------
     */

    isVideo(file){

        const extensions=[

            ".mp4",

            ".avi",

            ".mov",

            ".mkv",

            ".webm",

            ".flv",

            ".wmv"

        ];

        return extensions.includes(

            path.extname(file)

            .toLowerCase()

        );

    }
    /**
     * ------------------------------------------------------
     * Audio Extraction
     * ------------------------------------------------------
     */

        /**
     * ------------------------------------------------------
     * Extract Audio
     * ------------------------------------------------------
     */

    async extractAudio(videoFile){

        return new Promise((resolve,reject)=>{

            const output=

            path.join(

                this.audioFolder,

                Date.now()+".wav"

            );

            ffmpeg(videoFile)

            .noVideo()

            .audioCodec("pcm_s16le")

            .audioChannels(1)

            .audioFrequency(16000)

            .format("wav")

            .save(output)

            .on("end",()=>{

                resolve(output);

            })

            .on("error",(err)=>{

                reject(err);

            });

        });

    }
        /**
     * ------------------------------------------------------
     * Prepare File
     * ------------------------------------------------------
     */

       /**
     * ------------------------------------------------------
     * Prepare Media
     * ------------------------------------------------------
     */

    async prepare(file){

        if(this.isVideo(file))

            return await this.extractAudio(file);

        return file;

    }
        /**
     * ------------------------------------------------------
     * Analyze Transcript
     * ------------------------------------------------------
     */

    async analyzeTranscript(transcript){

        return await analysisService.analyze(

            transcript

        );

    }
        /**
     * ------------------------------------------------------
     * Complete AI Pipeline
     * ------------------------------------------------------
     */

        /**
     * ======================================================
     * Complete AI Pipeline
     * ======================================================
     */

    async analyzeMeeting(meeting, updateProgress){

        let audioFile = null;

        try{

            /*
            ==========================================
            STEP 1
            ==========================================
            */

            await updateProgress(

                "extracting_audio",

                10,

                "Preparing media..."

            );

            audioFile = await this.prepare(

                meeting.filePath

            );

            /*
            ==========================================
            STEP 2
            ==========================================
            */

            await updateProgress(

                "transcribing",

                30,

                "Transcribing meeting..."

            );

            const transcription =

                await transcriptionService.transcribe(

                    audioFile

                );

            const transcript =

                transcription.transcript;

            /*
            ==========================================
            STEP 3
            ==========================================
            */

            await updateProgress(

                "analyzing",

                50,

                "Generating AI insights..."

            );

       
const MAX_WORDS = 1500;

const shortTranscript = transcript
    .split(/\s+/)
    .slice(0, MAX_WORDS)
    .join(" ");

const analysis = await analysisService.analyze(
    shortTranscript
);
                            /*
            ==========================================
            STEP 5
            ==========================================
            */

            await updateProgress(

                "generating_report",

                90,

                "Preparing final report..."

            );

            const metrics = {

                totalWords: transcription.words,

                engagementScore: Math.min(
                    100,
                    Math.round(transcription.words / 8)
                ),

                meetingEfficiency: Math.min(
                    100,
                    Math.round(transcription.words / 10)
                ),

                estimatedReadingMinutes:
                    transcription.readingMinutes

            };

            /*
            ==========================================
            STEP 6
            ==========================================
            */

         const result = {

    fullTranscript: transcript,

    executiveSummary:
        analysis.executiveSummary,

    actionItems:
        analysis.actionItems,

    decisions:
        analysis.decisions,

    nextSteps:
        analysis.nextSteps,

    meetingOverview: "",

    detailedSummary: "",

    keyDiscussionPoints: [],

    deadlines: [],

    risks: [],

    blockers: [],

    importantQuotes: [],

    metrics

}
            await updateProgress(

                "completed",

                100,

                "Meeting analysis completed."

            );

            this.cleanup(audioFile);

            return result;

        }

        catch(error){

            this.cleanup(audioFile);

            console.error(

                "AI Service Error:",

                error

            );

            throw error;

        }

    }
    
         /**
     * ------------------------------------------------------
     * Get Media Duration
     * ------------------------------------------------------
     */

    async getMediaDuration(file){

        return new Promise((resolve,reject)=>{

            ffmpeg.ffprobe(

                file,

                (err,data)=>{

                    if(err)

                        return reject(err);

                    resolve(

                        Math.round(

                            data.format.duration || 0

                        )

                    );

                }

            );

        });

    }

    /**
     * ------------------------------------------------------
     * Cleanup
     * ------------------------------------------------------
     */

    cleanup(audioFile){

        try{

            if(

                audioFile &&

                fs.existsSync(audioFile)

            ){

                fs.unlinkSync(audioFile);

            }

        }

        catch(err){

            console.log(

                err.message

            );

        }

    }

}
const aiService = new AIService();

module.exports = {

    analyzeMeeting:
        aiService.analyzeMeeting.bind(aiService),

    getMediaDuration:
        aiService.getMediaDuration.bind(aiService)

};