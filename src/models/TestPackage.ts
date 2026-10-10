import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPackageTest {
  testId: mongoose.Types.ObjectId;
  isOptional: boolean;
  additionalPrice?: number; // If test costs more than standard in package
}

export interface ITestPackage extends Document {
  _id: mongoose.Types.ObjectId;
  packageId: string; // Human-readable unique ID
  name: string;
  description: string;
  category: string;
  tests: IPackageTest[];
  price: number;
  discountedPrice?: number;
  discountPercentage?: number;
  preparationInstructions?: string;
  sampleType: string[];
  reportDeliveryTime: number; // in hours
  ageGroup?: 'ALL' | 'PEDIATRIC' | 'ADULT' | 'GERIATRIC';
  gender?: 'ALL' | 'MALE' | 'FEMALE';
  isActive: boolean;
  isPopular: boolean;
  popularityRank?: number;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PackageTestSchema = new Schema<IPackageTest>({
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  isOptional: {
    type: Boolean,
    default: false,
  },
  additionalPrice: {
    type: Number,
    min: 0,
    default: 0,
  },
}, { _id: false });

const TestPackageSchema = new Schema<ITestPackage>({
  packageId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  tests: [PackageTestSchema],
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountedPrice: {
    type: Number,
    min: 0,
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  preparationInstructions: {
    type: String,
  },
  sampleType: [{
    type: String,
    required: true,
  }],
  reportDeliveryTime: {
    type: Number,
    required: true,
    default: 24,
  },
  ageGroup: {
    type: String,
    enum: ['ALL', 'PEDIATRIC', 'ADULT', 'GERIATRIC'],
    default: 'ALL',
  },
  gender: {
    type: String,
    enum: ['ALL', 'MALE', 'FEMALE'],
    default: 'ALL',
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isPopular: {
    type: Boolean,
    default: false,
    index: true,
  },
  popularityRank: {
    type: Number,
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TestPackageSchema.index({ packageId: 1 });
TestPackageSchema.index({ name: 'text', description: 'text', tags: 'text' });
TestPackageSchema.index({ category: 1, isActive: 1 });
TestPackageSchema.index({ isPopular: 1, popularityRank: 1 });
TestPackageSchema.index({ price: 1 });
TestPackageSchema.index({ discountedPrice: 1 });

// Virtual for test count
TestPackageSchema.virtual('testCount').get(function() {
  return this.tests.length;
});

// Virtual for mandatory test count
TestPackageSchema.virtual('mandatoryTestCount').get(function() {
  return this.tests.filter(t => !t.isOptional).length;
});

// Virtual for actual price
TestPackageSchema.virtual('actualPrice').get(function() {
  return this.discountedPrice || this.price;
});

// Virtual for savings
TestPackageSchema.virtual('savings').get(function() {
  if (this.discountedPrice && this.discountedPrice < this.price) {
    return this.price - this.discountedPrice;
  }
  return 0;
});

// Pre-save middleware to calculate discount
TestPackageSchema.pre('save', function() {
  if (this.discountedPrice && this.discountedPrice < this.price) {
    this.discountPercentage = Math.round(((this.price - this.discountedPrice) / this.price) * 100);
  } else if (this.discountPercentage && this.discountPercentage > 0) {
    this.discountedPrice = this.price - (this.price * this.discountPercentage / 100);
  }
});

// Instance methods
TestPackageSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

TestPackageSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

TestPackageSchema.methods.addTest = function(testId: mongoose.Types.ObjectId, isOptional: boolean = false, additionalPrice: number = 0) {
  // Check if test already exists
  const exists = this.tests.some(t => t.testId.toString() === testId.toString());
  if (!exists) {
    this.tests.push({ testId, isOptional, additionalPrice });
  }
  return this.save();
};

TestPackageSchema.methods.removeTest = function(testId: mongoose.Types.ObjectId) {
  this.tests = this.tests.filter(t => t.testId.toString() !== testId.toString());
  return this.save();
};

TestPackageSchema.methods.markAsPopular = function(rank?: number) {
  this.isPopular = true;
  if (rank) {
    this.popularityRank = rank;
  }
  return this.save();
};

// Static methods
TestPackageSchema.statics.findByPackageId = function(packageId: string) {
  return this.findOne({ packageId: packageId.toUpperCase() })
    .populate('tests.testId')
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');
};

TestPackageSchema.statics.findActive = function() {
  return this.find({ isActive: true })
    .populate('tests.testId')
    .sort({ name: 1 });
};

TestPackageSchema.statics.findByCategory = function(category: string, activeOnly: boolean = true) {
  const query: any = { category };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query)
    .populate('tests.testId')
    .sort({ name: 1 });
};

TestPackageSchema.statics.findPopular = function(limit: number = 10) {
  return this.find({ isActive: true, isPopular: true })
    .populate('tests.testId')
    .sort({ popularityRank: 1, name: 1 })
    .limit(limit);
};

TestPackageSchema.statics.searchPackages = async function(searchTerm: string, filters?: any) {
  const query: any = {
    $text: { $search: searchTerm },
    isActive: true,
  };

  if (filters) {
    if (filters.category) query.category = filters.category;
    if (filters.ageGroup) query.ageGroup = { $in: ['ALL', filters.ageGroup] };
    if (filters.gender) query.gender = { $in: ['ALL', filters.gender] };
    if (filters.minPrice !== undefined) query.price = { $gte: filters.minPrice };
    if (filters.maxPrice !== undefined) {
      query.price = { ...query.price, $lte: filters.maxPrice };
    }
  }

  return this.find(query)
    .populate('tests.testId')
    .sort({ score: { $meta: 'textScore' }, popularityRank: 1 });
};

TestPackageSchema.statics.getCategories = async function() {
  return this.distinct('category', { isActive: true });
};

TestPackageSchema.statics.getPriceRange = async function() {
  const result = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgPrice: { $avg: '$price' },
      }
    }
  ]);

  return result.length > 0 ? result[0] : { minPrice: 0, maxPrice: 0, avgPrice: 0 };
};

// Export interface for static methods
interface ITestPackageModel extends Model<ITestPackage> {
  findByPackageId(packageId: string): Promise<ITestPackage | null>;
  findActive(): Promise<ITestPackage[]>;
  findByCategory(category: string, activeOnly?: boolean): Promise<ITestPackage[]>;
  findPopular(limit?: number): Promise<ITestPackage[]>;
  searchPackages(searchTerm: string, filters?: any): Promise<ITestPackage[]>;
  getCategories(): Promise<string[]>;
  getPriceRange(): Promise<{ minPrice: number; maxPrice: number; avgPrice: number }>;
}

// Create and export model
const TestPackage: ITestPackageModel = (mongoose.models.TestPackage as ITestPackageModel) || 
  mongoose.model<ITestPackage, ITestPackageModel>('TestPackage', TestPackageSchema);

export default TestPackage;
