import { Router } from 'express';
import { prisma } from '@omraflow/database';
import { authenticate } from '../middleware/auth';
import { createBookingSchema, updateBookingSchema } from '@omraflow/shared/validators';
import { AppError } from '@omraflow/shared/types';

const router = Router();
router.use(authenticate);

// Generate unique booking number
const generateBookingNumber = async (tenantId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `RES-${year}-`;

  // Get the latest booking number for this tenant and year
  const latestBooking = await prisma.booking.findFirst({
    where: {
      tenantId,
      bookingNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestBooking) {
    const currentNumber = parseInt(latestBooking.bookingNumber.split('-')[2]);
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
};

// Get all bookings
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
        { bookingNumber: { contains: search as string, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } },
            ],
          },
        },
        {
          package: {
            name: { contains: search as string, mode: 'insensitive' },
          },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: bookings,
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

// Get single booking
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            passportNumber: true,
            passportExpiry: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            basePrice: true,
            duration: true,
            inclusions: true,
            exclusions: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            departureDate: true,
            returnDate: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Réservation introuvable');
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// Create booking
router.post('/', async (req, res, next) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId: req.user!.tenantId },
    });
    if (!customer) {
      throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Client introuvable');
    }

    // Verify package belongs to tenant
    const packageData = await prisma.package.findFirst({
      where: { id: data.packageId, tenantId: req.user!.tenantId },
    });
    if (!packageData) {
      throw new AppError(404, 'PACKAGE_NOT_FOUND', 'Package introuvable');
    }

    // Verify group if provided
    if (data.groupId) {
      const group = await prisma.group.findFirst({
        where: { id: data.groupId, tenantId: req.user!.tenantId },
      });
      if (!group) {
        throw new AppError(404, 'GROUP_NOT_FOUND', 'Groupe introuvable');
      }
    }

    // Validate dates
    const departureDate = new Date(data.departureDate);
    const returnDate = new Date(data.returnDate);
    if (returnDate <= departureDate) {
      throw new AppError(400, 'INVALID_DATES', 'La date de retour doit être après la date de départ');
    }

    // Generate unique booking number
    const bookingNumber = await generateBookingNumber(req.user!.tenantId);

    const booking = await prisma.booking.create({
      data: {
        tenantId: req.user!.tenantId,
        bookingNumber,
        customerId: data.customerId,
        packageId: data.packageId,
        groupId: data.groupId,
        departureDate,
        returnDate,
        totalAmount: data.totalAmount,
        paidAmount: 0,
        balanceDue: data.totalAmount,
        specialRequests: data.specialRequests,
        status: 'PENDING',
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// Update booking
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateBookingSchema.parse(req.body);

    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.booking.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!existingBooking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Réservation introuvable');
    }

    // Cannot update canceled or refunded bookings
    if (existingBooking.status === 'CANCELED' || existingBooking.status === 'REFUNDED') {
      throw new AppError(400, 'BOOKING_LOCKED', 'Cette réservation ne peut plus être modifiée');
    }

    // Validate dates if provided
    if (data.departureDate && data.returnDate) {
      const departureDate = new Date(data.departureDate);
      const returnDate = new Date(data.returnDate);
      if (returnDate <= departureDate) {
        throw new AppError(400, 'INVALID_DATES', 'La date de retour doit être après la date de départ');
      }
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        customerId: data.customerId,
        packageId: data.packageId,
        groupId: data.groupId,
        departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
        returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
        totalAmount: data.totalAmount,
        specialRequests: data.specialRequests,
        status: data.status,
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        contractSigned: data.contractSigned,
        contractSignedAt: data.contractSigned ? new Date() : undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// Delete booking
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: req.user!.tenantId },
      include: {
        payments: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Réservation introuvable');
    }

    // Cannot delete bookings with payments
    if (booking.payments.length > 0) {
      throw new AppError(
        400,
        'BOOKING_HAS_PAYMENTS',
        'Impossible de supprimer une réservation avec des paiements. Veuillez annuler la réservation.'
      );
    }

    await prisma.booking.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Réservation supprimée avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Cancel booking
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Réservation introuvable');
    }

    if (booking.status === 'CANCELED') {
      throw new AppError(400, 'ALREADY_CANCELED', 'Cette réservation est déjà annulée');
    }

    if (booking.status === 'COMPLETED') {
      throw new AppError(400, 'BOOKING_COMPLETED', 'Impossible d\'annuler une réservation terminée');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELED',
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Réservation annulée avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Confirm booking
router.post('/:id/confirm', async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Réservation introuvable');
    }

    if (booking.status !== 'PENDING') {
      throw new AppError(400, 'INVALID_STATUS', 'Seules les réservations en attente peuvent être confirmées');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Réservation confirmée avec succès',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
