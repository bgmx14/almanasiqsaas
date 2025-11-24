// Application-wide constants

export const APP_NAME = 'OmraFlow Pro';
export const APP_DESCRIPTION = 'SaaS platform for Omra agency management';
export const APP_VERSION = '1.0.0';

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// JWT
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

// File uploads
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: 'Starter',
    price: 89,
    currency: 'EUR',
    maxPilgrims: 100,
    maxUsers: 2,
    features: [
      'CRM complet',
      'Réservations & paiements',
      'Documents & visa',
      'App mobile pèlerins',
      'Support email',
      '10 Go stockage',
    ],
  },
  BUSINESS: {
    name: 'Business',
    price: 199,
    currency: 'EUR',
    maxPilgrims: 500,
    maxUsers: 5,
    features: [
      'Tout du plan Starter',
      'Marketing automation',
      'Analytics avancés',
      'Intégrations',
      'API access',
      'Support prioritaire',
      '50 Go stockage',
      'Custom domain',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 499,
    currency: 'EUR',
    maxPilgrims: -1, // Unlimited
    maxUsers: -1, // Unlimited
    features: [
      'Tout du plan Business',
      'Account manager dédié',
      'Onboarding personnalisé',
      'Formation équipe',
      'Custom features',
      'SLA 99.9%',
      'Support 24/7',
      'Stockage illimité',
      'White-label complet',
    ],
  },
};

// Lead statuses
export const LEAD_STATUSES = [
  { value: 'NEW', label: 'Nouveau', color: '#3B82F6' },
  { value: 'CONTACTED', label: 'Contacté', color: '#8B5CF6' },
  { value: 'QUALIFIED', label: 'Qualifié', color: '#6366F1' },
  { value: 'PROPOSAL_SENT', label: 'Devis envoyé', color: '#EC4899' },
  { value: 'NEGOTIATION', label: 'Négociation', color: '#F59E0B' },
  { value: 'WON', label: 'Gagné', color: '#10B981' },
  { value: 'LOST', label: 'Perdu', color: '#EF4444' },
];

// Booking statuses
export const BOOKING_STATUSES = [
  { value: 'PENDING', label: 'En attente', color: '#F59E0B' },
  { value: 'CONFIRMED', label: 'Confirmé', color: '#3B82F6' },
  { value: 'PAYMENT_PENDING', label: 'Paiement en attente', color: '#EC4899' },
  { value: 'PAID', label: 'Payé', color: '#10B981' },
  { value: 'CHECKED_IN', label: 'Enregistré', color: '#8B5CF6' },
  { value: 'IN_PROGRESS', label: 'En cours', color: '#6366F1' },
  { value: 'COMPLETED', label: 'Terminé', color: '#059669' },
  { value: 'CANCELED', label: 'Annulé', color: '#EF4444' },
  { value: 'REFUNDED', label: 'Remboursé', color: '#DC2626' },
];

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Carte bancaire', icon: '💳' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire', icon: '🏦' },
  { value: 'CHECK', label: 'Chèque', icon: '📝' },
  { value: 'CASH', label: 'Espèces', icon: '💵' },
  { value: 'PAYPAL', label: 'PayPal', icon: '🅿️' },
];

// User roles
export const USER_ROLES = [
  { value: 'ADMIN', label: 'Administrateur', permissions: ['*'] },
  { value: 'MANAGER', label: 'Manager', permissions: ['read', 'write', 'manage_team'] },
  { value: 'COMMERCIAL', label: 'Commercial', permissions: ['read', 'write_leads', 'write_bookings'] },
  { value: 'ACCOUNTANT', label: 'Comptable', permissions: ['read', 'manage_payments', 'manage_invoices'] },
  { value: 'AGENT', label: 'Agent', permissions: ['read', 'write_bookings'] },
  { value: 'GUIDE', label: 'Guide', permissions: ['read'] },
];

// Document types
export const DOCUMENT_TYPES = [
  { value: 'PASSPORT', label: 'Passeport', icon: '🛂' },
  { value: 'VISA', label: 'Visa', icon: '✈️' },
  { value: 'PHOTO', label: 'Photo d\'identité', icon: '📸' },
  { value: 'VACCINATION_CERTIFICATE', label: 'Certificat de vaccination', icon: '💉' },
  { value: 'INSURANCE', label: 'Assurance', icon: '🛡️' },
  { value: 'FLIGHT_TICKET', label: 'Billet d\'avion', icon: '🎫' },
  { value: 'HOTEL_VOUCHER', label: 'Voucher hôtel', icon: '🏨' },
  { value: 'CONTRACT', label: 'Contrat', icon: '📄' },
  { value: 'OTHER', label: 'Autre', icon: '📎' },
];

// Package types
export const PACKAGE_TYPES = [
  { value: 'OMRA_STANDARD', label: 'Omra Standard' },
  { value: 'OMRA_RAMADAN', label: 'Omra Ramadan' },
  { value: 'OMRA_VIP', label: 'Omra VIP' },
  { value: 'OMRA_COMBINED', label: 'Omra Combinée' },
  { value: 'OMRA_WOMEN_ONLY', label: 'Omra Femmes' },
  { value: 'OMRA_FAMILY', label: 'Omra Famille' },
  { value: 'CUSTOM', label: 'Personnalisé' },
];

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  BOOKING_CONFIRMATION: 'booking_confirmation',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_REMINDER: 'payment_reminder',
  DOCUMENT_REQUEST: 'document_request',
  VISA_APPROVED: 'visa_approved',
  DEPARTURE_REMINDER: 'departure_reminder',
  POST_TRIP_REVIEW: 'post_trip_review',
  PASSWORD_RESET: 'password_reset',
};

// SMS templates
export const SMS_TEMPLATES = {
  BOOKING_CONFIRMATION: 'Votre réservation OmraFlow #{bookingNumber} est confirmée. Départ le {departureDate}.',
  PAYMENT_REMINDER: 'Rappel: Paiement de {amount}€ dû le {dueDate} pour votre réservation #{bookingNumber}.',
  DEPARTURE_REMINDER: 'Votre départ pour la Omra est dans {days} jours! RDV le {date} à {time} à {location}.',
  DOCUMENT_REMINDER: 'Documents manquants pour votre dossier. Veuillez les uploader sur votre espace personnel.',
};

// Countries (sample list - can be extended)
export const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦' },
];

// Date formats
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD MMMM YYYY',
  WITH_TIME: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
};

// Currencies
export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
];
