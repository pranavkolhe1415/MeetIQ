const transcription = require("./services/transcriptionService");

(async () => {

    const result = await transcription.transcribe(
        "./uploads/audio/test.wav"   // <-- replace with an actual WAV file
    );

    console.log(result);

})();