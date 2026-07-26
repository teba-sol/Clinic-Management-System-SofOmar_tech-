import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { invoices, invoiceItems } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';

@Injectable()
export class InvoicesService {
  async create(dto: CreateInvoiceDto) {
    const total = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const [invoice] = await db
      .insert(invoices)
      .values({
        patientId: dto.patientId,
        visitId: dto.visitId,
        totalAmount: total.toFixed(2),
      })
      .returning();

    await db.insert(invoiceItems).values(
      dto.items.map((item) => ({
        invoiceId: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      })),
    );

    return invoice;
  }

  async findOne(id: string) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) throw new NotFoundException('Invoice not found');
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    return { ...invoice, items };
  }

  async findByPatient(patientId: string) {
    return db.select().from(invoices).where(eq(invoices.patientId, patientId));
  }

  async pay(id: string, dto: PayInvoiceDto) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) throw new NotFoundException('Invoice not found');

    const currentPaid = parseFloat(invoice.amountPaid);
    const total = parseFloat(invoice.totalAmount);
    const newPaid = currentPaid + dto.amount;

    if (newPaid > total) {
      throw new BadRequestException('Payment exceeds invoice total');
    }

    const status = newPaid === total ? 'paid' : 'partial';

    const [updated] = await db
      .update(invoices)
      .set({
        amountPaid: newPaid.toFixed(2),
        status,
        paymentMethod: dto.paymentMethod as any,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    return updated;
  }
}
