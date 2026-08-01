import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { invoices, invoiceItems, services, visits, labOrders } from '../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
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

  async findAll() {
    return db.select().from(invoices);
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

  async getSuggestions(patientId: string) {
    const items: { description: string; quantity: number; unitPrice: number; category: string }[] = [];

    const consultationServices = await db
      .select()
      .from(services)
      .where(and(eq(services.category, 'consultation'), eq(services.active, true)));
    for (const s of consultationServices) {
      items.push({ description: s.name, quantity: 1, unitPrice: Number(s.defaultPrice), category: 'consultation' });
    }

    const completedLabs = await db
      .select()
      .from(labOrders)
      .where(and(eq(labOrders.patientId, patientId), eq(labOrders.status, 'completed')));
    for (const lab of completedLabs) {
      const matchingService = await db
        .select()
        .from(services)
        .where(and(eq(services.category, 'lab'), sql`LOWER(${services.name}) LIKE LOWER(${'%' + lab.testType + '%'})`, eq(services.active, true)))
        .then((r) => r[0]);
      items.push({
        description: `Lab: ${lab.testType}`,
        quantity: 1,
        unitPrice: matchingService ? Number(matchingService.defaultPrice) : 0,
        category: 'lab',
      });
    }

    const recentVisits = await db
      .select()
      .from(visits)
      .where(and(eq(visits.patientId, patientId), sql`${visits.createdAt} >= NOW() - INTERVAL '30 days'`));
    const hasVisit = recentVisits.length > 0;

    return { items, hasVisit, visitCount: recentVisits.length };
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
