import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { invoices, invoiceItems, services, visits, labOrders, prescriptions } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';

@Injectable()
export class InvoicesService {
  async create(dto: CreateInvoiceDto) {
    const resolvedItems: { serviceId: string | null; description: string; quantity: number; unitPrice: string }[] = [];

    for (const item of dto.items) {
      if (item.serviceId) {
        const [service] = await db.select().from(services).where(eq(services.id, item.serviceId));
        if (!service) throw new BadRequestException(`Service ${item.serviceId} not found`);
        resolvedItems.push({
          serviceId: service.id,
          description: service.name,
          quantity: item.quantity,
          unitPrice: Number(service.defaultPrice).toFixed(2),
        });
      } else {
        resolvedItems.push({
          serviceId: null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
        });
      }
    }

    const total = resolvedItems.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);

    const [invoice] = await db
      .insert(invoices)
      .values({
        patientId: dto.patientId,
        visitId: dto.visitId,
        totalAmount: total.toFixed(2),
      })
      .returning();

    await db.insert(invoiceItems).values(
      resolvedItems.map((item) => ({
        invoiceId: invoice.id,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
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

  async getAutoFill(patientId: string) {
    const items: { serviceId: string | null; description: string; quantity: number; unitPrice: number; category: string }[] = [];

    const recentVisits = await db
      .select()
      .from(visits)
      .where(eq(visits.patientId, patientId))
      .orderBy(desc(visits.createdAt));

    let visit: typeof recentVisits[number] | undefined;
    for (const v of recentVisits) {
      const billed = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(and(eq(invoices.visitId, v.id), eq(invoices.status, 'paid')));
      if (billed.length === 0) {
        visit = v;
        break;
      }
    }

    const consultation = await db
      .select()
      .from(services)
      .where(and(eq(services.category, 'consultation'), eq(services.active, true)))
      .orderBy(services.name)
      .then((r) => r[0]);
    if (consultation) {
      items.push({ serviceId: consultation.id, description: consultation.name, quantity: 1, unitPrice: Number(consultation.defaultPrice), category: 'consultation' });
    }

    if (visit) {
      const visitPrescriptions = await db.select().from(prescriptions).where(eq(prescriptions.visitId, visit.id));
      const dispensing = await db
        .select()
        .from(services)
        .where(and(eq(services.active, true), sql`(LOWER(${services.name}) LIKE '%dispens%' OR LOWER(${services.name}) LIKE '%prescription%')`))
        .orderBy(services.name)
        .then((r) => r[0]);
      if (dispensing) {
        visitPrescriptions.forEach(() => {
          items.push({ serviceId: dispensing.id, description: dispensing.name, quantity: 1, unitPrice: Number(dispensing.defaultPrice), category: dispensing.category });
        });
      }

      const visitLabs = await db
        .select()
        .from(labOrders)
        .where(and(eq(labOrders.visitId, visit.id), sql`${labOrders.status} <> 'cancelled'`));
      for (const lab of visitLabs) {
        const matchingService = await db
          .select()
          .from(services)
          .where(and(eq(services.category, 'lab'), sql`LOWER(${services.name}) LIKE ${'%' + lab.testType.toLowerCase() + '%'}`, eq(services.active, true)))
          .orderBy(services.name)
          .then((r) => r[0]);
        if (matchingService) {
          items.push({
            serviceId: matchingService.id,
            description: matchingService.name,
            quantity: 1,
            unitPrice: Number(matchingService.defaultPrice),
            category: 'lab',
          });
        }
      }
    }

    return { visitId: visit?.id ?? null, hasVisit: !!visit, items };
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
