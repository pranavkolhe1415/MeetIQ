/**
 * ==========================================================
 * MeetIQ Meeting Controller
 * ==========================================================
 */

const fs = require("fs");

const Meeting = require("../models/Meeting");

const aiService = require("../services/aiService");

const pdfService = require("../services/pdfService");

/**
 * ==========================================================
 * Upload Meeting
 * ==========================================================
 */

exports.uploadMeeting = async (req, res, next) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "Please upload an audio or video file."

            });

        }

        const duration = await aiService.getMediaDuration(

            req.file.path

        );

        const meeting = await Meeting.create({

            user: req.user._id,

            title:

                req.body.title ||

                req.file.originalname,

            description:

                req.body.description || "",

            originalFileName:

                req.file.originalname,

            fileName:

                req.file.filename,

            filePath:

                req.file.path,

            fileSize:

                req.file.size,

            mimeType:

                req.file.mimetype,

            fileType:

                req.file.mimetype.startsWith("video")

                    ? "video"

                    : "audio",

            duration,

            status: "uploaded",

            processingProgress: 0,

            processingStep: "Waiting for processing"

        });

        return res.status(201).json({

            success: true,

            message: "Meeting uploaded successfully.",

            data: {

                meeting

            }

        });

    }

    catch (error) {

        next(error);

    }

};
/**
 * ==========================================================
 * Update Meeting Progress
 * ==========================================================
 */

async function updateMeetingProgress(

    meeting,

    status,

    progress,

    step

) {

    meeting.status = status;

    meeting.processingProgress = progress;

    meeting.processingStep = step;

    await meeting.save();

}/**
 * ==========================================================
 * Process Meeting
 * ==========================================================
 */

exports.processMeeting = async (req, res, next) => {

    try {

        const meeting = await Meeting.findOne({

            _id: req.params.id,

            user: req.user._id

        });

        if (!meeting) {

            return res.status(404).json({

                success: false,

                message: "Meeting not found."

            });

        }

        if (meeting.status === "processing") {

            return res.status(400).json({

                success: false,

                message: "Meeting is already being processed."

            });

        }

        meeting.status = "processing";
        meeting.processingProgress = 0;
        meeting.processingStep = "Starting AI Pipeline...";

        await meeting.save();

        console.time("===== TOTAL AI PIPELINE =====");

        console.time("AI Analysis");

        const result = await aiService.analyzeMeeting(

            meeting,

            async (

                status,

                progress,

                step

            ) => {

                await updateMeetingProgress(

                    meeting,

                    status,

                    progress,

                    step

                );

            }

        );

        console.timeEnd("AI Analysis");

        meeting.fullTranscript =
            result.fullTranscript || "";

        meeting.executiveSummary =
            result.executiveSummary || "";

        meeting.meetingOverview =
            result.meetingOverview || "";

        meeting.detailedSummary =
            result.detailedSummary || "";

        meeting.keyDiscussionPoints =
            result.keyDiscussionPoints || [];

        meeting.actionItems =
            result.actionItems || [];

        meeting.decisions =
            result.decisions || [];

        meeting.deadlines =
            result.deadlines || [];

        meeting.risks =
            result.risks || [];

        meeting.blockers =
            result.blockers || [];

        meeting.nextSteps =
            result.nextSteps || [];

        meeting.importantQuotes =
            result.importantQuotes || [];

        meeting.metrics =
            result.metrics || {};

        meeting.processingProgress = 95;

        meeting.processingStep =
            "Generating PDF...";

        console.time("PDF Generation");

        try {

            const pdfPath = await pdfService.generatePDF(

                meeting

            );

            meeting.pdfGenerated = true;

            meeting.pdfPath = pdfPath;

        }

        catch (pdfError) {

            console.log(

                "PDF Error:",

                pdfError.message

            );

        }

        console.timeEnd("PDF Generation");

        meeting.status = "completed";

        meeting.processingProgress = 100;

        meeting.processingStep = "Completed";

        console.time("Mongo Save");

        await meeting.save();

        console.timeEnd("Mongo Save");

        console.timeEnd("===== TOTAL AI PIPELINE =====");

        return res.json({

            success: true,

            message: "Meeting processed successfully.",

            data: {

                meeting

            }

        });

    }

    catch (error) {

        console.error(error);

        next(error);

    }

};
/**
 * ==========================================================
 * Get All Meetings
 * ==========================================================
 */

exports.getMeetings = async (req, res, next) => {

    try {

        const meetings = await Meeting.find({

            user: req.user._id

        }).sort({

            createdAt: -1

        });

        const totalMeetings = meetings.length;

        const completedMeetings = meetings.filter(
            m => m.status === "completed"
        ).length;

        const processingMeetings = meetings.filter(
            m => m.status === "processing"
        ).length;

        const uploadedMeetings = meetings.filter(
            m => m.status === "uploaded"
        ).length;

        return res.json({

            success: true,

            data: {

                stats: {

                    totalMeetings,

                    completedMeetings,

                    processingMeetings,

                    uploadedMeetings

                },

                recentMeetings: meetings.slice(0, 5),

                meetings

            }

        });

    }

    catch (error) {

        next(error);

    }

};

/**
 * ==========================================================
 * Get Single Meeting
 * ==========================================================
 */

exports.getMeeting = async (req, res, next) => {

    try {

        const meeting = await Meeting.findOne({

            _id: req.params.id,

            user: req.user._id

        });

        if (!meeting) {

            return res.status(404).json({

                success: false,

                message: "Meeting not found."

            });

        }

        res.json({

            success: true,

            data: {

                meeting

            }

        });

    }

    catch (error) {

        next(error);

    }

};
/**
 * ==========================================================
 * Delete Meeting
 * ==========================================================
 */

exports.deleteMeeting = async (req, res, next) => {

    try {

        const meeting = await Meeting.findOne({

            _id: req.params.id,

            user: req.user._id

        });

        if (!meeting) {

            return res.status(404).json({

                success: false,

                message: "Meeting not found."

            });

        }

        if (

            meeting.filePath &&

            fs.existsSync(meeting.filePath)

        ) {

            fs.unlinkSync(meeting.filePath);

        }

        if (

            meeting.pdfPath &&

            fs.existsSync(meeting.pdfPath)

        ) {

            fs.unlinkSync(meeting.pdfPath);

        }

        await meeting.deleteOne();

        return res.json({

            success: true,

            message: "Meeting deleted successfully."

        });

    }

    catch (error) {

        next(error);

    }

};
/**
 * ==========================================================
 * Download PDF
 * ==========================================================
 */

exports.downloadPDF = async (req, res, next) => {

    try {

        const meeting = await Meeting.findOne({

            _id: req.params.id,

            user: req.user._id

        });

        if (!meeting) {

            return res.status(404).json({

                success: false,

                message: "Meeting not found."

            });

        }

        if (

            !meeting.pdfGenerated ||

            !meeting.pdfPath

        ) {

            return res.status(404).json({

                success: false,

                message: "PDF has not been generated."

            });

        }

        if (

            !fs.existsSync(meeting.pdfPath)

        ) {

            return res.status(404).json({

                success: false,

                message: "PDF file missing."

            });

        }

        return res.download(

            meeting.pdfPath,

            `${meeting.title}.pdf`

        );

    }

    catch (error) {

        next(error);

    }

};