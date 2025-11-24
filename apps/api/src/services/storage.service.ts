import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

interface UploadedFile {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
}

export class StorageService {
  private static uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  private static baseUrl = process.env.API_URL || 'http://localhost:5000';

  /**
   * Initialize storage service
   */
  static async initialize(): Promise<void> {
    // Create uploads directory if it doesn't exist
    try {
      await mkdirAsync(this.uploadDir, { recursive: true });

      // Create subdirectories for different types
      const subdirs = ['documents', 'images', 'temp'];
      for (const subdir of subdirs) {
        await mkdirAsync(path.join(this.uploadDir, subdir), { recursive: true });
      }

      console.log('Storage service initialized successfully');
    } catch (error) {
      console.error('Error initializing storage service:', error);
      throw error;
    }
  }

  /**
   * Get upload directory path
   */
  static getUploadDir(type: 'documents' | 'images' | 'temp' = 'documents'): string {
    return path.join(this.uploadDir, type);
  }

  /**
   * Save file information to database and return file details
   */
  static async saveFile(
    file: Express.Multer.File,
    type: 'documents' | 'images' = 'documents'
  ): Promise<UploadedFile> {
    const fileName = file.filename;
    const filePath = path.join(this.getUploadDir(type), fileName);
    const fileUrl = `${this.baseUrl}/uploads/${type}/${fileName}`;

    return {
      originalName: file.originalname,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
      path: filePath,
      url: fileUrl,
    };
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get file URL
   */
  static getFileUrl(fileName: string, type: 'documents' | 'images' = 'documents'): string {
    return `${this.baseUrl}/uploads/${type}/${fileName}`;
  }

  /**
   * Validate file type
   */
  static validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * Validate file size (in bytes)
   */
  static validateFileSize(file: Express.Multer.File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * Get allowed document types
   */
  static getAllowedDocumentTypes(): string[] {
    return [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ];
  }

  /**
   * Generate unique filename
   */
  static generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${nameWithoutExt}-${timestamp}-${random}${ext}`;
  }
}
