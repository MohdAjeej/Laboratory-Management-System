import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILabInfo {
  name: string;
  code: string;
  registrationNumber?: string;
  accreditation?: string;
  logo?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  fax?: string;
}

export interface IWorkingHours {
  monday: { isOpen: boolean; openTime?: string; closeTime?: string };
  tuesday: { isOpen: boolean; openTime?: string; closeTime?: string };
  wednesday: { isOpen: boolean; openTime?: string; closeTime?: string };
  thursday: { isOpen: boolean; openTime?: string; closeTime?: string };
  friday: { isOpen: boolean; openTime?: string; closeTime?: string };
  saturday: { isOpen: boolean; openTime?: string; closeTime?: string };
  sunday: { isOpen: boolean; openTime?: string; closeTime?: string };
}

export interface INumberingFormat {
  prefix: string;
  suffix?: string;
  digitCount: number;
  includeYear: boolean;
  includeMonth: boolean;
  separator: string;
  currentNumber: number;
  resetFrequency: 'NEVER' | 'YEARLY' | 'MONTHLY' | 'DAILY';
  lastResetDate?: Date;
}

export interface IReportSettings {
  headerTemplate?: string;
  footerTemplate?: string;
  includeQRCode: boolean;
  includeBarcode: boolean;
  includeSignatures: boolean;
  requirePathologistSignature: boolean;
  defaultFont: string;
  fontSize: number;
  showCriticalValues: boolean;
  criticalValueHighlight: string;
  watermark?: string;
  disclaimerText?: string;
}

export interface INotificationSettings {
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableWhatsAppNotifications: boolean;
  enableInAppNotifications: boolean;
  notifyOnOrderCreated: boolean;
  notifyOnSampleCollected: boolean;
  notifyOnResultReady: boolean;
  notifyOnCriticalResult: boolean;
  notifyOnReportGenerated: boolean;
  notifyOnPaymentReceived: boolean;
  smsProvider?: string;
  smsApiKey?: string;
  emailFromName?: string;
  emailFromAddress?: string;
}

export interface IBillingSettings {
  defaultTaxRate: number;
  enableDiscount: boolean;
  maxDiscountPercentage: number;
  paymentTermsDays: number;
  lateFeePercentage?: number;
  homeCollectionCharge: number;
  urgentProcessingCharge: number;
  currency: string;
  currencySymbol: string;
}

export interface ISystemSettings extends Document {
  _id: mongoose.Types.ObjectId;
  labInfo: ILabInfo;
  workingHours: IWorkingHours;
  numberingFormats: {
    order: INumberingFormat;
    patient: INumberingFormat;
    sample: INumberingFormat;
    report: INumberingFormat;
    invoice: INumberingFormat;
    payment: INumberingFormat;
  };
  reportSettings: IReportSettings;
  notificationSettings: INotificationSettings;
  billingSettings: IBillingSettings;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  allowPatientRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays?: number;
  backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  lastBackupDate?: Date;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const LabInfoSchema = new Schema<ILabInfo>({
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  registrationNumber: { type: String },
  accreditation: { type: String },
  logo: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  website: { type: String, lowercase: true },
  fax: { type: String },
}, { _id: false });

const DayScheduleSchema = new Schema({
  isOpen: { type: Boolean, default: true },
  openTime: { type: String },
  closeTime: { type: String },
}, { _id: false });

const WorkingHoursSchema = new Schema<IWorkingHours>({
  monday: { type: DayScheduleSchema, default: { isOpen: true, openTime: '09:00', closeTime: '18:00' } },
  tuesday: { type: DayScheduleSchema, default: { isOpen: true, openTime: '09:00', closeTime: '18:00' } },
  wednesday: { type: DayScheduleSchema, default: { isOpen: true, openTime: '09:00', closeTime: '18:00' } },
  thursday: { type: DayScheduleSchema, default: { isOpen: true, openTime: '09:00', closeTime: '18:00' } },
  friday: { type: DayScheduleSchema, default: { isOpen: true, openTime: '09:00', closeTime: '18:00' } },
  saturday: { type: DayScheduleSchema, default: { isOpen: true, openTime: '09:00', closeTime: '14:00' } },
  sunday: { type: DayScheduleSchema, default: { isOpen: false } },
}, { _id: false });

const NumberingFormatSchema = new Schema<INumberingFormat>({
  prefix: { type: String, required: true },
  suffix: { type: String },
  digitCount: { type: Number, default: 6, min: 4, max: 10 },
  includeYear: { type: Boolean, default: true },
  includeMonth: { type: Boolean, default: false },
  separator: { type: String, default: '-' },
  currentNumber: { type: Number, default: 0 },
  resetFrequency: { type: String, enum: ['NEVER', 'YEARLY', 'MONTHLY', 'DAILY'], default: 'YEARLY' },
  lastResetDate: { type: Date },
}, { _id: false });

const ReportSettingsSchema = new Schema<IReportSettings>({
  headerTemplate: { type: String },
  footerTemplate: { type: String },
  includeQRCode: { type: Boolean, default: true },
  includeBarcode: { type: Boolean, default: true },
  includeSignatures: { type: Boolean, default: true },
  requirePathologistSignature: { type: Boolean, default: true },
  defaultFont: { type: String, default: 'Helvetica' },
  fontSize: { type: Number, default: 10, min: 8, max: 14 },
  showCriticalValues: { type: Boolean, default: true },
  criticalValueHighlight: { type: String, default: 'red' },
  watermark: { type: String },
  disclaimerText: { type: String },
}, { _id: false });

const NotificationSettingsSchema = new Schema<INotificationSettings>({
  enableEmailNotifications: { type: Boolean, default: true },
  enableSMSNotifications: { type: Boolean, default: false },
  enableWhatsAppNotifications: { type: Boolean, default: false },
  enableInAppNotifications: { type: Boolean, default: true },
  notifyOnOrderCreated: { type: Boolean, default: true },
  notifyOnSampleCollected: { type: Boolean, default: true },
  notifyOnResultReady: { type: Boolean, default: true },
  notifyOnCriticalResult: { type: Boolean, default: true },
  notifyOnReportGenerated: { type: Boolean, default: true },
  notifyOnPaymentReceived: { type: Boolean, default: true },
  smsProvider: { type: String },
  smsApiKey: { type: String },
  emailFromName: { type: String },
  emailFromAddress: { type: String, lowercase: true },
}, { _id: false });

const BillingSettingsSchema = new Schema<IBillingSettings>({
  defaultTaxRate: { type: Number, default: 0, min: 0, max: 100 },
  enableDiscount: { type: Boolean, default: true },
  maxDiscountPercentage: { type: Number, default: 20, min: 0, max: 100 },
  paymentTermsDays: { type: Number, default: 30, min: 0 },
  lateFeePercentage: { type: Number, min: 0 },
  homeCollectionCharge: { type: Number, default: 100, min: 0 },
  urgentProcessingCharge: { type: Number, default: 500, min: 0 },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
}, { _id: false });

const SystemSettingsSchema = new Schema<ISystemSettings>({
  labInfo: {
    type: LabInfoSchema,
    required: true,
  },
  workingHours: {
    type: WorkingHoursSchema,
    default: () => ({}),
  },
  numberingFormats: {
    order: { type: NumberingFormatSchema, default: { prefix: 'ORD', includeYear: true, digitCount: 6, separator: '-' } },
    patient: { type: NumberingFormatSchema, default: { prefix: 'PAT', includeYear: true, digitCount: 6, separator: '-' } },
    sample: { type: NumberingFormatSchema, default: { prefix: 'SMP', includeYear: true, digitCount: 6, separator: '-' } },
    report: { type: NumberingFormatSchema, default: { prefix: 'RPT', includeYear: true, digitCount: 6, separator: '-' } },
    invoice: { type: NumberingFormatSchema, default: { prefix: 'INV', includeYear: true, digitCount: 6, separator: '-' } },
    payment: { type: NumberingFormatSchema, default: { prefix: 'PAY', includeYear: true, digitCount: 6, separator: '-' } },
  },
  reportSettings: {
    type: ReportSettingsSchema,
    default: () => ({}),
  },
  notificationSettings: {
    type: NotificationSettingsSchema,
    default: () => ({}),
  },
  billingSettings: {
    type: BillingSettingsSchema,
    default: () => ({}),
  },
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  maintenanceMessage: {
    type: String,
  },
  allowPatientRegistration: {
    type: Boolean,
    default: true,
  },
  requireEmailVerification: {
    type: Boolean,
    default: false,
  },
  sessionTimeout: {
    type: Number,
    default: 60, // 1 hour
    min: 10,
  },
  maxLoginAttempts: {
    type: Number,
    default: 5,
    min: 3,
    max: 10,
  },
  lockoutDuration: {
    type: Number,
    default: 120, // 2 hours
    min: 10,
  },
  passwordMinLength: {
    type: Number,
    default: 8,
    min: 6,
  },
  passwordRequireUppercase: {
    type: Boolean,
    default: true,
  },
  passwordRequireLowercase: {
    type: Boolean,
    default: true,
  },
  passwordRequireNumbers: {
    type: Boolean,
    default: true,
  },
  passwordRequireSpecialChars: {
    type: Boolean,
    default: true,
  },
  passwordExpiryDays: {
    type: Number,
    min: 30,
  },
  backupFrequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
    default: 'DAILY',
  },
  lastBackupDate: {
    type: Date,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Static methods
SystemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  // Create default settings if none exist
  if (!settings) {
    throw new Error('System settings not initialized. Please run seeder.');
  }
  
  return settings;
};

SystemSettingsSchema.statics.updateSettings = async function(updates: any, userId: mongoose.Types.ObjectId) {
  const settings = await (this as any).getSettings();
  
  Object.assign(settings, updates);
  settings.updatedBy = userId;
  
  return settings.save();
};

// Export interface for static methods
interface ISystemSettingsModel extends Model<ISystemSettings> {
  getSettings(): Promise<ISystemSettings>;
  updateSettings(updates: any, userId: mongoose.Types.ObjectId): Promise<ISystemSettings>;
}

// Create and export model
const SystemSettings: ISystemSettingsModel = (mongoose.models.SystemSettings as ISystemSettingsModel) || 
  mongoose.model<ISystemSettings, ISystemSettingsModel>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
