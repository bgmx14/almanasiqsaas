// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

// JWT Token payloads
export interface AccessTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  tokenVersion: number;
}

// User context
export interface UserContext {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  permissions: string[];
}

// Lead & CRM types
export interface LeadCreateInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  source?: string;
  budget?: number;
  numberOfPilgrims?: number;
  preferredDate?: string;
  notes?: string;
}

export interface LeadUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  score?: number;
  assignedToId?: string;
  notes?: string;
}

// Booking types
export interface BookingCreateInput {
  customerId: string;
  packageId: string;
  departureDate: string;
  returnDate: string;
  totalAmount: number;
  specialRequests?: string;
}

// Payment types
export interface PaymentCreateInput {
  bookingId: string;
  amount: number;
  method: string;
  dueDate?: string;
  reference?: string;
  notes?: string;
}

// Analytics & Stats types
export interface DashboardStats {
  totalLeads: number;
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  upcomingDepartures: number;
}

export interface RevenueStats {
  period: string;
  revenue: number;
  bookings: number;
  averageValue: number;
}

export interface LeadConversionStats {
  period: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

// Notification types
export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  userId?: string;
  customerId?: string;
}

// Email types
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// SMS types
export interface SmsData {
  to: string;
  body: string;
  from?: string;
}

// WhatsApp types
export interface WhatsAppData {
  to: string;
  body: string;
  mediaUrl?: string;
}

// File upload types
export interface FileUploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

// Error types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}
