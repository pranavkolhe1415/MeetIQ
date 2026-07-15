const embedding = require("./services/embeddingService");

(async () => {

    const ok = await embedding.health();

    console.log("Health:", ok);

    const vector = await embedding.embed(

        "Pranav completed the backend."

    );

    console.log(

        "Dimensions:",

        vector.length

    );

})();