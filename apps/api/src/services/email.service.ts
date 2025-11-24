import nodemailer from 'nodemailer';
import { PDFService } from './pdf.service';

interface EmailConfig {
  from: string;
  replyTo?: string;
}

interface QuoteEmailData {
  quote: {
    id: string;
    quoteNumber: string;
    title: string;
    total: number;
    validUntil: Date;
    status: string;
    items: any[];
    subtotal: number;
    tax: number;
    discount: number;
    description?: string;
    createdAt: Date;
  };
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  tenant: {
    name: string;
    email?: string;
    phone?: string;
  };
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static config: EmailConfig;

  /**
   * Initialize email service with SMTP configuration
   */
  static initialize() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || 'noreply@omraflow.com';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('Email service not configured. SMTP credentials missing.');
      return false;
    }

    this.config = {
      from: smtpFrom,
      replyTo: process.env.SMTP_REPLY_TO,
    };

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('Email service initialized successfully');
    return true;
  }

  /**
   * Check if email service is configured and ready
   */
  static isConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Send quote email to client with PDF attachment
   */
  static async sendQuoteEmail(data: QuoteEmailData): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    // Generate PDF
    const pdfStream = PDFService.generateQuotePDF({
      quoteNumber: data.quote.quoteNumber,
      date: data.quote.createdAt,
      validUntil: data.quote.validUntil,
      status: data.quote.status,
      client: {
        firstName: data.client.firstName,
        lastName: data.client.lastName,
        email: data.client.email,
        phone: data.client.phone,
      },
      tenant: {
        name: data.tenant.name,
        email: data.tenant.email,
        phone: data.tenant.phone,
      },
      items: data.quote.items,
      subtotal: data.quote.subtotal,
      tax: data.quote.tax,
      discount: data.quote.discount,
      total: data.quote.total,
      notes: data.quote.description,
    });

    // Convert stream to buffer
    const pdfBuffer = await this.streamToBuffer(pdfStream);

    // Format currency
    const formattedTotal = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(data.quote.total);

    // Format date
    const formattedDate = new Date(data.quote.validUntil).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Email HTML template
    const htmlContent = this.getQuoteEmailTemplate({
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      quoteNumber: data.quote.quoteNumber,
      quoteTitle: data.quote.title,
      total: formattedTotal,
      validUntil: formattedDate,
      tenantName: data.tenant.name,
      tenantEmail: data.tenant.email,
      tenantPhone: data.tenant.phone,
    });

    // Send email
    await this.transporter.sendMail({
      from: this.config.from,
      to: data.client.email,
      replyTo: this.config.replyTo || data.tenant.email,
      subject: `Devis ${data.quote.quoteNumber} - ${data.tenant.name}`,
      html: htmlContent,
      attachments: [
        {
          filename: `devis-${data.quote.quoteNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Generate HTML template for quote email
   */
  private static getQuoteEmailTemplate(data: {
    clientName: string;
    quoteNumber: string;
    quoteTitle: string;
    total: string;
    validUntil: string;
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devis ${data.quoteNumber}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1a56db;
        }
        .header h1 {
            color: #1a56db;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 0;
            font-size: 14px;
        }
        .content {
            margin-bottom: 30px;
        }
        .content p {
            margin: 0 0 15px 0;
        }
        .quote-details {
            background-color: #f8f9fa;
            border-left: 4px solid #1a56db;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .quote-details h2 {
            margin: 0 0 15px 0;
            color: #1a56db;
            font-size: 18px;
        }
        .quote-details p {
            margin: 8px 0;
            font-size: 14px;
        }
        .quote-details .label {
            font-weight: 600;
            color: #555;
        }
        .quote-details .total {
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
            margin-top: 15px;
        }
        .cta {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background-color: #1a56db;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer p {
            margin: 5px 0;
        }
        .contact-info {
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${data.tenantName}</h1>
            <p>Votre partenaire pour l'organisation de votre Omra</p>
        </div>

        <div class="content">
            <p>Bonjour ${data.clientName},</p>

            <p>Nous avons le plaisir de vous transmettre votre devis personnalisé pour votre projet d'Omra.</p>

            <div class="quote-details">
                <h2>📄 Détails du devis</h2>
                <p><span class="label">Numéro:</span> ${data.quoteNumber}</p>
                <p><span class="label">Intitulé:</span> ${data.quoteTitle}</p>
                <p><span class="label">Valable jusqu'au:</span> ${data.validUntil}</p>
                <p class="total">Montant total: ${data.total}</p>
            </div>

            <p>Vous trouverez en pièce jointe le devis détaillé au format PDF avec l'ensemble des prestations et conditions.</p>

            <p>Notre équipe reste à votre entière disposition pour toute question ou information complémentaire concernant ce devis.</p>
        </div>

        <div class="cta">
            <p style="margin-bottom: 15px; color: #666;">Le devis est joint à cet email</p>
        </div>

        <div class="footer">
            <p><strong>${data.tenantName}</strong></p>
            <div class="contact-info">
                ${data.tenantEmail ? `<p>📧 ${data.tenantEmail}</p>` : ''}
                ${data.tenantPhone ? `<p>📞 ${data.tenantPhone}</p>` : ''}
            </div>
            <p style="margin-top: 20px; color: #999;">
                Cet email a été envoyé automatiquement par OmraFlow Pro.<br>
                Merci de ne pas répondre directement à cet email.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Convert stream to buffer
   */
  private static streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Send test email to verify configuration
   */
  static async sendTestEmail(to: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    await this.transporter.sendMail({
      from: this.config.from,
      to,
      subject: 'Test Email - OmraFlow Pro',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Service Test</h2>
          <p>This is a test email from OmraFlow Pro.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
        </div>
      `,
    });
  }
}
