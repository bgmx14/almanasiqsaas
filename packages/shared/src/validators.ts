import { z } from 'zod';

// Common validators using Zod

// Auth validators
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  tenantName: z.string().min(2, 'Le nom de l\'agence doit contenir au moins 2 caractères'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

// Lead validators
export const createLeadSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide').optional(),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  source: z.string().optional(),
  budget: z.number().positive().optional(),
  numberOfPilgrims: z.number().int().positive().default(1),
  preferredDate: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  assignedToId: z.string().uuid().optional(),
});

// Customer validators
export const createCustomerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide').optional(),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  passportCountry: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  medicalConditions: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  mobilityIssues: z.boolean().default(false),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Booking validators
export const createBookingSchema = z.object({
  customerId: z.string().uuid('ID client invalide'),
  packageId: z.string().uuid('ID package invalide'),
  departureDate: z.string(),
  returnDate: z.string(),
  totalAmount: z.number().positive('Le montant doit être positif'),
  groupId: z.string().uuid().optional(),
  specialRequests: z.string().optional(),
});

export const updateBookingSchema = createBookingSchema.partial().extend({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PAYMENT_PENDING',
    'PAID',
    'CHECKED_IN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED',
    'REFUNDED',
  ]).optional(),
  roomNumber: z.string().optional(),
  roomType: z.string().optional(),
});

// Payment validators
export const createPaymentSchema = z.object({
  bookingId: z.string().uuid('ID réservation invalide'),
  amount: z.number().positive('Le montant doit être positif'),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'CHECK', 'CASH', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY']),
  dueDate: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELED']).optional(),
});

// Quote validators
export const createQuoteSchema = z.object({
  leadId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    total: z.number().positive(),
  })),
  subtotal: z.number().positive(),
  tax: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().positive(),
  validUntil: z.string(),
});

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
});

// Package validators
export const createPackageSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  type: z.enum([
    'OMRA_STANDARD',
    'OMRA_RAMADAN',
    'OMRA_VIP',
    'OMRA_COMBINED',
    'OMRA_WOMEN_ONLY',
    'OMRA_FAMILY',
    'CUSTOM',
  ]),
  duration: z.number().int().positive('La durée doit être positive'),
  basePrice: z.number().positive('Le prix doit être positif'),
  currency: z.string().default('EUR'),
  maxCapacity: z.number().int().positive().optional(),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const updatePackageSchema = createPackageSchema.partial();

// Group validators
export const createGroupSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  departureDate: z.string(),
  returnDate: z.string(),
  maxCapacity: z.number().int().positive('La capacité doit être positive'),
  guideName: z.string().optional(),
  guidePhone: z.string().optional(),
});

export const updateGroupSchema = createGroupSchema.partial().extend({
  status: z.enum(['OPEN', 'FULL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']).optional(),
});

// Document validators
export const createDocumentSchema = z.object({
  customerId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  type: z.enum([
    'PASSPORT',
    'VISA',
    'PHOTO',
    'VACCINATION_CERTIFICATE',
    'INSURANCE',
    'FLIGHT_TICKET',
    'HOTEL_VOUCHER',
    'CONTRACT',
    'OTHER',
  ]),
  name: z.string(),
  fileUrl: z.string().url('URL invalide'),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']).optional(),
  rejectionReason: z.string().optional(),
});

// Communication validators
export const createCommunicationSchema = z.object({
  customerId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'CALL', 'NOTE', 'MEETING']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'IN_PERSON', 'INTERNAL']),
  subject: z.string().optional(),
  body: z.string(),
  attachments: z.array(z.any()).default([]),
});

// Review validators
export const createReviewSchema = z.object({
  customerId: z.string().uuid('ID client invalide'),
  overallRating: z.number().int().min(1).max(5, 'La note doit être entre 1 et 5'),
  flightRating: z.number().int().min(1).max(5).optional(),
  hotelRating: z.number().int().min(1).max(5).optional(),
  guideRating: z.number().int().min(1).max(5).optional(),
  organizationRating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
  npsScore: z.number().int().min(0).max(10).optional(),
});

// Task validators
export const createTaskSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  relatedType: z.string().optional(),
  relatedId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELED']).optional(),
});

// Pagination validator
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID validator
export const idSchema = z.object({
  id: z.string().uuid('ID invalide'),
});
