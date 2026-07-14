/**
 * PDF Service - Generate professional meeting reports using PDFKit
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

async function generatePDF(meeting) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      const pdfPath = path.join(pdfDir, `report_${meeting._id}.pdf`);
      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 }, bufferPages: true });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Colors
      const primary = '#6C5CE7';
      const dark = '#1a1a2e';
      const gray = '#64748b';
      const light = '#f8fafc';

      // --- Header ---
      doc.rect(0, 0, doc.page.width, 120).fill(primary);
      doc.fontSize(28).fill('#ffffff').text('MeetIQ', 50, 35, { align: 'left' });
      doc.fontSize(10).fill('#e0d4ff').text('AI Meeting Intelligence Report', 50, 70);
      doc.fontSize(9).fill('#c4b5fd').text(`Generated: ${formatDate(new Date())}`, 50, 88);

      doc.moveDown(4);
      doc.fill(dark);

      // --- Meeting Title ---
      doc.fontSize(22).fill(primary).text(meeting.title || 'Meeting Report', 50, 140);
      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke(primary);
      doc.moveDown(1);

      // --- Meeting Info ---
      doc.fontSize(10).fill(gray);
      doc.text(`Date: ${formatDate(meeting.meetingDate || meeting.createdAt)}`, 50);
      doc.text(`Duration: ${formatDuration(meeting.duration || 0)}`);
      doc.text(`Participants: ${meeting.participants?.length || 0}`);
      doc.text(`Status: ${meeting.status}`);
      doc.moveDown(1.5);

      // --- Executive Summary ---
      if (meeting.executiveSummary) {
        doc.fontSize(16).fill(primary).text('Executive Summary');
        doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#e2e8f0');
        doc.moveDown(0.5);
        doc.fontSize(10).fill(dark).text(meeting.executiveSummary, { lineGap: 4 });
        doc.moveDown(1.5);
      }

      // --- Meeting Overview ---
      if (meeting.meetingOverview) {
        doc.fontSize(16).fill(primary).text('Meeting Overview');
        doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#e2e8f0');
        doc.moveDown(0.5);
        doc.fontSize(10).fill(dark).text(meeting.meetingOverview, { lineGap: 4 });
        doc.moveDown(1.5);
      }

      // --- Participants ---
      if (meeting.participants?.length) {
        doc.addPage();
        doc.fontSize(16).fill(primary).text('Participants');
        doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#e2e8f0');
        doc.moveDown(0.5);
        meeting.participants.forEach(p => {
          doc.fontSize(11).fill(dark).text(`• ${p.name}`, 60);
          doc.fontSize(9).fill(gray).text(`  Speaking Time: ${formatDuration(p.speakingTime)} (${p.speakingPercentage}%) | Turns: ${p.speechCount}`, 70);
          doc.moveDown(0.3);
        });
        doc.moveDown(1);
      }

      // --- Action Items ---
      if (meeting.actionItems?.length) {
        doc.fontSize(16).fill(primary).text('Action Items');
        doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#e2e8f0');
        doc.moveDown(0.5);
        meeting.actionItems.forEach((item, i) => {
          const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
          doc.fontSize(10).fill(dark).text(`${i+1}. ${item.text}`, 60);
          doc.fontSize(8).fill(priorityColors[item.priority] || gray).text(`   Priority: ${item.priority?.toUpperCase()} | Assignee: ${item.assignee}`, 70);
          doc.moveDown(0.3);
        });
        doc.moveDown(1);
      }

      // --- Decisions ---
      if (meeting.decisions?.length) {
        doc.fontSize(16).fill(primary).text('Key Decisions');
        doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#e2e8f0');
        doc.moveDown(0.5);
        meeting.decisions.forEach((d, i) => {
          doc.fontSize(10).fill(dark).text(`${i+1}. ${d.text}`, 60);
          if (d.madeBy) doc.fontSize(8).fill(gray).text(`   Decision by: ${d.madeBy}`, 70);
          doc.moveDown(0.3);
        });
        doc.moveDown(1);
      }

      // --- Important Quotes ---
      if (meeting.importantQuotes?.length) {
        doc.fontSize(16).fill(primary).text('Important Quotes');
        doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#e2e8f0');
        doc.moveDown(0.5);
        meeting.importantQuotes.forEach(q => {
          doc.fontSize(10).fill(dark).text(`"${q.text}"`, 60, undefined, { oblique: true });
          if (q.speaker) doc.fontSize(8).fill(gray).text(`   — ${q.speaker}`, 70);
          doc.moveDown(0.4);
        });
        doc.moveDown(1);
      }

      // --- Metrics ---
      if (meeting.metrics) {
        doc.addPage();
        doc.fontSize(16).fill(primary).text('Meeting Metrics');
        doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#e2e8f0');
        doc.moveDown(0.5);
        const m = meeting.metrics;
        doc.fontSize(10).fill(dark);
        doc.text(`Total Speakers: ${m.totalSpeakers}`, 60);
        doc.text(`Total Words: ${m.totalWords}`, 60);
        doc.text(`Sentiment: ${m.averageSentiment}`, 60);
        doc.text(`Engagement Score: ${m.engagementScore}%`, 60);
        doc.text(`Meeting Efficiency: ${m.meetingEfficiency}%`, 60);
        if (m.topicsDiscussed?.length) {
          doc.moveDown(0.5);
          doc.text(`Topics: ${m.topicsDiscussed.join(', ')}`, 60);
        }
        doc.moveDown(1.5);
      }

      // --- Transcript ---
      if (meeting.transcript?.length) {
        doc.addPage();
        doc.fontSize(16).fill(primary).text('Meeting Transcript');
        doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#e2e8f0');
        doc.moveDown(0.5);
        meeting.transcript.forEach(seg => {
          if (doc.y > 700) doc.addPage();
          const mins = Math.floor(seg.startTime/60);
          const secs = seg.startTime%60;
          doc.fontSize(9).fill(primary).text(`[${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}] ${seg.speaker}`, 50);
          doc.fontSize(9).fill(dark).text(seg.text, 50, undefined, { lineGap: 2 });
          doc.moveDown(0.4);
        });
      }

      // --- Footer on every page ---
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fill(gray);
        doc.text('Generated by MeetIQ — AI Meeting Intelligence Platform', 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
        doc.text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 28, { align: 'center', width: doc.page.width - 100 });
      }

      doc.end();
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDF };
