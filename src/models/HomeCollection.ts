import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAddress {
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface IHomeCollectionEvent {
  event: string;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
  notes?: string;
}

export interface IHomeCollection extends Document {
  _id: mongoose.Types.ObjectId;
  collectionId: string; // Human-readable unique ID
  orderId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  address: IAddress;
  contactPhone: string;
  alternatePhone?: string;
  preferredDate: Date;
  preferredTimeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';
  scheduledDate?: Date;
  scheduledTimeSlot?: string;
  assignedTo?: mongoose.Types.ObjectId; // Phlebotomist
  status: 'REQUESTED' | 'SCHEDULED' | 'ASSIGNED' | 'IN_TRANSIT' | 'COLLECTED' | 'CANCELLED' | 'FAILED';
  cancellationReason?: string;
  failureReason?: string;
  collectionCharge: number;
  isPaid: boolean;
  actualCollectionTime?: Date;
  specialInstructions?: string;
  preparationNotes?: string;
  events: IHomeCollectionEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  street: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
    index: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
    index: true,
  },
  landmark: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
}, { _id: false });

const HomeCollectionEventSchema = new Schema<IHomeCollectionEvent>({
  event: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: {
    type: String,
  },
}, { _id: false });

const HomeCollectionSchema = new Schema<IHomeCollection>({
  collectionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  },
  address: {
    type: AddressSchema,
    required: true,
  },
  contactPhone: {
    type: String,
    required: true,
  },
  alternatePhone: {
    type: String,
  },
  preferredDate: {
    type: Date,
    required: true,
    index: true,
  },
  preferredTimeSlot: {
    type: String,
    enum: ['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME'],
    required: true,
  },
  scheduledDate: {
    type: Date,
    index: true,
  },
  scheduledTimeSlot: {
    type: String,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'SCHEDULED', 'ASSIGNED', 'IN_TRANSIT', 'COLLECTED', 'CANCELLED', 'FAILED'],
    default: 'REQUESTED',
    index: true,
  },
  cancellationReason: {
    type: String,
  },
  failureReason: {
    type: String,
  },
  collectionCharge: {
    type: Number,
    required: true,
    default: 0,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  actualCollectionTime: {
    type: Date,
  },
  specialInstructions: {
    type: String,
  },
  preparationNotes: {
    type: String,
  },
  events: [HomeCollectionEventSchema],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
HomeCollectionSchema.index({ collectionId: 1 });
HomeCollectionSchema.index({ orderId: 1 });
HomeCollectionSchema.index({ patientId: 1 });
HomeCollectionSchema.index({ status: 1, scheduledDate: 1 });
HomeCollectionSchema.index({ assignedTo: 1, status: 1 });
HomeCollectionSchema.index({ 'address.city': 1, status: 1 });
HomeCollectionSchema.index({ 'address.pincode': 1, status: 1 });
HomeCollectionSchema.index({ preferredDate: 1, status: 1 });
HomeCollectionSchema.index({ createdAt: -1 });

// Pre-save middleware to generate collectionId
HomeCollectionSchema.pre('save', async function() {
  if (this.isNew && !this.collectionId) {
    const count = await mongoose.model('HomeCollection').countDocuments();
    this.collectionId = `HC-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
  }
});

// Instance methods
HomeCollectionSchema.methods.addEvent = function(event: string, userId: mongoose.Types.ObjectId, notes?: string) {
  this.events.push({
    event,
    userId,
    notes,
    timestamp: new Date(),
  });
  return this.save();
};

HomeCollectionSchema.methods.schedule = function(
  scheduledDate: Date,
  timeSlot: string,
  userId: mongoose.Types.ObjectId
) {
  this.scheduledDate = scheduledDate;
  this.scheduledTimeSlot = timeSlot;
  this.status = 'SCHEDULED';
  this.addEvent(`Scheduled for ${timeSlot}`, userId);
  return this.save();
};

HomeCollectionSchema.methods.assign = function(
  phlebotomistId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) {
  this.assignedTo = phlebotomistId;
  this.status = 'ASSIGNED';
  this.addEvent('Assigned to phlebotomist', userId);
  return this.save();
};

HomeCollectionSchema.methods.markInTransit = function(userId: mongoose.Types.ObjectId) {
  this.status = 'IN_TRANSIT';
  this.addEvent('Phlebotomist on the way', userId);
  return this.save();
};

HomeCollectionSchema.methods.markCollected = function(userId: mongoose.Types.ObjectId) {
  this.status = 'COLLECTED';
  this.actualCollectionTime = new Date();
  this.addEvent('Sample collected successfully', userId);
  return this.save();
};

HomeCollectionSchema.methods.cancel = function(userId: mongoose.Types.ObjectId, reason: string) {
  this.status = 'CANCELLED';
  this.cancellationReason = reason;
  this.addEvent('Collection cancelled', userId, reason);
  return this.save();
};

HomeCollectionSchema.methods.markFailed = function(userId: mongoose.Types.ObjectId, reason: string) {
  this.status = 'FAILED';
  this.failureReason = reason;
  this.addEvent('Collection failed', userId, reason);
  return this.save();
};

// Static methods
HomeCollectionSchema.statics.findByCollectionId = function(collectionId: string) {
  return this.findOne({ collectionId })
    .populate('orderId')
    .populate('patientId')
    .populate('assignedTo', 'firstName lastName phone');
};

HomeCollectionSchema.statics.findByOrder = function(orderId: mongoose.Types.ObjectId) {
  return this.findOne({ orderId })
    .populate('patientId')
    .populate('assignedTo', 'firstName lastName phone');
};

HomeCollectionSchema.statics.findByPatient = function(patientId: mongoose.Types.ObjectId) {
  return this.find({ patientId })
    .populate('orderId')
    .populate('assignedTo', 'firstName lastName phone')
    .sort({ createdAt: -1 });
};

HomeCollectionSchema.statics.findByStatus = function(status: string) {
  return this.find({ status: status as any })
    .populate('orderId')
    .populate('patientId')
    .populate('assignedTo', 'firstName lastName phone')
    .sort({ scheduledDate: 1, preferredDate: 1 });
};

HomeCollectionSchema.statics.findByPhlebotomist = function(
  phlebotomistId: mongoose.Types.ObjectId,
  status?: string
) {
  const query: any = { assignedTo: phlebotomistId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('orderId')
    .populate('patientId')
    .sort({ scheduledDate: 1 });
};

HomeCollectionSchema.statics.findScheduledForDate = function(date: Date, city?: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query: any = {
    scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['SCHEDULED', 'ASSIGNED', 'IN_TRANSIT'] },
  };

  if (city) {
    query['address.city'] = city;
  }

  return this.find(query)
    .populate('orderId')
    .populate('patientId')
    .populate('assignedTo', 'firstName lastName phone')
    .sort({ scheduledTimeSlot: 1 });
};

HomeCollectionSchema.statics.findUnassigned = function(city?: string) {
  const query: any = {
    status: { $in: ['REQUESTED', 'SCHEDULED'] },
    assignedTo: { $exists: false },
  };

  if (city) {
    query['address.city'] = city;
  }

  return this.find(query)
    .populate('orderId')
    .populate('patientId')
    .sort({ preferredDate: 1 });
};

HomeCollectionSchema.statics.getStatsByDate = async function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCharge: { $sum: '$collectionCharge' },
      }
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
        totalCharge: 1,
      }
    }
  ]);
};

// Export interface for static methods
interface IHomeCollectionModel extends Model<IHomeCollection> {
  findByCollectionId(collectionId: string): Promise<IHomeCollection | null>;
  findByOrder(orderId: mongoose.Types.ObjectId): Promise<IHomeCollection | null>;
  findByPatient(patientId: mongoose.Types.ObjectId): Promise<IHomeCollection[]>;
  findByStatus(status: string): Promise<IHomeCollection[]>;
  findByPhlebotomist(phlebotomistId: mongoose.Types.ObjectId, status?: string): Promise<IHomeCollection[]>;
  findScheduledForDate(date: Date, city?: string): Promise<IHomeCollection[]>;
  findUnassigned(city?: string): Promise<IHomeCollection[]>;
  getStatsByDate(startDate: Date, endDate: Date): Promise<any>;
}

// Create and export model
const HomeCollection: IHomeCollectionModel = (mongoose.models.HomeCollection as IHomeCollectionModel) || 
  mongoose.model<IHomeCollection, IHomeCollectionModel>('HomeCollection', HomeCollectionSchema);

export default HomeCollection;
