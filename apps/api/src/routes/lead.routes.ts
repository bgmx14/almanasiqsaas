import { Router } from 'express';
import { prisma } from '@omraflow/database';
import { createLeadSchema, updateLeadSchema, paginationSchema } from '@omraflow/shared';
import { NotFoundError } from '@omraflow/shared';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/leads
 * Get all leads for tenant
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = paginationSchema.parse(req.query);
    const { status, assignedToId, search } = req.query;

    const where: any = {
      tenantId: req.user!.tenantId,
    };

    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy as string]: sortOrder },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      success: true,
      data: leads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leads/:id
 * Get single lead
 */
router.get('/:id', async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user!.tenantId,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        communications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leads
 * Create new lead
 */
router.post('/', requirePermission('write_leads', 'write'), async (req, res, next) => {
  try {
    const data = createLeadSchema.parse(req.body);

    const lead = await prisma.lead.create({
      data: {
        ...data,
        tenantId: req.user!.tenantId,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/leads/:id
 * Update lead
 */
router.patch('/:id', requirePermission('write_leads', 'write'), async (req, res, next) => {
  try {
    const data = updateLeadSchema.parse(req.body);

    // Check if lead exists and belongs to tenant
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user!.tenantId,
      },
    });

    if (!existingLead) {
      throw new NotFoundError('Lead');
    }

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data,
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/leads/:id
 * Delete lead
 */
router.delete('/:id', requirePermission('delete', '*'), async (req, res, next) => {
  try {
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user!.tenantId,
      },
    });

    if (!existingLead) {
      throw new NotFoundError('Lead');
    }

    await prisma.lead.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/leads/:id/convert
 * Convert lead to customer
 */
router.post('/:id/convert', requirePermission('write'), async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.user!.tenantId,
      },
    });

    if (!lead) {
      throw new NotFoundError('Lead');
    }

    // Create customer from lead
    const customer = await prisma.customer.create({
      data: {
        tenantId: req.user!.tenantId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        dateOfBirth: lead.dateOfBirth,
        source: lead.source,
        notes: lead.notes,
        tags: lead.tags,
        leadId: lead.id,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'WON',
        convertedAt: new Date(),
        customerId: customer.id,
      },
    });

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
