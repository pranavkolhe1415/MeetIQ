/**
 * Chat Service - AI-powered meeting Q&A using transcript context
 */
const fetch = require('node-fetch');
const HF_API_URL = 'https://api-inference.huggingface.co/models';

async function answerQuestion(question, transcript, participants) {
  const lowerQ = question.toLowerCase();

  // Local answers for common questions
  if (lowerQ.includes('who talked') || lowerQ.includes('who spoke') || lowerQ.includes('most')) {
    if (participants?.length) {
      const sorted = [...participants].sort((a,b) => b.speakingTime - a.speakingTime);
      const top = sorted[0];
      return `${top.name} spoke the most with ${top.speakingPercentage}% of the total speaking time (${Math.round(top.speakingTime/60)} minutes, ${top.speechCount} turns).`;
    }
  }

  if (lowerQ.includes('action item') || lowerQ.includes('to do') || lowerQ.includes('task')) {
    return 'You can find all action items in the "Action Items" section on the right panel. They include task assignments, priorities, and deadlines identified from the meeting discussion.';
  }

  if (lowerQ.includes('decision') || lowerQ.includes('decided')) {
    return 'Check the "Key Decisions" section in the report panel for all decisions made during this meeting, including who proposed them and the context.';
  }

  if (lowerQ.includes('summarize') || lowerQ.includes('summary') || lowerQ.includes('overview')) {
    if (transcript && transcript.length > 100) {
      return transcript.substring(0, 500) + '...\n\nFor the full summary, check the Executive Summary section.';
    }
  }

  if (lowerQ.includes('participant') || lowerQ.includes('attendee') || lowerQ.includes('people')) {
    if (participants?.length) {
      const list = participants.map(p => `• ${p.name} (${p.speakingPercentage}%)`).join('\n');
      return `Meeting participants:\n${list}`;
    }
  }

  // Try HuggingFace for general questions
  try {
    const context = transcript?.substring(0, 2000) || '';
    const result = await fetch(`${HF_API_URL}/google/flan-t5-large`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Answer based on this meeting transcript:\n${context}\n\nQuestion: ${question}`,
        parameters: { max_new_tokens: 300, temperature: 0.5 },
      }),
    });

    if (result.ok) {
      const data = await result.json();
      if (data?.[0]?.generated_text) return data[0].generated_text;
    }
  } catch (e) {
    console.error('Chat AI error:', e.message);
  }

  // Fallback response
  return `Based on the meeting transcript, I can help you with:\n• Meeting summary and overview\n• Who spoke the most\n• Action items and tasks\n• Key decisions made\n• Searching the transcript\n\nPlease try asking a more specific question about the meeting content.`;
}

module.exports = { answerQuestion };
