const ollama = require("./services/ollamaService");

(async () => {

    const ok = await ollama.healthCheck();

    console.log("Health:", ok);

    const reply = await ollama.generate(
        "Say Hello from MeetIQ."
    );

    console.log(reply);

})();