/**
 * ==========================================================
 * MeetIQ Meeting Routes
 * ==========================================================
 */

const express = require("express");

const router = express.Router();

const meetingController = require("../controllers/meetingController");

const { auth } = require("../middleware/auth");
const upload = require("../config/multer");

console.log("auth:", typeof auth);
console.log("upload:", typeof upload);
console.log("upload.single:", typeof upload.single);
console.log("uploadMeeting:", typeof meetingController.uploadMeeting);
console.log("processMeeting:", typeof meetingController.processMeeting);
/*
==========================================================
Upload Meeting
POST /api/meetings/upload
==========================================================
*/

router.post(

    "/upload",

    auth,

    upload.single("meeting"),

    meetingController.uploadMeeting

);

/*
==========================================================
Process Meeting
POST /api/meetings/:id/process
==========================================================
*/

router.post(

    "/:id/process",

    auth,

    meetingController.processMeeting

);

/*
==========================================================
Get All Meetings
GET /api/meetings
==========================================================
*/

router.get(

    "/",

    auth,

    meetingController.getMeetings

);

/*
==========================================================
Get Single Meeting
GET /api/meetings/:id
==========================================================
*/

router.get(

    "/:id",

    auth,

    meetingController.getMeeting

);

/*
==========================================================
Delete Meeting
DELETE /api/meetings/:id
==========================================================
*/

router.delete(

    "/:id",

   auth,

    meetingController.deleteMeeting

);

/*
==========================================================
Download PDF
GET /api/meetings/:id/pdf
==========================================================
*/

router.get(

    "/:id/pdf",

    auth,

    meetingController.downloadPDF

);

module.exports = router;