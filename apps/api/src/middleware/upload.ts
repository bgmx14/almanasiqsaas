import multer from 'multer';
import path from 'path';
import { StorageService } from '../services/storage.service';
import { Request } from 'express';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const type = req.body.type || 'documents';
    cb(null, StorageService.getUploadDir(type));
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, StorageService.generateFileName(file.originalname));
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = StorageService.getAllowedDocumentTypes();

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé. Types acceptés: PDF, Images, Documents Office`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Single file upload
export const uploadSingle = upload.single('file');

// Multiple files upload
export const uploadMultiple = upload.array('files', 10); // Max 10 files

// Handle multer errors
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Le fichier est trop volumineux. Taille maximale: 10MB',
        },
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Trop de fichiers. Maximum: 10 fichiers',
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message,
      },
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message,
      },
    });
  }

  next();
};
