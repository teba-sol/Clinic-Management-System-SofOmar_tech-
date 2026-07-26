import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

interface PrescriptionPdfData {
  patientName: string;
  doctorName: string;
  date: string;
  items: { drugName: string; dosage: string; frequency: string; route: string; duration: string }[];
}

export function generatePrescriptionPdf(data: PrescriptionPdfData): Promise<Buffer> {
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
    doc.fontSize(12).text('Digital E-Prescription', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(11).text(`Patient: ${data.patientName}`);
    doc.text(`Doctor: ${data.doctorName}`);
    doc.text(`Date: ${data.date}`);
    doc.moveDown(1);

    doc.fontSize(13).text('Prescribed Medications:', { underline: true });
    doc.moveDown(0.5);

    data.items.forEach((item, i) => {
      doc.fontSize(11).text(
        `${i + 1}. ${item.drugName} — ${item.dosage}, ${item.frequency}, ${item.route}, for ${item.duration}`,
      );
    });

    doc.moveDown(2);
    doc.fontSize(10).text('This is a digitally generated prescription.', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
