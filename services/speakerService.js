/**
 * ==========================================================
 * MeetIQ Speaker Service
 * ==========================================================
 * Responsible for:
 * 1. Speaker segmentation
 * 2. Participant statistics
 * 3. Speaking time
 * 4. Speaking percentage
 * ==========================================================
 */

class SpeakerService {

    constructor() {

        this.defaultSpeakers = 4;

    }

    /**
     * ------------------------------------------------------
     * Split Transcript
     * ------------------------------------------------------
     */

    splitTranscript(transcript) {

        return transcript
            .split(/\n+/)
            .map(line => line.trim())
            .filter(Boolean);

    }

    /**
     * ------------------------------------------------------
     * Generate Segments
     * ------------------------------------------------------
     */

    generateSegments(transcript) {

        const lines = this.splitTranscript(transcript);

        const segments = [];

        let currentTime = 0;

        let speaker = 1;

        for (const line of lines) {

            const words = line.split(/\s+/).length;

            const duration = Math.max(
                3,
                Math.round(words / 2)
            );

            segments.push({

                speaker: `Speaker ${speaker}`,

                speakerId: `speaker_${speaker}`,

                text: line,

                startTime: currentTime,

                endTime: currentTime + duration

            });

            currentTime += duration;

            speaker++;

            if (speaker > this.defaultSpeakers)
                speaker = 1;

        }

        return segments;

    }
/**
 * ------------------------------------------------------
 * Build Participants
 * ------------------------------------------------------
 */

buildParticipants(segments) {

    const speakers = {};

    for (const segment of segments) {

        if (!speakers[segment.speaker]) {

            speakers[segment.speaker] = {

                name: segment.speaker,

                speakerId: segment.speakerId,

                avatar: "",

                speakingTime: 0,

                speakingPercentage: 0,

                speechCount: 0

            };

        }

        const duration =
            segment.endTime - segment.startTime;

        speakers[segment.speaker].speakingTime += duration;

        speakers[segment.speaker].speechCount++;

    }

    const participants =
        Object.values(speakers);

    const totalTime =
        participants.reduce(

            (sum, p) => sum + p.speakingTime,

            0

        );

    participants.forEach(p => {

        p.speakingPercentage =
            totalTime === 0
                ? 0
                : Number(

                    (
                        p.speakingTime /
                        totalTime *
                        100
                    ).toFixed(1)

                );

    });

    return participants;

}
/**
 * ------------------------------------------------------
 * Build Complete Speaker Analysis
 * ------------------------------------------------------
 */

analyze(transcript) {

    const segments =
        this.generateSegments(transcript);

    const participants =
        this.buildParticipants(segments);

    return {

        transcript: segments,

        participants

    };

}
}

module.exports = new SpeakerService();