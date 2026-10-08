import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId: string; // Human-readable unique ID
  firstName: string;
  lastName: string;
  registrationNumber: string;
  specialization: string;
  phone: string;
  email?: string;
  hospitalIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  fullName: string;
}

const DoctorSchema = new Schema<IDoctor>({
  doctorId: {
    type: String,
    unique: true,
    index: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    lowercase: true,
    index: true,
  },
  hospitalIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
  }],
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
DoctorSchema.index({ doctorId: 1 });
DoctorSchema.index({ registrationNumber: 1 });
DoctorSchema.index({ firstName: 1, lastName: 1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ hospitalIds: 1 });
DoctorSchema.index({ isActive: 1 });
DoctorSchema.index({ createdAt: -1 });

// Virtual for full name
DoctorSchema.virtual('fullName').get(function() {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to generate doctorId (will be implemented later)
// DoctorSchema.pre('save', async function(next) {
//   if (this.isNew && !this.doctorId) {
//     const count = await mongoose.model('Doctor').countDocuments();
//     this.doctorId = `DOC-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
//   }
//   next();
// });

// Static methods
DoctorSchema.statics.findByDoctorId = function(doctorId: string) {
  return this.findOne({ doctorId }).populate('hospitalIds');
};

DoctorSchema.statics.findByRegistrationNumber = function(registrationNumber: string) {
  return this.findOne({ registrationNumber });
};

DoctorSchema.statics.findByHospital = function(hospitalId: mongoose.Types.ObjectId) {
  return this.find({ 
    hospitalIds: hospitalId, 
    isActive: true 
  }).populate('hospitalIds');
};

DoctorSchema.statics.searchDoctors = function(searchTerm: string) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { doctorId: regex },
      { firstName: regex },
      { lastName: regex },
      { registrationNumber: regex },
      { specialization: regex }
    ],
    isActive: true
  }).populate('hospitalIds');
};

// Export interface for static methods
interface IDoctorModel extends Model<IDoctor> {
  findByDoctorId(doctorId: string): Promise<IDoctor | null>;
  findByRegistrationNumber(registrationNumber: string): Promise<IDoctor | null>;
  findByHospital(hospitalId: mongoose.Types.ObjectId): Promise<IDoctor[]>;
  searchDoctors(searchTerm: string): Promise<IDoctor[]>;
}

// Create and export model
const Doctor: IDoctorModel = (mongoose.models.Doctor as IDoctorModel) || 
  mongoose.model<IDoctor, IDoctorModel>('Doctor', DoctorSchema);

export default Doctor;