import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHospital extends Document {
  _id: mongoose.Types.ObjectId;
  hospitalId: string; // Human-readable unique ID
  name: string;
  code: string;
  registrationNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  creditLimit: number;
  billingTerms: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>({
  hospitalId: {
    type: String,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    trim: true,
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0,
  },
  billingTerms: {
    type: String,
    default: '30 days',
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
HospitalSchema.index({ hospitalId: 1 });
HospitalSchema.index({ code: 1 });
HospitalSchema.index({ name: 1 });
HospitalSchema.index({ email: 1 });
HospitalSchema.index({ isActive: 1 });
HospitalSchema.index({ createdAt: -1 });

// Pre-save middleware to generate hospitalId (will be implemented later)
// HospitalSchema.pre('save', async function(next) {
//   if (this.isNew && !this.hospitalId) {
//     const count = await mongoose.model('Hospital').countDocuments();
//     this.hospitalId = `HSP-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
//   }
//   next();
// });

// Static methods
HospitalSchema.statics.findByHospitalId = function(hospitalId: string) {
  return this.findOne({ hospitalId });
};

HospitalSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

HospitalSchema.statics.searchHospitals = function(searchTerm: string) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { hospitalId: regex },
      { name: regex },
      { code: regex },
      { contactPerson: regex }
    ],
    isActive: true
  });
};

// Export interface for static methods
interface IHospitalModel extends Model<IHospital> {
  findByHospitalId(hospitalId: string): Promise<IHospital | null>;
  findByCode(code: string): Promise<IHospital | null>;
  searchHospitals(searchTerm: string): Promise<IHospital[]>;
}

// Create and export model
const Hospital: IHospitalModel = (mongoose.models.Hospital as IHospitalModel) || 
  mongoose.model<IHospital, IHospitalModel>('Hospital', HospitalSchema);

export default Hospital;