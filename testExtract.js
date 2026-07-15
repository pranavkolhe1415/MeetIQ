const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");

ffmpeg.setFfmpegPath(
    "C:\\Users\\PranavKolhe\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe"
);

ffmpeg.setFfprobePath(
    "C:\\Users\\PranavKolhe\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe"
);

const input = "./uploads/859cec20-e123-4520-81cd-3405c896dc54.mp4";
const output = "./uploads/audio/test.wav";

if (!fs.existsSync("./uploads/audio")) {
    fs.mkdirSync("./uploads/audio", { recursive: true });
}

console.log("Input exists:", fs.existsSync(input));

ffmpeg(input)
    .noVideo()
    .audioCodec("pcm_s16le")
    .audioChannels(1)
    .audioFrequency(16000)
    .format("wav")
    .on("start", cmd => {
        console.log(cmd);
    })
    .on("end", () => {
        console.log("✅ Audio Extracted");
        console.log("Output exists:", fs.existsSync(output));
    })
    .on("error", err => {
        console.log(err);
    })
    .save(output);

if (!fs.existsSync("./uploads/audio")) {
    fs.mkdirSync("./uploads/audio", { recursive: true });
}

console.log("Input exists:", fs.existsSync(input));

ffmpeg(input)
    .noVideo()
    .audioCodec("pcm_s16le")
    .audioChannels(1)
    .audioFrequency(16000)
    .format("wav")
    .on("start", cmd => {
        console.log("FFmpeg Command:");
        console.log(cmd);
    })
    .on("end", () => {
        console.log("✅ Audio extracted successfully.");
        console.log("Output exists:", fs.existsSync(output));
    })
    .on("error", err => {
        console.error("❌ FFmpeg Error:");
        console.error(err);
    })
    .save(output);