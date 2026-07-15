/**
 * ==========================================================
 * MeetIQ Report Service
 * ==========================================================
 * Builds the final AI report from:
 *
 * - Transcription
 * - Speaker Analysis
 * - AI Analysis
 * - Metrics
 *
 * ==========================================================
 */

class ReportService {

    build({

        meeting,

        transcript,

        participants,

        analysis,

        metrics

    }) {

        return {

            title:
                analysis.title || meeting.title,

            fullTranscript:
                transcript,

            transcript:
                participants.transcript || [],

            executiveSummary:
                analysis.executiveSummary || "",

            meetingOverview:
                analysis.meetingOverview || "",

            participants:
                participants.participants || [],

            actionItems:
                analysis.actionItems || [],

            decisions:
                analysis.decisions || [],

            importantQuotes:
                analysis.importantQuotes || [],

            metrics,

            tags:
                analysis.topics || []

        };

    }
/**
 * ------------------------------------------------------
 * Dashboard Statistics
 * ------------------------------------------------------
 */

buildDashboard(report){

    return{

        duration:
            report.metrics.duration || 0,

        speakers:
            report.metrics.totalSpeakers,

        words:
            report.metrics.totalWords,

        engagement:
            report.metrics.engagementScore,

        efficiency:
            report.metrics.meetingEfficiency,

        sentiment:
            report.metrics.averageSentiment,

        topics:
            report.tags.length,

        actionItems:
            report.actionItems.length,

        decisions:
            report.decisions.length

    };

}
/**
 * ------------------------------------------------------
 * Searchable Text
 * ------------------------------------------------------
 */

buildSearchText(report){

    let text="";

    text+=report.title+"\n";

    text+=report.executiveSummary+"\n";

    text+=report.meetingOverview+"\n";

    text+=report.fullTranscript+"\n";

    report.actionItems.forEach(a=>{

        text+=a.text+"\n";

    });

    report.decisions.forEach(d=>{

        text+=d.text+"\n";

    });

    return text;

}
/**
 * ------------------------------------------------------
 * Chat Context
 * ------------------------------------------------------
 */

buildChatContext(report){

    return{

        summary:
            report.executiveSummary,

        overview:
            report.meetingOverview,

        transcript:
            report.fullTranscript,

        actionItems:
            report.actionItems,

        decisions:
            report.decisions,

        quotes:
            report.importantQuotes,

        participants:
            report.participants

    };

}
}

module.exports = new ReportService();