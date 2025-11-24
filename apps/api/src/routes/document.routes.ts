import { Router } from 'express';
import { prisma } from '@omraflow/database';
import { authenticate } from '../middleware/auth';
import { uploadSingle, handleUploadError } from '../middleware/upload';
import { AppError } from '@omraflow/shared/types';
import { StorageService } from '../services/storage.service';

const router = Router();
router.use(authenticate);

// Get all documents (optionally filtered by customer or booking)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, customerId, bookingId, type, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.user!.tenantId,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
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
            },
          },
          booking: {
            select: {
              id: true,
              bookingNumber: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      success: true,
      data: documents,
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

// Get single document
router.get('/:id', async (req, res, next) => {
  try {
    const { id} = req.params;

    const document = await prisma.document.findFirst({
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
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
      },
    });

    if (!document) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
});

// Upload document
router.post('/', uploadSingle, handleUploadError, async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'NO_FILE', 'Aucun fichier fourni');
    }

    const { customerId, bookingId, type, name } = req.body;

    // Validate required fields
    if (!type) {
      throw new AppError(400, 'MISSING_TYPE', 'Le type de document est requis');
    }

    // Validate that either customerId or bookingId is provided
    if (!customerId && !bookingId) {
      throw new AppError(400, 'MISSING_RELATION', 'Un client ou une réservation doit être spécifié');
    }

    // Verify customer belongs to tenant
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId: req.user!.tenantId },
      });
      if (!customer) {
        throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Client introuvable');
      }
    }

    // Verify booking belongs to tenant
    if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, tenantId: req.user!.tenantId },
      });
      if (!booking) {
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Réservation introuvable');
      }
    }

    // Save file information
    const fileInfo = await StorageService.saveFile(req.file);

    // Create document record
    const document = await prisma.document.create({
      data: {
        tenantId: req.user!.tenantId,
        customerId: customerId || null,
        bookingId: bookingId || null,
        type,
        name: name || req.file.originalname,
        fileUrl: fileInfo.url,
        fileSize: fileInfo.size,
        mimeType: fileInfo.mimeType,
        status: 'PENDING',
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document téléchargé avec succès',
    });
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      try {
        await StorageService.deleteFile(req.file.path);
      } catch (deleteError) {
        console.error('Error deleting file after failed upload:', deleteError);
      }
    }
    next(error);
  }
});

// Update document (metadata, status, etc.)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, status, verifiedAt, rejectionReason, metadata } = req.body;

    // Check if document exists and belongs to tenant
    const existingDocument = await prisma.document.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!existingDocument) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'VERIFIED') {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = req.user!.id;
      }
    }
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (metadata !== undefined) updateData.metadata = metadata;

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: document,
      message: 'Document mis à jour avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Delete document
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!document) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
    }

    // Extract filename from URL
    const urlParts = document.fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const fileType = urlParts[urlParts.length - 2] as 'documents' | 'images';

    // Delete file from storage
    try {
      const filePath = StorageService.getUploadDir(fileType) + '/' + fileName;
      await StorageService.deleteFile(filePath);
    } catch (deleteError) {
      console.error('Error deleting file from storage:', deleteError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete document record
    await prisma.document.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Document supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Verify document
router.post('/:id/verify', async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!document) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: req.user!.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedDocument,
      message: 'Document vérifié avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// Reject document
router.post('/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError(400, 'MISSING_REASON', 'La raison du rejet est requise');
    }

    const document = await prisma.document.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });

    if (!document) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        verifiedBy: req.user!.id,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedDocument,
      message: 'Document rejeté',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
