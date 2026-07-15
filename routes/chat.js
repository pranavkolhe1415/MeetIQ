const express = require("express");

const router = express.Router();

const { auth } = require("../middleware/auth");

const {

    chat,

    getSuggestions,

    getSummary

} = require("../controllers/chatController");

router.post(

    "/:id",

    auth,

    chat

);

router.get(

    "/:id/suggestions",

    auth,

    getSuggestions

);

router.get(

    "/:id/summary",

    auth,

    getSummary

);

module.exports = router;