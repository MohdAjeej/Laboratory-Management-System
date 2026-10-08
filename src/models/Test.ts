import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReferenceRange {
  min?: number;
  max?: number;
  text?: string;
}

export interface ICriticalRange {
  min?: number;
  max?: number;
}

export interface ITestParameter extends Document {
  name: string;
  unit?: string;
  referenceRange?: IReferenceRange;
  criticalRange?: ICriticalRange;
  displayOrder: number;
  isActive: boolean;
}

export interface ITest extends Document {
  _id: mongoose.Types.ObjectId;
  testId: string; // Human-readable unique ID
  name: string;
  code: string;
  category: string;
  department: string;
  sampleType: string;
  turnaroundTime: number; // in hours
  price: number;
  parameters: ITestParameter[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReferenceRangeSchema = new Schema<IReferenceRange>({
  min: { type: Number },
  max: { type: Number },
  text: { type: String },
}, { _id: false });

const CriticalRangeSchema = new Schema<ICriticalRange>({
  min: { type: Number },
  max: { type: Number },
}, { _id: false });

const TestParameterSchema = new Schema<ITestParameter>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  unit: {
    type: String,
    trim: true,
  },
  referenceRange: {
    type: ReferenceRangeSchema,
  },
  criticalRange: {
    type: CriticalRangeSchema,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const TestSchema = new Schema<ITest>({
  testId: {
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
  category: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  sampleType: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  turnaroundTime: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  parameters: [TestParameterSchema],
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
TestSchema.index({ testId: 1 });
TestSchema.index({ code: 1 });
TestSchema.index({ name: 1 });
TestSchema.index({ category: 1 });
TestSchema.index({ department: 1 });
TestSchema.index({ sampleType: 1 });
TestSchema.index({ isActive: 1 });
TestSchema.index({ createdAt: -1 });

// Pre-save middleware to generate testId (will be implemented later)
// TestSchema.pre('save', async function(next) {
//   if (this.isNew && !this.testId) {
//     const count = await mongoose.model('Test').countDocuments();
//     this.testId = `TST-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
//   }
//   next();
// });

// Static methods
TestSchema.statics.findByTestId = function(testId: string) {
  return this.findOne({ testId });
};

TestSchema.statics.findByCode = function(code: string) {
  return this.findOne({ code: code.toUpperCase() });
};

TestSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, isActive: true });
};

TestSchema.statics.findByDepartment = function(department: string) {
  return this.find({ department, isActive: true });
};

TestSchema.statics.searchTests = function(searchTerm: string) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { testId: regex },
      { name: regex },
      { code: regex },
      { category: regex },
      { department: regex }
    ],
    isActive: true
  });
};

// Export interface for static methods
interface ITestModel extends Model<ITest> {
  findByTestId(testId: string): Promise<ITest | null>;
  findByCode(code: string): Promise<ITest | null>;
  findByCategory(category: string): Promise<ITest[]>;
  findByDepartment(department: string): Promise<ITest[]>;
  searchTests(searchTerm: string): Promise<ITest[]>;
}

// Create and export model
const Test: ITestModel = (mongoose.models.Test as ITestModel) || 
  mongoose.model<ITest, ITestModel>('Test', TestSchema);

export default Test;