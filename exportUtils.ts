
import { SentimentResult } from "./types";

export const exportToJSON = (data: SentimentResult[]) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `camden_analysis_${Date.now()}.json`;
  a.click();
};

export const exportToCSV = (data: SentimentResult[]) => {
  const headers = ['Text', 'Sentiment', 'Confidence', 'Keywords', 'Explanation'];
  const rows = data.map(item => [
    `"${item.text.replace(/"/g, '""')}"`,
    item.sentiment,
    item.confidence,
    `"${item.keywords.join(', ')}"`,
    `"${item.explanation.replace(/"/g, '""')}"`
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `camden_analysis_${Date.now()}.csv`;
  a.click();
};

export const exportToPDF = (data: SentimentResult[]) => {
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(114, 129, 86); // #728156 - Dark Olive
  doc.text('Camden Intelligence Analysis Report', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(136, 151, 108); // #88976C - Medium Olive
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  const tableData = data.map(item => [
    item.text.length > 50 ? item.text.substring(0, 47) + '...' : item.text,
    item.sentiment,
    (item.confidence * 100).toFixed(1) + '%',
    item.keywords.slice(0, 3).join(', ')
  ]);

  (doc as any).autoTable({
    startY: 40,
    head: [['Text Snippet', 'Sentiment', 'Confidence', 'Top Keywords']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [114, 129, 86] }, // #728156
  });

  doc.save(`camden_analysis_${Date.now()}.pdf`);
};

export const exportAccuracyReportToPDF = (stats: any) => {
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(114, 129, 86);
  doc.text('Camden Intelligence: Accuracy Report', 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Overall Model Accuracy: ${stats.accuracy.toFixed(1)}%`, 14, 35);
  doc.text(`Dataset Size: 50 Samples (Human Labeled)`, 14, 42);

  doc.text('Confusion Matrix Results:', 14, 55);
  const matrixData = [
    ['Actual \\ Predicted', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'],
    ['POSITIVE', stats.matrix.POSITIVE.POSITIVE, stats.matrix.POSITIVE.NEUTRAL, stats.matrix.POSITIVE.NEGATIVE],
    ['NEUTRAL', stats.matrix.NEUTRAL.POSITIVE, stats.matrix.NEUTRAL.NEUTRAL, stats.matrix.NEUTRAL.NEGATIVE],
    ['NEGATIVE', stats.matrix.NEGATIVE.POSITIVE, stats.matrix.NEGATIVE.NEUTRAL, stats.matrix.NEGATIVE.NEGATIVE]
  ];

  (doc as any).autoTable({
    startY: 60,
    head: [matrixData[0]],
    body: matrixData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [114, 129, 86] },
  });

  doc.setFontSize(16);
  doc.text('Discussion of API Limitations', 14, doc.lastAutoTable.finalY + 15);
  doc.setFontSize(10);
  const text = doc.splitTextToSize(
    "The integration of the Gemini API for multi-class sentiment analysis demonstrates a robust capability to handle nuanced linguistic structures. During our validation process, several critical limitations were identified. The primary limitation lies in Sarcasm and Contextual Dependency. AI models often struggle with double-negatives or culturally specific idiomatic sarcasm. Another observed challenge is Sentiment Ambiguity in Short Form. In texts shorter than 10 words, the model has fewer contextual anchors to determine confidence. Domain-Specific Vocabulary also poses a hurdle; in technical domains, words can trigger incorrect sentiment flags if the system instruction doesn't strictly define the domain. Finally, Confidence Score Calibration is not always linear, occasionally resulting in overconfident false positives.",
    180
  );
  doc.text(text, 14, doc.lastAutoTable.finalY + 25);

  doc.save(`camden_accuracy_report_${Date.now()}.pdf`);
};

export const exportDocumentationToPDF = () => {
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(114, 129, 86);
  doc.text('Camden Intelligence: User Documentation', 14, 22);

  const sections = [
    { title: '1. Tech Stack', content: 'Language: TypeScript\nFrontend: React 19\nStyling: Tailwind CSS\nAI Engine: Gemini 3 Flash & 2.5 Live\nReal-time: PCM Audio Transcription\nVisuals: Reactive 3D Emojis\nExporting: jsPDF & AutoTable' },
    { title: '2. Intelligence Justification', content: 'We leverage the Gemini 2.5 Live API for instantaneous voice transcription and Gemini 3 Flash for deep sentiment decryption. This multimodal approach allows Camden to resolve complex emotional signals from both textual and acoustic inputs.' },
    { title: '3. Core Features', content: 'Voice Intelligence: Real-time audio signal capture with live transcription.\n3D Reactive Interface: Floating emojis that shift animations based on latest analysis.\nBatch Matrix: High-speed processing of up to 50 intelligence nodes.\nAccuracy Tracking: Integrated validation tools and confusion matrices.' },
    { title: '4. User Guide', content: 'Step 1: Data Injection - Paste text, upload files, or record voice.\nStep 2: Real-time Transcription - Monitor live streams in the voice console.\nStep 3: Resolve Signals - Initialize the AI to classify sentiment vectors.\nStep 4: Insights & Exports - Analyze charts and save data to CSV, JSON, or PDF.' },
    { title: '5. Architecture Thresholds', content: 'Latency Optimization: PCM 16kHz audio streaming for real-time fidelity. Optimal Text Length: 10-500 words. Confidence Threshold: scores below 0.65 are flagged for manual verification.' }
  ];

  let yOffset = 35;
  sections.forEach(s => {
    doc.setFontSize(14);
    doc.setTextColor(114, 129, 86);
    doc.text(s.title, 14, yOffset);
    yOffset += 7;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const contentLines = doc.splitTextToSize(s.content, 180);
    doc.text(contentLines, 14, yOffset);
    yOffset += (contentLines.length * 5) + 10;
  });

  doc.save(`camden_documentation_${Date.now()}.pdf`);
};
