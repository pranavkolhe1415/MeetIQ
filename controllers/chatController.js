/**
 * ==========================================================
 * MeetIQ Chat Controller
 * ==========================================================
 */

const Meeting = require("../models/Meeting");
const chatService = require("../services/chatService");

/**
 * ----------------------------------------------------------
 * Chat With Meeting
 * ----------------------------------------------------------
 */

exports.chat = async (req, res, next) => {

    try {

        const { message } = req.body;

        if (!message || !message.trim()) {

            return res.status(400).json({

                success: false,

                message: "Question is required."

            });

        }

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

        const result = await chatService.chat(

            meeting,

            message

        );

        res.json(result);

    }

    catch (error) {

        next(error);

    }

};
/**
 * ----------------------------------------------------------
 * Suggested Questions
 * ----------------------------------------------------------
 */

exports.getSuggestions = async (req, res, next) => {

    try {

        res.json({

            success: true,

            suggestions:

                chatService.getSuggestions()

        });

    }

    catch (error) {

        next(error);

    }

};
/**
 * ----------------------------------------------------------
 * Meeting Summary
 * ----------------------------------------------------------
 */

exports.getSummary = async (req, res, next) => {

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

                title: meeting.title,

                executiveSummary: meeting.executiveSummary,

                meetingOverview: meeting.meetingOverview,

                detailedSummary: meeting.detailedSummary,

                keyDiscussionPoints: meeting.keyDiscussionPoints,

                actionItems: meeting.actionItems,

                decisions: meeting.decisions,

                deadlines: meeting.deadlines,

                risks: meeting.risks,

                blockers: meeting.blockers,

                nextSteps: meeting.nextSteps,

                importantQuotes: meeting.importantQuotes,

                metrics: meeting.metrics

            }

        });

    }

    catch (error) {

        next(error);

    }

};