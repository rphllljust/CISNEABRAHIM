import { createHash } from 'node:crypto';
import PDFDocument from 'pdfkit';
import type { BillingDocumentPdfSnapshot } from './billing-document';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

function formatTaxId(value: string | null): string {
  if (!value) {
    return '—';
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return value;
}

function formatMoney(amount: string, currencyCode: string): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return amount;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatQuantity(value: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(numeric);
}

function formatAddress(address: Record<string, unknown>): string {
  const parts = [
    address.street,
    address.number,
    address.complement,
    address.district,
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .map((part) => (part as string).trim());
  return parts.length > 0 ? parts.join(', ') : '—';
}

function formatIssuedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function renderPdf(snapshot: BillingDocumentPdfSnapshot): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: true,
      info: {
        Title: `${snapshot.documentCategory} ${snapshot.documentNumber}`,
        Author: snapshot.emitterLegalName,
        Subject: snapshot.documentCategory,
        CreationDate: new Date(snapshot.issuedAt),
      },
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

  const footer = () => {
    doc.font('Helvetica').fontSize(8).fillColor('#444444');
    doc.text(snapshot.fiscalDisclaimer, MARGIN, PAGE_HEIGHT - MARGIN - 24, {
      width: PAGE_WIDTH - MARGIN * 2,
      align: 'center',
    });
    doc.text(`Página ${doc.bufferedPageRange().start + 1}`, MARGIN, PAGE_HEIGHT - MARGIN - 12, {
      width: PAGE_WIDTH - MARGIN * 2,
      align: 'right',
    });
    doc.fillColor('#000000');
  };

  doc.font('Helvetica-Bold').fontSize(16).text(snapshot.documentCategory, { align: 'center' });
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10).text(`Nº ${snapshot.documentNumber}`, { align: 'center' });
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(11).text('Emitente');
  doc.font('Helvetica').fontSize(10);
  doc.text(snapshot.emitterLegalName);
  doc.text(`CNPJ: ${formatTaxId(snapshot.emitterTaxId)}`);
  doc.text(formatAddress(snapshot.emitterAddress));
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(11).text('Cliente');
  doc.font('Helvetica').fontSize(10);
  doc.text(snapshot.clientLegalName);
  doc.text(`CNPJ/CPF: ${formatTaxId(snapshot.clientTaxId)}`);
  doc.text(formatAddress(snapshot.billingAddress));
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(11).text('Dados do documento');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Emissão: ${formatIssuedDate(snapshot.issuedAt)}`);
  doc.text(`Vencimento: ${snapshot.dueDate ? formatIssuedDate(`${snapshot.dueDate}T00:00:00.000Z`) : '—'}`);
  doc.text(`Condição de pagamento: ${snapshot.paymentTerms}`);
  if (snapshot.purchaseOrderNumber) {
    doc.text(`PO/RC: ${snapshot.purchaseOrderNumber}`);
  }
  if (snapshot.contractReference) {
    doc.text(`Referência contratual: ${snapshot.contractReference}`);
  }
  doc.moveDown(0.8);

  const tableTop = doc.y;
  const colWidths = [28, 180, 52, 72, 72, 80];
  const headers = ['#', 'Descrição', 'Qtd', 'UoM', 'Preço', 'Total'];
  doc.font('Helvetica-Bold').fontSize(9);
  let x = MARGIN;
  for (let index = 0; index < headers.length; index += 1) {
    doc.text(headers[index] ?? '', x, tableTop, { width: colWidths[index], align: 'left' });
    x += colWidths[index] ?? 0;
  }
  doc.moveDown(0.4);
  let rowY = doc.y;
  doc.font('Helvetica').fontSize(9);

  for (const item of snapshot.items) {
    if (rowY > PAGE_HEIGHT - MARGIN - 80) {
      footer();
      doc.addPage();
      rowY = MARGIN;
    }
    x = MARGIN;
    const cells = [
      String(item.lineNumber),
      item.lineLabel,
      formatQuantity(item.quantity),
      item.unitCode,
      item.unitPrice ? formatMoney(item.unitPrice, snapshot.currencyCode) : '—',
      formatMoney(item.lineAmount, snapshot.currencyCode),
    ];
    for (let index = 0; index < cells.length; index += 1) {
      doc.text(cells[index] ?? '', x, rowY, { width: colWidths[index], align: 'left' });
      x += colWidths[index] ?? 0;
    }
    rowY += 16;
    doc.y = rowY;
  }

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(`Total: ${formatMoney(snapshot.totalAmount, snapshot.currencyCode)}`, {
    align: 'right',
  });

  footer();
  doc.end();
  });
}

export function stabilizePdfArtifact(buffer: Buffer, seed: string): Buffer {
  const pdf = buffer.toString('latin1');
  const stableId = seed.replace(/[^A-Fa-f0-9]/g, '').slice(0, 32).padEnd(32, '0').toUpperCase();
  const normalized = pdf.replace(
    /\/ID\s*\[\s*<[^>]+>\s*<[^>]+>\s*\]/,
    `/ID [ <${stableId}> <${stableId}> ]`,
  );
  return Buffer.from(normalized, 'latin1');
}

export async function renderBillingDocumentPdf(snapshot: BillingDocumentPdfSnapshot): Promise<{
  buffer: Buffer;
  sha256: string;
}> {
  const raw = await renderPdf(snapshot);
  const seed = createHash('sha256')
    .update(
      [
        snapshot.documentNumber,
        snapshot.issuedAt,
        snapshot.totalAmount,
        snapshot.items.map((item) => `${item.lineNumber}:${item.lineAmount}`).join('|'),
      ].join('::'),
    )
    .digest('hex');
  const buffer = stabilizePdfArtifact(raw, seed);
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  return { buffer, sha256 };
}
