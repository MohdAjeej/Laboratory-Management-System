import mongoose from 'mongoose';
import { emailService, stripHtml } from './email';
import { emailTemplates } from './email-templates';
import Notification from '@/models/Notification';

interface NotificationRecipient {
  id: mongoose.Types.ObjectId;
  email?: string;
  phone?: string;
  name?: string;
}

interface SendNotificationParams {
  type: 'REPORT_READY' | 'CRITICAL_RESULT' | 'ORDER_CONFIRMATION' | 'PAYMENT_RECEIPT' | 'SAMPLE_COLLECTION' | 'PASSWORD_RESET' | 'WELCOME' | 'CUSTOM';
  recipient: NotificationRecipient;
  channels: Array<'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP'>;
  data: any;
  relatedEntity?: {
    type: 'ORDER' | 'REPORT' | 'INVOICE' | 'PAYMENT' | 'SAMPLE' | 'TEST_RESULT';
    id: mongoose.Types.ObjectId;
  };
}

class NotificationService {
  /**
   * Send a notification through specified channels
   */
  async sendNotification(params: SendNotificationParams): Promise<{
    success: boolean;
    sent: string[];
    failed: string[];
    notificationIds: string[];
  }> {
    const { type, recipient, channels, data, relatedEntity } = params;

    const sent: string[] = [];
    const failed: string[] = [];
    const notificationIds: string[] = [];

    for (const channel of channels) {
      try {
        let notification: any;

        if (channel === 'EMAIL') {
          notification = await this.sendEmailNotification(type, recipient, data, relatedEntity);
        } else if (channel === 'SMS') {
          notification = await this.sendSMSNotification(type, recipient, data, relatedEntity);
        } else if (channel === 'WHATSAPP') {
          notification = await this.sendWhatsAppNotification(type, recipient, data, relatedEntity);
        } else if (channel === 'IN_APP') {
          notification = await this.sendInAppNotification(type, recipient, data, relatedEntity);
        }

        if (notification) {
          notificationIds.push(notification.notificationId);
          sent.push(channel);
        } else {
          failed.push(channel);
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        failed.push(channel);
      }
    }

    return {
      success: sent.length > 0,
      sent,
      failed,
      notificationIds,
    };
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    type: string,
    recipient: NotificationRecipient,
    data: any,
    relatedEntity?: any
  ) {
    if (!recipient.email) {
      console.warn('No email address provided for notification');
      return null;
    }

    // Generate email content based on type
    const { subject, html } = this.generateEmailContent(type, data);

    // Create notification record
    const notification = new Notification({
      type,
      channel: 'EMAIL',
      recipientId: recipient.id,
      recipientEmail: recipient.email,
      subject,
      content: html,
      status: 'PENDING',
      relatedEntityType: relatedEntity?.type,
      relatedEntityId: relatedEntity?.id,
      metadata: data,
    });

    await notification.save();

    // Send email
    try {
      const emailSent = await emailService.sendEmail({
        to: recipient.email,
        subject,
        html,
        text: stripHtml(html),
      });

      if (emailSent) {
        await notification.markAsSent();
        return notification;
      } else {
        await notification.markAsFailed('Email service unavailable or failed to send');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await notification.markAsFailed(errorMessage);
      return null;
    }
  }

  /**
   * Send SMS notification (placeholder - to be implemented with SMS provider)
   */
  private async sendSMSNotification(
    type: string,
    recipient: NotificationRecipient,
    data: any,
    relatedEntity?: any
  ) {
    if (!recipient.phone) {
      console.warn('No phone number provided for SMS notification');
      return null;
    }

    // Generate SMS content
    const { message } = this.generateSMSContent(type, data);

    // Create notification record
    const notification = new Notification({
      type,
      channel: 'SMS',
      recipientId: recipient.id,
      recipientPhone: recipient.phone,
      subject: `SMS: ${type}`,
      content: message,
      status: 'PENDING',
      relatedEntityType: relatedEntity?.type,
      relatedEntityId: relatedEntity?.id,
      metadata: data,
    });

    await notification.save();

    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    console.log(`SMS notification created but not sent (SMS provider not configured):`, message);
    
    // For now, mark as failed with informative message
    await notification.markAsFailed('SMS provider not configured');
    
    return null;
  }

  /**
   * Send WhatsApp notification (placeholder - to be implemented with WhatsApp provider)
   */
  private async sendWhatsAppNotification(
    type: string,
    recipient: NotificationRecipient,
    data: any,
    relatedEntity?: any
  ) {
    if (!recipient.phone) {
      console.warn('No phone number provided for WhatsApp notification');
      return null;
    }

    // Generate WhatsApp content
    const { message } = this.generateSMSContent(type, data); // Can use same as SMS for now

    // Create notification record
    const notification = new Notification({
      type,
      channel: 'WHATSAPP',
      recipientId: recipient.id,
      recipientPhone: recipient.phone,
      subject: `WhatsApp: ${type}`,
      content: message,
      status: 'PENDING',
      relatedEntityType: relatedEntity?.type,
      relatedEntityId: relatedEntity?.id,
      metadata: data,
    });

    await notification.save();

    // TODO: Integrate with WhatsApp Business API
    console.log(`WhatsApp notification created but not sent (WhatsApp provider not configured):`, message);
    
    // For now, mark as failed with informative message
    await notification.markAsFailed('WhatsApp provider not configured');
    
    return null;
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(
    type: string,
    recipient: NotificationRecipient,
    data: any,
    relatedEntity?: any
  ) {
    // Generate in-app content
    const { subject, message } = this.generateInAppContent(type, data);

    // Create notification record
    const notification = new Notification({
      type,
      channel: 'IN_APP',
      recipientId: recipient.id,
      subject,
      content: message,
      status: 'SENT', // In-app notifications are immediately "sent" when created
      sentAt: new Date(),
      relatedEntityType: relatedEntity?.type,
      relatedEntityId: relatedEntity?.id,
      metadata: data,
    });

    await notification.save();
    return notification;
  }

  /**
   * Generate email content based on notification type
   */
  private generateEmailContent(type: string, data: any): { subject: string; html: string } {
    switch (type) {
      case 'REPORT_READY':
        return {
          subject: 'Your Test Report is Ready',
          html: emailTemplates.reportReady(data),
        };

      case 'CRITICAL_RESULT':
        return {
          subject: '⚠️ Critical Test Result - Immediate Attention Required',
          html: emailTemplates.criticalResult(data),
        };

      case 'ORDER_CONFIRMATION':
        return {
          subject: 'Order Confirmation - LIMS',
          html: emailTemplates.orderConfirmation(data),
        };

      case 'PAYMENT_RECEIPT':
        return {
          subject: 'Payment Receipt - LIMS',
          html: emailTemplates.paymentReceipt(data),
        };

      case 'SAMPLE_COLLECTION':
        return {
          subject: 'Sample Collection Confirmation - LIMS',
          html: emailTemplates.sampleCollection(data),
        };

      case 'PASSWORD_RESET':
        return {
          subject: 'Password Reset Request - LIMS',
          html: emailTemplates.passwordReset(data),
        };

      case 'WELCOME':
        return {
          subject: 'Welcome to LIMS!',
          html: emailTemplates.welcomeEmail(data),
        };

      default:
        return {
          subject: data.subject || 'Notification from LIMS',
          html: data.html || data.message || 'No content provided',
        };
    }
  }

  /**
   * Generate SMS content based on notification type
   */
  private generateSMSContent(type: string, data: any): { message: string } {
    switch (type) {
      case 'REPORT_READY':
        return {
          message: `Your test report ${data.reportId} is ready. Download it from ${data.downloadUrl}`,
        };

      case 'CRITICAL_RESULT':
        return {
          message: `URGENT: Critical result detected in ${data.testName}. Please contact your doctor immediately. Call ${data.contactNumber}`,
        };

      case 'ORDER_CONFIRMATION':
        return {
          message: `Your order ${data.orderId} has been confirmed. Total: ₹${data.totalAmount}. Estimated delivery: ${data.estimatedDelivery}`,
        };

      case 'PAYMENT_RECEIPT':
        return {
          message: `Payment of ₹${data.amount} received for invoice ${data.invoiceId}. Payment ID: ${data.paymentId}`,
        };

      case 'SAMPLE_COLLECTION':
        return {
          message: `Sample ${data.sampleId} collected successfully. Your results will be ready soon.`,
        };

      default:
        return {
          message: data.message || 'Notification from LIMS',
        };
    }
  }

  /**
   * Generate in-app notification content
   */
  private generateInAppContent(type: string, data: any): { subject: string; message: string } {
    switch (type) {
      case 'REPORT_READY':
        return {
          subject: 'Test Report Ready',
          message: `Your test report ${data.reportId} is now available for download.`,
        };

      case 'CRITICAL_RESULT':
        return {
          subject: 'Critical Test Result',
          message: `Critical result detected in ${data.testName}. Please contact your healthcare provider.`,
        };

      case 'ORDER_CONFIRMATION':
        return {
          subject: 'Order Confirmed',
          message: `Your order ${data.orderId} has been confirmed.`,
        };

      case 'PAYMENT_RECEIPT':
        return {
          subject: 'Payment Received',
          message: `Payment of ₹${data.amount} has been received.`,
        };

      case 'SAMPLE_COLLECTION':
        return {
          subject: 'Sample Collected',
          message: `Sample ${data.sampleId} has been collected successfully.`,
        };

      default:
        return {
          subject: data.subject || 'Notification',
          message: data.message || 'You have a new notification',
        };
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<{ retried: number; succeeded: number; failed: number }> {
    const failedNotifications = await Notification.findFailed(true);
    
    let retried = 0;
    let succeeded = 0;
    let failed = 0;

    for (const notification of failedNotifications) {
      retried++;

      try {
        if (notification.channel === 'EMAIL' && notification.recipientEmail) {
          const emailSent = await emailService.sendEmail({
            to: notification.recipientEmail,
            subject: notification.subject,
            html: notification.content,
            text: stripHtml(notification.content),
          });

          if (emailSent) {
            await notification.markAsSent();
            succeeded++;
          } else {
            await notification.markAsFailed('Retry failed');
            failed++;
          }
        }
        // Add retry logic for other channels when implemented
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await notification.markAsFailed(`Retry failed: ${errorMessage}`);
        failed++;
      }
    }

    return { retried, succeeded, failed };
  }

  /**
   * Get notification statistics
   */
  async getStats(startDate?: Date, endDate?: Date) {
    return await Notification.getStats(startDate, endDate);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notification = await Notification.findOne({ notificationId });
      if (notification) {
        await notification.markAsRead();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default notificationService;
