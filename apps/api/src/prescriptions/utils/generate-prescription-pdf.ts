import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

interface PrescriptionPdfData {
  patientName: string;
  patientMrn: string;
  doctorName: string;
  date: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
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

    // Letterhead
    doc.fontSize(22).fillColor('#0f766e').text(data.clinicName, { align: 'center' });
    doc.fontSize(10).fillColor('#475569').text(data.clinicAddress, { align: 'center' });
    doc.fontSize(10).fillColor('#475569').text(`Tel: ${data.clinicPhone}`, { align: 'center' });
    doc
      .moveDown(0.5)
      .fontSize(12)
      .fillColor('#111827')
      .text('Digital E-Prescription', { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor('#0f766e')
      .lineWidth(1.5)
      .stroke();
    doc.moveDown(1);

    doc.fontSize(11).fillColor('#111827').text(`Patient: ${data.patientName}`);
    doc.text(`MRN: ${data.patientMrn}`);
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

    // Doctor signature block
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor('#111827')
      .text(data.doctorName, { align: 'right' });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6b7280')
      .text('(physician signature)', { align: 'right' });
    doc.moveDown(1.5);
    doc
      .fontSize(10)
      .fillColor('#111827')
      .text('Digitally generated electronic prescription.', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
