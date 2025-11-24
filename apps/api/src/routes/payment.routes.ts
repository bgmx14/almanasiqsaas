import { Router } from 'express';
import { prisma } from '@omraflow/database';
import { authenticate } from '../middleware/auth';
import { createPaymentSchema, updatePaymentSchema } from '@omraflow/shared/validators';
import { AppError } from '@omraflow/shared/types';

const router = Router();
router.use(authenticate);

// Get all payments
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, bookingId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.user!.tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: payments,
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

// Get single payment
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId,
      },
      include: {
        booking: {
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
          },
        },
      },
    });

    if (!payment) {
      throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Paiement introuvable');
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

// Create payment
router.post('/', async (req, res, next) => {
  try {
    const data = createPaymentSchema.parse(req.body);

    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId, tenantId: req.user!.tenantId },
    });

    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Réservation introuvable');
    }

    // Validate amount doesn't exceed balance due
    if (data.amount > booking.balanceDue) {
      throw new AppError(
        400,
        'AMOUNT_EXCEEDS_BALANCE',
        `Le montant ne peut pas dépasser le solde restant (${booking.balanceDue} ${booking.currency})`
      );
    }

    // Create payment and update booking in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the payment
      const payment = await tx.payment.create({
        data: {
          tenantId: req.user!.tenantId,
          bookingId: data.bookingId,
          amount: data.amount,
          currency: booking.currency,
          method: data.method,
          status: data.status || 'COMPLETED',
          reference: data.reference,
          notes: data.notes,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Update booking balance if payment is completed
      if (payment.status === 'COMPLETED') {
        const newPaidAmount = booking.paidAmount + data.amount;
        const newBalanceDue = booking.totalAmount - newPaidAmount;

        await tx.booking.update({
          where: { id: data.bookingId },
          data: {
            paidAmount: newPaidAmount,
            balanceDue: newBalanceDue,
            // Update status to PAID if fully paid
            status: newBalanceDue <= 0 ? 'PAID' : booking.status === 'PENDING' ? 'PAYMENT_PENDING' : booking.status,
          },
        });
      }

      return payment;
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Update payment
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updatePaymentSchema.parse(req.body);

    // Check if payment exists and belongs to tenant
    const existingPayment = await prisma.payment.findFirst({
      where: { id, tenantId: req.user!.tenantId },
      include: {
        booking: true,
      },
    });

    if (!existingPayment) {
      throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Paiement introuvable');
    }

    // Cannot update completed or refunded payments
    if (existingPayment.status === 'COMPLETED' || existingPayment.status === 'REFUNDED') {
      throw new AppError(400, 'PAYMENT_LOCKED', 'Ce paiement ne peut plus être modifié');
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amount: data.amount,
        method: data.method,
        status: data.status,
        reference: data.reference,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

// Delete payment
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { id, tenantId: req.user!.tenantId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Paiement introuvable');
    }

    // Cannot delete completed payments
    if (payment.status === 'COMPLETED') {
      throw new AppError(
        400,
        'PAYMENT_LOCKED',
        'Les paiements complétés ne peuvent pas être supprimés. Créez un remboursement à la place.'
      );
    }

    await prisma.payment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Paiement supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Refund payment
router.post('/:id/refund', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;

    const payment = await prisma.payment.findFirst({
      where: { id, tenantId: req.user!.tenantId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Paiement introuvable');
    }

    if (payment.status !== 'COMPLETED') {
      throw new AppError(400, 'INVALID_STATUS', 'Seuls les paiements complétés peuvent être remboursés');
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new AppError(400, 'INVALID_AMOUNT', 'Le montant du remboursement ne peut pas dépasser le montant du paiement');
    }

    // Create refund and update booking in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status to refunded
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          notes: notes ? `${payment.notes || ''}\n[Remboursement] ${notes}` : payment.notes,
        },
      });

      // Update booking balance
      const newPaidAmount = payment.booking.paidAmount - refundAmount;
      const newBalanceDue = payment.booking.totalAmount - newPaidAmount;

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newBalanceDue > 0 && payment.booking.status === 'PAID' ? 'PAYMENT_PENDING' : payment.booking.status,
        },
      });

      return updatedPayment;
    });

    res.json({
      success: true,
      data: result,
      message: 'Paiement remboursé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
