import { z } from 'zod';
import { UserRole } from './permissions';

// Common validation schemas
export const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number').min(10, 'Phone number too short');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/(?=.*\d)/, 'Password must contain at least one number')
  .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character');

// Gender options
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

// Status enums
export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  SAMPLE_PENDING = 'SAMPLE_PENDING',
  PROCESSING = 'PROCESSING',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SampleStatus {
  COLLECTED = 'COLLECTED',
  RECEIVED = 'RECEIVED',
  REJECTED = 'REJECTED',
  RECOLLECTION_REQUIRED = 'RECOLLECTION_REQUIRED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ResultStatus {
  DRAFT = 'DRAFT',
  ENTERED = 'ENTERED',
  ABNORMAL = 'ABNORMAL',
  CRITICAL = 'CRITICAL',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  AMENDED = 'AMENDED',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  VERIFIED = 'VERIFIED',
  PUBLISHED = 'PUBLISHED',
  DOWNLOADED = 'DOWNLOADED',
  AMENDED = 'AMENDED',
  REVOKED = 'REVOKED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// User schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.nativeEnum(UserRole),
  phone: phoneSchema.optional(),
  hospitalId: mongoIdSchema.optional(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: phoneSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  hospitalId: mongoIdSchema.optional(),
  isActive: z.boolean().optional(),
});

// Patient schemas
export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: z.string().pipe(z.coerce.date()),
  gender: z.nativeEnum(Gender),
  phone: phoneSchema,
  email: emailSchema.optional(),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required').default('India'),
  }),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    phone: phoneSchema,
    relationship: z.string().min(1, 'Relationship is required'),
  }).optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

// Hospital schemas
export const createHospitalSchema = z.object({
  name: z.string().min(1, 'Hospital name is required').max(100),
  code: z.string().min(2, 'Hospital code is required').max(10).toUpperCase(),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  phone: phoneSchema,
  email: emailSchema,
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required').default('India'),
  }),
  creditLimit: z.number().min(0).default(0),
  billingTerms: z.string().default('30 days'),
  isActive: z.boolean().default(true),
});

export const updateHospitalSchema = createHospitalSchema.partial();

// Doctor schemas
export const createDoctorSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  phone: phoneSchema,
  email: emailSchema.optional(),
  hospitalIds: z.array(mongoIdSchema).default([]),
  isActive: z.boolean().default(true),
});

export const updateDoctorSchema = createDoctorSchema.partial();

// Test schemas
export const createTestParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  unit: z.string().optional(),
  referenceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    text: z.string().optional(),
  }).optional(),
  criticalRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const createTestSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(100),
  code: z.string().min(1, 'Test code is required').max(20).toUpperCase(),
  category: z.string().min(1, 'Category is required'),
  department: z.string().min(1, 'Department is required'),
  sampleType: z.string().min(1, 'Sample type is required'),
  turnaroundTime: z.number().min(1, 'Turnaround time must be at least 1 hour'),
  price: z.number().min(0, 'Price must be non-negative'),
  parameters: z.array(createTestParameterSchema).min(1, 'At least one parameter is required'),
  isActive: z.boolean().default(true),
});

export const updateTestSchema = createTestSchema.partial();

// Order schemas
export const createOrderItemSchema = z.object({
  testId: mongoIdSchema.optional(),
  packageId: mongoIdSchema.optional(),
  quantity: z.number().min(1).default(1),
  price: z.number().min(0),
  discount: z.number().min(0).default(0),
}).refine(data => data.testId || data.packageId, {
  message: 'Either testId or packageId must be provided',
});

export const createOrderSchema = z.object({
  patientId: mongoIdSchema,
  hospitalId: mongoIdSchema.optional(),
  doctorId: mongoIdSchema.optional(),
  items: z.array(createOrderItemSchema).min(1, 'At least one test or package is required'),
  priority: z.enum(['NORMAL', 'URGENT']).default('NORMAL'),
  notes: z.string().optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
});

// Sample schemas
export const createSampleSchema = z.object({
  orderId: mongoIdSchema,
  sampleType: z.string().min(1, 'Sample type is required'),
  collectionDate: z.string().pipe(z.coerce.date()).optional(),
  collectedBy: z.string().optional(),
  collectionLocation: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSampleStatusSchema = z.object({
  status: z.nativeEnum(SampleStatus),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
  if (data.status === SampleStatus.REJECTED) {
    return !!data.rejectionReason;
  }
  return true;
}, {
  message: 'Rejection reason is required when rejecting sample',
  path: ['rejectionReason'],
});

// Result schemas
export const createResultSchema = z.object({
  sampleId: mongoIdSchema,
  testId: mongoIdSchema,
  parameterId: mongoIdSchema,
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  flag: z.enum(['NORMAL', 'HIGH', 'LOW', 'ABNORMAL', 'CRITICAL']).optional(),
  notes: z.string().optional(),
});

export const updateResultSchema = z.object({
  value: z.union([z.string(), z.number()]),
  notes: z.string().optional(),
  amendmentReason: z.string().optional(),
});

// Billing schemas
export const createPaymentSchema = z.object({
  orderId: mongoIdSchema,
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'ONLINE']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Inventory schemas
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  code: z.string().min(1, 'Item code is required').toUpperCase(),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  minimumStock: z.number().min(0).default(0),
  supplierId: mongoIdSchema.optional(),
  isActive: z.boolean().default(true),
});

export const createInventoryTransactionSchema = z.object({
  itemId: mongoIdSchema,
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number(),
  unitCost: z.number().min(0).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().pipe(z.coerce.date()).optional(),
  notes: z.string().optional(),
});

// Export all schemas
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type CreatePatientSchema = z.infer<typeof createPatientSchema>;
export type UpdatePatientSchema = z.infer<typeof updatePatientSchema>;
export type CreateHospitalSchema = z.infer<typeof createHospitalSchema>;
export type UpdateHospitalSchema = z.infer<typeof updateHospitalSchema>;
export type CreateDoctorSchema = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorSchema = z.infer<typeof updateDoctorSchema>;
export type CreateTestSchema = z.infer<typeof createTestSchema>;
export type UpdateTestSchema = z.infer<typeof updateTestSchema>;
export type CreateOrderSchema = z.infer<typeof createOrderSchema>;
export type CreateSampleSchema = z.infer<typeof createSampleSchema>;
export type UpdateSampleStatusSchema = z.infer<typeof updateSampleStatusSchema>;
export type CreateResultSchema = z.infer<typeof createResultSchema>;
export type UpdateResultSchema = z.infer<typeof updateResultSchema>;
export type CreatePaymentSchema = z.infer<typeof createPaymentSchema>;
export type CreateInventoryItemSchema = z.infer<typeof createInventoryItemSchema>;
export type CreateInventoryTransactionSchema = z.infer<typeof createInventoryTransactionSchema>;