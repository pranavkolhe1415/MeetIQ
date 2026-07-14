/**
 * Multer Configuration
 * Handles file uploads for audio and video meetings
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Upload folder
const uploadPath = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

// Allowed file types
const fileFilter = (req, file, cb) => {

    const allowedTypes = [

        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/mp4",
        "audio/x-m4a",
        "video/mp4",
        "video/x-msvideo",
        "video/quicktime",
        "video/x-matroska"

    ];

    if (allowedTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(new Error("Only Audio and Video files are allowed"), false);

    }

};

const upload = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 500 * 1024 * 1024 // 500MB

    }

});

module.exports = upload;