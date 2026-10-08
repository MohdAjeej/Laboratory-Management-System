import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import connectToDatabase from './mongodb';

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationEvent {
  REPORT_READY = 'REPORT_READY',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  HOME_COLLECTION_REMINDER = 'HOME_COLLECTION_REMINDER',
  CRITICAL_RESULT = 'CRITICAL_RESULT',
  SAMPLE_REJECTION = 'SAMPLE_REJECTION',
  REPORT_VERIFICATION = 'REPORT_VERIFICATION',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  HOSPITAL_PENDING_REPORT = 'HOSPITAL_PENDING_REPORT',
  OVERDUE_REPORT = 'OVERDUE_REPORT',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  EQUIPMENT_MAINTENANCE = 'EQUIPMENT_MAINTENANCE',
}

export interface INotification {
  _id: mongoose.Types.ObjectId;
  type: NotificationType;
  event: NotificationEvent;
  recipientId: mongoose.Types.ObjectId;
  recipientType: 'USER' | 'PATIENT' | 'HOSPITAL';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>({
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true,
  },
  event: {
    type: String,
    enum: Object.values(NotificationEvent),
    required: true,
    index: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  recipientType: {
    type: String,
    enum: ['USER', 'PATIENT', 'HOSPITAL'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  sentAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, sentAt: 1 });
NotificationSchema.index({ event: 1, createdAt: -1 });

const Notification = (mongoose.models.Notification as mongoose.Model<INotification>) || 
  mongoose.model<INotification>('Notification', NotificationSchema);

// Email transporter setup
let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return emailTransporter;
}

// Create notification
export async function createNotification(params: {
  type: NotificationType;
  event: NotificationEvent;
  recipientId: mongoose.Types.ObjectId | string;
  recipientType: 'USER' | 'PATIENT' | 'HOSPITAL';
  title: string;
  message: string;
  data?: Record<string, any>;
}): Promise<INotification> {
  await connectToDatabase();
  
  const notification = new Notification(params);
  await notification.save();
  
  return notification;
}

// Send email notification
export async function sendEmailNotification(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || text,
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Send SMS notification (placeholder - integrate with SMS provider)
export async function sendSMSNotification(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    console.log(`SMS to ${phone}: ${message}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

// Send WhatsApp notification (placeholder - integrate with WhatsApp Business API)
export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    // TODO: Integrate with WhatsApp Business API
    console.log(`WhatsApp to ${phone}: ${message}`);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp:', error);
    return false;
  }
}

// Send notification based on type
export async function sendNotification(notification: INotification, recipientInfo: {
  email?: string;
  phone?: string;
}): Promise<boolean> {
  let sent = false;
  
  try {
    switch (notification.type) {
      case NotificationType.EMAIL:
        if (recipientInfo.email) {
          sent = await sendEmailNotification(
            recipientInfo.email,
            notification.title,
            notification.message
          );
        }
        break;
        
      case NotificationType.SMS:
        if (recipientInfo.phone) {
          sent = await sendSMSNotification(
            recipientInfo.phone,
            `${notification.title}: ${notification.message}`
          );
        }
        break;
        
      case NotificationType.WHATSAPP:
        if (recipientInfo.phone) {
          sent = await sendWhatsAppNotification(
            recipientInfo.phone,
            `${notification.title}: ${notification.message}`
          );
        }
        break;
        
      case NotificationType.IN_APP:
        // In-app notifications are stored in database only
        sent = true;
        break;
        
      default:
        console.warn('Unsupported notification type:', notification.type);
    }
    
    if (sent) {
      await Notification.findByIdAndUpdate(notification._id, {
        sentAt: new Date(),
        deliveredAt: new Date(), // Assume immediate delivery for now
      });
    }
    
    return sent;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: mongoose.Types.ObjectId | string
): Promise<boolean> {
  try {
    await connectToDatabase();
    
    const result = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    return !!result;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
}

// Get notifications for recipient
export async function getNotifications(
  recipientId: mongoose.Types.ObjectId | string,
  recipientType: 'USER' | 'PATIENT' | 'HOSPITAL',
  options: {
    unreadOnly?: boolean;
    limit?: number;
    skip?: number;
  } = {}
): Promise<INotification[]> {
  try {
    await connectToDatabase();
    
    const query: any = { recipientId, recipientType };
    
    if (options.unreadOnly) {
      query.isRead = false;
    }
    
    return await Notification
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50)
      .skip(options.skip || 0)
      .lean();
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(
  recipientId: mongoose.Types.ObjectId | string,
  recipientType: 'USER' | 'PATIENT' | 'HOSPITAL'
): Promise<number> {
  try {
    await connectToDatabase();
    
    return await Notification.countDocuments({
      recipientId,
      recipientType,
      isRead: false,
    });
  } catch (error) {
    console.error('Failed to get unread notification count:', error);
    return 0;
  }
}

// Notification templates
export const notificationTemplates = {
  [NotificationEvent.REPORT_READY]: {
    title: 'Lab Report Ready',
    message: 'Your lab report is ready for download.',
    email: {
      subject: 'Lab Report Ready - {{patientName}}',
      text: 'Dear {{patientName}}, your lab report for order {{orderId}} is ready for download.',
    },
  },
  [NotificationEvent.CRITICAL_RESULT]: {
    title: 'Critical Result Alert',
    message: 'Critical result detected requiring immediate attention.',
    email: {
      subject: 'URGENT: Critical Lab Result - {{patientName}}',
      text: 'CRITICAL RESULT ALERT: Patient {{patientName}} has a critical result that requires immediate attention.',
    },
  },
  [NotificationEvent.SAMPLE_REJECTION]: {
    title: 'Sample Rejected',
    message: 'Sample rejected - recollection required.',
    email: {
      subject: 'Sample Rejection - {{sampleId}}',
      text: 'Sample {{sampleId}} has been rejected. Reason: {{rejectionReason}}. Please arrange for recollection.',
    },
  },
  // Add more templates as needed
};

// Send templated notification
export async function sendTemplatedNotification(
  event: NotificationEvent,
  type: NotificationType,
  recipientId: mongoose.Types.ObjectId | string,
  recipientType: 'USER' | 'PATIENT' | 'HOSPITAL',
  templateData: Record<string, string>,
  recipientInfo: { email?: string; phone?: string }
): Promise<boolean> {
  const template = notificationTemplates[event];
  if (!template) {
    console.error('No template found for event:', event);
    return false;
  }
  
  // Replace template variables
  const title = replaceTemplateVariables(template.title, templateData);
  const message = replaceTemplateVariables(template.message, templateData);
  
  const notification = await createNotification({
    type,
    event,
    recipientId,
    recipientType,
    title,
    message,
    data: templateData,
  });
  
  return sendNotification(notification, recipientInfo);
}

function replaceTemplateVariables(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

export { Notification };
export default Notification;