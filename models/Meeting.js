/**
 * ==========================================================
 * MeetIQ Meeting Model
 * ==========================================================
 */

const mongoose = require("mongoose");

/* ==========================================================
   Transcript Segment
========================================================== */

const transcriptSchema = new mongoose.Schema({

    text: {
        type: String,
        required: true
    },

    startTime: {
        type: Number,
        default: 0
    },

    endTime: {
        type: Number,
        default: 0
    }

}, {
    _id: false
});

/* ==========================================================
   Action Item
========================================================== */

const actionItemSchema = new mongoose.Schema({

    text: {
        type: String,
        required: true
    },

    assignee: {
        type: String,
        default: "Unassigned"
    },

    priority: {
        type: String,
        enum: ["High", "medium", "low"],
        default: "medium"
    },

    dueDate: {
        type: String,
        default: ""
    },

    completed: {
        type: Boolean,
        default: false
    }

}, {
    _id: false
});

/* ==========================================================
   Decision
========================================================== */

const decisionSchema = new mongoose.Schema({

    text: {
        type: String,
        required: true
    },

    madeBy: {
        type: String,
        default: ""
    }

}, {
    _id: false
});

/* ==========================================================
   Deadline
========================================================== */

const deadlineSchema = new mongoose.Schema({

    task: {
        type: String,
        default: ""
    },

    date: {
        type: String,
        default: ""
    }

}, {
    _id: false
});

/* ==========================================================
   Quote
========================================================== */

const quoteSchema = new mongoose.Schema({

    text: {
        type: String,
        required: true
    },

    speaker: {
        type: String,
        default: ""
    }

}, {
    _id: false
});

const meetingSchema = new mongoose.Schema({

    /* ======================================================
       Owner
    ====================================================== */

    user:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        required:true,

        index:true

    },

    /* ======================================================
       Basic Information
    ====================================================== */

    title:{

        type:String,

        default:"Untitled Meeting",

        trim:true

    },

    description:{

        type:String,

        default:""

    },

    meetingDate:{

        type:Date,

        default:Date.now

    },

    /* ======================================================
       Uploaded File
    ====================================================== */

    originalFileName:String,

    fileName:String,

    filePath:String,

    fileSize:{

        type:Number,

        default:0

    },

    fileType:String,

    mimeType:String,

    duration:{

        type:Number,

        default:0

    },

    thumbnail:{

        type:String,

        default:""

    },

    /* ======================================================
       Processing
    ====================================================== */

    status:{

        type:String,

        enum:[

            "uploaded",

            "processing",

            "extracting_audio",

            "transcribing",

            "analyzing",

            "generating_report",

            "completed",

            "failed"

        ],

        default:"uploaded"

    },

    processingProgress:{

        type:Number,

        default:0

    },

    processingStep:{

        type:String,

        default:""

    },

    processingTime:{

        type:Number,

        default:0

    },

    errorMessage:{

        type:String,

        default:""

    },

    aiModel:{

        type:String,

        default:"gemma2:2b"

    },

    language:{

        type:String,

        default:"English"

    },

    readingMinutes:{

        type:Number,

        default:0

    },

    /* ======================================================
       Transcript
    ====================================================== */

    fullTranscript:{

        type:String,

        default:""

    },

    transcript:[transcriptSchema],

    /* ======================================================
       AI Summaries
    ====================================================== */

    executiveSummary:{

        type:String,

        default:""

    },

    meetingOverview:{

        type:String,

        default:""

    },

    detailedSummary:{

        type:String,

        default:""

    },

    keyDiscussionPoints:[

        {

            type:String

        }

    ],

    /* ======================================================
       AI Results
    ====================================================== */

    actionItems:[actionItemSchema],

    decisions:[decisionSchema],

    deadlines:[deadlineSchema],

    risks:[

        {

            type:String

        }

    ],

    blockers:[

        {

            type:String

        }

    ],

    nextSteps:[

        {

            type:String

        }

    ],

    importantQuotes:[quoteSchema],

    /* ======================================================
       Metrics
    ====================================================== */

    metrics:{

        totalWords:{

            type:Number,

            default:0

        },

        engagementScore:{

            type:Number,

            default:0

        },

        meetingEfficiency:{

            type:Number,

            default:0

        }

    },

    /* ======================================================
       PDF
    ====================================================== */

    pdfPath:{

        type:String,

        default:""

    },

    pdfGenerated:{

        type:Boolean,

        default:false

    }

},{
    timestamps:true
});
meetingSchema.index({

    title:"text",

    fullTranscript:"text",

    executiveSummary:"text",

    detailedSummary:"text"

});

meetingSchema.index({

    user:1,

    createdAt:-1

});

module.exports = mongoose.model(

    "Meeting",

    meetingSchema

);