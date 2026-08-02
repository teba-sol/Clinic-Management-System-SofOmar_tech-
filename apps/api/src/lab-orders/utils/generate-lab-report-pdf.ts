import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

interface LabReportPdfData {
  patientName: string;
  patientMrn: string;
  doctorName: string;
  testType: string;
  status: string;
  resultText: string;
  date: string;
}

export function generateLabReportPdf(data: LabReportPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    const stream = new Writable({
      write(chunk, _enc, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    doc.pipe(stream);

    doc.fontSize(20).text('Clinic Management System', { align: 'center' });
    doc.fontSize(12).text('Laboratory Test Report', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(11).text(`Patient: ${data.patientName}`);
    doc.text(`MRN: ${data.patientMrn}`);
    doc.text(`Ordered by: ${data.doctorName}`);
    doc.text(`Test: ${data.testType}`);
    doc.text(`Status: ${data.status}`);
    doc.text(`Date: ${data.date}`);
    doc.moveDown(1);

    doc.fontSize(13).text('Result:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(data.resultText || 'No result recorded yet.');

    doc.moveDown(2);
    doc.fontSize(10).text('This is a digitally generated laboratory report.', {
      align: 'center',
    });

    doc.end();

    stream.on('finish', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
