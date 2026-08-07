import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { invoices, invoiceItems, services, visits, labOrders, prescriptions, patients } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';

@Injectable()
export class InvoicesService {
  async create(dto: CreateInvoiceDto) {
    const resolvedItems: {
      serviceId: string | null;
      description: string;
      quantity: number;
      unitPrice: string;
      sourceType: string | null;
      sourceId: string | null;
    }[] = [];

    for (const item of dto.items) {
      if (item.serviceId) {
        const [service] = await db.select().from(services).where(eq(services.id, item.serviceId));
        if (!service) throw new BadRequestException(`Service ${item.serviceId} not found`);
        resolvedItems.push({
          serviceId: service.id,
          description: service.name,
          quantity: item.quantity,
          unitPrice: Number(service.defaultPrice).toFixed(2),
          sourceType: item.sourceType ?? null,
          sourceId: item.sourceId ?? null,
        });
      } else {
        resolvedItems.push({
          serviceId: null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          sourceType: item.sourceType ?? null,
          sourceId: item.sourceId ?? null,
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
        sourceType: item.sourceType,
        sourceId: item.sourceId,
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
    const [patient] = await db.select().from(patients).where(eq(patients.id, invoice.patientId));
    return { ...invoice, items, patient: patient ?? null };
  }

  async findByPatient(patientId: string) {
    return db.select().from(invoices).where(eq(invoices.patientId, patientId));
  }

  async getAutoFill(patientId: string) {
    const medications: {
      key: string;
      drugName: string;
      dosage: string | null;
      serviceId: string | null;
      suggestedPrice: number | null;
      unitPrice: number;
    }[] = [];
    const labs: {
      key: string;
      testType: string;
      status: string;
      serviceId: string | null;
      suggestedPrice: number | null;
      unitPrice: number;
    }[] = [];

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

    const activeServices = await db
      .select()
      .from(services)
      .where(eq(services.active, true));

    const findService = (category: string, needle: string) =>
      activeServices.find(
        (s) =>
          s.category === category &&
          s.name.toLowerCase().includes(needle.toLowerCase()),
      );

    const billedSources = new Set<string>();
    const legacyDescriptions: string[] = [];
    const billedRows = await db
      .select({
        sourceType: invoiceItems.sourceType,
        sourceId: invoiceItems.sourceId,
        description: invoiceItems.description,
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(eq(invoices.patientId, patientId));
    for (const row of billedRows) {
      if (row.sourceType && row.sourceId) {
        billedSources.add(`${row.sourceType}:${row.sourceId}`);
      } else {
        legacyDescriptions.push(row.description.toLowerCase());
      }
    }

    const matchesLegacyBilled = (needle: string) => {
      const n = needle.toLowerCase().trim();
      return legacyDescriptions.some((d) => d === n || d.includes(n));
    };

    const patientPrescriptions = await db
      .select()
      .from(prescriptions)
      .where(and(eq(prescriptions.patientId, patientId), sql`${prescriptions.status} <> 'cancelled'`));

    const seenMeds = new Set<string>();
    for (const rx of patientPrescriptions) {
      const items = (rx.items as { drugName?: string; dosage?: string }[]) ?? [];
      items.forEach((item, idx) => {
        const drugName = item.drugName?.trim();
        if (!drugName) return;
        const dosage = item.dosage?.trim() || null;
        const dedupeKey = `${drugName.toLowerCase()}|${(dosage || '').toLowerCase()}`;
        if (seenMeds.has(dedupeKey)) return;
        seenMeds.add(dedupeKey);

        const sourceKey = `prescription:${rx.id}:${idx}`;
        if (billedSources.has(sourceKey)) return;
        if (matchesLegacyBilled(dosage ? `${drugName} (${dosage})` : drugName)) return;
        if (matchesLegacyBilled(drugName)) return;

        const matched = findService('medication', drugName);
        medications.push({
          key: `${rx.id}:${idx}`,
          drugName,
          dosage,
          serviceId: matched?.id ?? null,
          suggestedPrice: matched ? Number(matched.defaultPrice) : null,
          unitPrice: matched ? Number(matched.defaultPrice) : 0,
        });
      });
    }

    const patientLabs = await db
      .select()
      .from(labOrders)
      .where(and(eq(labOrders.patientId, patientId), sql`${labOrders.status} <> 'cancelled'`));

    for (const lab of patientLabs) {
      if (billedSources.has(`lab_order:${lab.id}`)) continue;
      const testType = lab.testType.trim();
      if (matchesLegacyBilled(testType)) continue;
      const matched = findService('lab', testType);
      labs.push({
        key: lab.id,
        testType,
        status: lab.status,
        serviceId: matched?.id ?? null,
        suggestedPrice: matched ? Number(matched.defaultPrice) : null,
        unitPrice: matched ? Number(matched.defaultPrice) : 0,
      });
    }

    return { visitId: visit?.id ?? null, hasVisit: !!visit, medications, labs };
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
