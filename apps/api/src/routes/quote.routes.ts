import { Router } from 'express';
import { prisma } from '@omraflow/database';
import { authenticate } from '../middleware/auth';
import { createQuoteSchema, updateQuoteSchema } from '@omraflow/shared/validators';
import { AppError } from '@omraflow/shared/types';

const router = Router();
router.use(authenticate);

// Generate unique quote number
const generateQuoteNumber = async (tenantId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;

  // Get the latest quote number for this tenant and year
  const latestQuote = await prisma.quote.findFirst({
    where: {
      tenantId,
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestQuote) {
    const currentNumber = parseInt(latestQuote.quoteNumber.split('-')[2]);
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
};

// Get all quotes
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.user!.tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      success: true,
      data: quotes,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single quote
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId,
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!quote) {
      throw new AppError(404, 'QUOTE_NOT_FOUND', 'Devis introuvable');
    }

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
});

// Create quote
router.post('/', async (req, res, next) => {
  try {
    const data = createQuoteSchema.parse(req.body);

    // Validate that either leadId or customerId is provided
    if (!data.leadId && !data.customerId) {
      throw new AppError(400, 'INVALID_DATA', 'Un prospect ou un client doit être sélectionné');
    }

    // Verify lead or customer belongs to tenant
    if (data.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: data.leadId, tenantId: req.user!.tenantId },
      });
      if (!lead) {
        throw new AppError(404, 'LEAD_NOT_FOUND', 'Prospect introuvable');
      }
    }

    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, tenantId: req.user!.tenantId },
      });
      if (!customer) {
        throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Client introuvable');
      }
    }

    // Generate unique quote number
    const quoteNumber = await generateQuoteNumber(req.user!.tenantId);

    const quote = await prisma.quote.create({
      data: {
        tenantId: req.user!.tenantId,
        quoteNumber,
        leadId: data.leadId,
        customerId: data.customerId,
        title: data.title,
        description: data.description,
        items: data.items,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        validUntil: new Date(data.validUntil),
        status: data.status || 'DRAFT',
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
});

// Update quote
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateQuoteSchema.parse(req.body);

    // Check if quote exists and belongs to tenant
    const existingQuote = await prisma.quote.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!existingQuote) {
      throw new AppError(404, 'QUOTE_NOT_FOUND', 'Devis introuvable');
    }

    // Cannot update accepted or rejected quotes
    if (existingQuote.status === 'ACCEPTED' || existingQuote.status === 'REJECTED') {
      throw new AppError(400, 'QUOTE_LOCKED', 'Ce devis ne peut plus être modifié');
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        items: data.items,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        status: data.status,
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
});

// Delete quote
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!quote) {
      throw new AppError(404, 'QUOTE_NOT_FOUND', 'Devis introuvable');
    }

    // Cannot delete accepted quotes
    if (quote.status === 'ACCEPTED') {
      throw new AppError(400, 'QUOTE_LOCKED', 'Les devis acceptés ne peuvent pas être supprimés');
    }

    await prisma.quote.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Devis supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Send quote
router.post('/:id/send', async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!quote) {
      throw new AppError(404, 'QUOTE_NOT_FOUND', 'Devis introuvable');
    }

    if (quote.status !== 'DRAFT') {
      throw new AppError(400, 'INVALID_STATUS', 'Seuls les devis en brouillon peuvent être envoyés');
    }

    // Check if quote is expired
    if (new Date(quote.validUntil) < new Date()) {
      throw new AppError(400, 'QUOTE_EXPIRED', 'Ce devis a expiré');
    }

    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send email with quote PDF
    // await emailService.sendQuote(updatedQuote);

    res.json({
      success: true,
      data: updatedQuote,
      message: 'Devis envoyé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Accept quote
router.post('/:id/accept', async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!quote) {
      throw new AppError(404, 'QUOTE_NOT_FOUND', 'Devis introuvable');
    }

    if (quote.status === 'ACCEPTED') {
      throw new AppError(400, 'ALREADY_ACCEPTED', 'Ce devis est déjà accepté');
    }

    if (quote.status === 'REJECTED') {
      throw new AppError(400, 'ALREADY_REJECTED', 'Ce devis a été rejeté');
    }

    // Check if quote is expired
    if (new Date(quote.validUntil) < new Date()) {
      throw new AppError(400, 'QUOTE_EXPIRED', 'Ce devis a expiré');
    }

    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedQuote,
      message: 'Devis accepté avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Reject quote
router.post('/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!quote) {
      throw new AppError(404, 'QUOTE_NOT_FOUND', 'Devis introuvable');
    }

    if (quote.status === 'ACCEPTED') {
      throw new AppError(400, 'ALREADY_ACCEPTED', 'Les devis acceptés ne peuvent pas être rejetés');
    }

    if (quote.status === 'REJECTED') {
      throw new AppError(400, 'ALREADY_REJECTED', 'Ce devis est déjà rejeté');
    }

    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedQuote,
      message: 'Devis rejeté',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
