import PDFKit = require('pdfkit');

interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuotePDFData {
  quoteNumber: string;
  date: Date;
  validUntil: Date;
  status: string;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  tenant: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  items: QuoteLineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
}

export class PDFService {
  /**
   * Generate a quote PDF and return as a stream
   */
  static generateQuotePDF(data: QuotePDFData): PDFKit.PDFDocument {
    const doc = new PDFKit({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Devis ${data.quoteNumber}`,
        Author: data.tenant.name,
        Subject: `Devis pour ${data.client.firstName} ${data.client.lastName}`,
        Creator: 'OmraFlow Pro',
      },
    });

    // Add content to the PDF
    this.addHeader(doc, data);
    this.addClientInfo(doc, data);
    this.addLineItems(doc, data);
    this.addTotals(doc, data);
    this.addFooter(doc, data);

    // Finalize the PDF
    doc.end();

    return doc;
  }

  private static addHeader(doc: PDFKit.PDFDocument, data: QuotePDFData) {
    // Company name and logo section
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1a56db')
      .text(data.tenant.name, 50, 50);

    // Company details
    if (data.tenant.address || data.tenant.phone || data.tenant.email) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666');

      let yPos = 80;
      if (data.tenant.address) {
        doc.text(data.tenant.address, 50, yPos);
        yPos += 12;
      }
      if (data.tenant.phone) {
        doc.text(`Tél: ${data.tenant.phone}`, 50, yPos);
        yPos += 12;
      }
      if (data.tenant.email) {
        doc.text(`Email: ${data.tenant.email}`, 50, yPos);
        yPos += 12;
      }
      if (data.tenant.website) {
        doc.text(`Web: ${data.tenant.website}`, 50, yPos);
      }
    }

    // Quote title and number
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DEVIS', 400, 50, { align: 'right' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`N° ${data.quoteNumber}`, 400, 75, { align: 'right' });

    // Date and validity
    doc
      .fontSize(9)
      .text(`Date: ${this.formatDate(data.date)}`, 400, 95, { align: 'right' })
      .text(`Valable jusqu'au: ${this.formatDate(data.validUntil)}`, 400, 110, { align: 'right' });

    // Status badge
    const statusColors: Record<string, string> = {
      DRAFT: '#6b7280',
      SENT: '#2563eb',
      VIEWED: '#8b5cf6',
      ACCEPTED: '#16a34a',
      REJECTED: '#dc2626',
      EXPIRED: '#9ca3af',
    };

    const statusLabels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT: 'Envoyé',
      VIEWED: 'Vu',
      ACCEPTED: 'Accepté',
      REJECTED: 'Rejeté',
      EXPIRED: 'Expiré',
    };

    doc
      .fillColor(statusColors[data.status] || '#6b7280')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text((statusLabels[data.status] || data.status).toUpperCase(), 400, 130, { align: 'right' });

    // Horizontal line
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, 160)
      .lineTo(545, 160)
      .stroke();
  }

  private static addClientInfo(doc: PDFKit.PDFDocument, data: QuotePDFData) {
    // Client section title
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('CLIENT', 50, 180);

    // Client details
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#374151')
      .text(`${data.client.firstName} ${data.client.lastName}`, 50, 200);

    let yPos = 215;
    if (data.client.email) {
      doc.text(data.client.email, 50, yPos);
      yPos += 15;
    }
    if (data.client.phone) {
      doc.text(data.client.phone, 50, yPos);
    }
  }

  private static addLineItems(doc: PDFKit.PDFDocument, data: QuotePDFData) {
    const tableTop = 270;
    const descriptionX = 50;
    const quantityX = 300;
    const unitPriceX = 380;
    const totalX = 480;

    // Table header
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#374151');

    // Header background
    doc
      .rect(50, tableTop - 10, 495, 25)
      .fillColor('#f3f4f6')
      .fill();

    // Header text
    doc
      .fillColor('#374151')
      .text('Description', descriptionX, tableTop)
      .text('Qté', quantityX, tableTop)
      .text('Prix unit.', unitPriceX, tableTop)
      .text('Total', totalX, tableTop);

    // Horizontal line after header
    doc
      .strokeColor('#d1d5db')
      .lineWidth(1)
      .moveTo(50, tableTop + 20)
      .lineTo(545, tableTop + 20)
      .stroke();

    // Table rows
    let yPos = tableTop + 35;
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#000000');

    data.items.forEach((item, index) => {
      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc
          .rect(50, yPos - 8, 495, 25)
          .fillColor('#f9fafb')
          .fill();
      }

      doc
        .fillColor('#000000')
        .text(item.description, descriptionX, yPos, { width: 230, lineGap: 2 })
        .text(item.quantity.toString(), quantityX, yPos)
        .text(this.formatCurrency(item.unitPrice), unitPriceX, yPos)
        .text(this.formatCurrency(item.total), totalX, yPos);

      yPos += 30;
    });

    // Bottom line
    doc
      .strokeColor('#d1d5db')
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(545, yPos)
      .stroke();

    return yPos;
  }

  private static addTotals(doc: PDFKit.PDFDocument, data: QuotePDFData) {
    const startY = 530;
    const labelX = 380;
    const amountX = 480;

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#374151');

    let yPos = startY;

    // Subtotal
    doc
      .text('Sous-total:', labelX, yPos)
      .text(this.formatCurrency(data.subtotal), amountX, yPos);
    yPos += 20;

    // Tax
    if (data.tax > 0) {
      doc
        .text('TVA:', labelX, yPos)
        .text(this.formatCurrency(data.tax), amountX, yPos);
      yPos += 20;
    }

    // Discount
    if (data.discount > 0) {
      doc
        .fillColor('#16a34a')
        .text('Remise:', labelX, yPos)
        .text(`-${this.formatCurrency(data.discount)}`, amountX, yPos);
      yPos += 20;
    }

    // Total line
    doc
      .strokeColor('#d1d5db')
      .lineWidth(1)
      .moveTo(370, yPos)
      .lineTo(545, yPos)
      .stroke();

    yPos += 15;

    // Total
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Total:', labelX, yPos)
      .text(this.formatCurrency(data.total), amountX, yPos);

    // Notes section
    if (data.notes) {
      yPos += 40;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Notes:', 50, yPos);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(data.notes, 50, yPos + 15, { width: 495, lineGap: 3 });
    }
  }

  private static addFooter(doc: PDFKit.PDFDocument, data: QuotePDFData) {
    const footerY = 730;

    // Horizontal line
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .stroke();

    // Footer text
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(
        'Ce devis est valable jusqu\'à la date indiquée. Les prix sont exprimés en euros (€) TTC.',
        50,
        footerY + 10,
        { width: 495, align: 'center', lineGap: 3 }
      );

    doc
      .text(
        `Généré le ${this.formatDate(new Date())} par OmraFlow Pro`,
        50,
        footerY + 30,
        { width: 495, align: 'center' }
      );
  }

  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}
