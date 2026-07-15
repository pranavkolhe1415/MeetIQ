const analysis = require("./services/analysisService");

(async()=>{

const transcript=`

Pranav will complete backend.

Rahul will finish frontend.

Everyone agreed to deploy next Friday.

`;

console.log(

await analysis.executiveSummary(transcript)

);

})();