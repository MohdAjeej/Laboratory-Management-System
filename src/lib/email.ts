import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: {
        name: process.env.EMAIL_FROM_NAME || 'LIMS - Laboratory Management System',
        email: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'noreply@lims.com',
      },
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      if (!this.config.auth.user || !this.config.auth.pass) {
        console.warn('Email service not configured: Missing SMTP credentials');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
      });

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          console.error('Email service initialization failed:', error);
          this.transporter = null;
        } else {
          console.log('Email service ready');
        }
      });
    } catch (error) {
      console.error('Failed to create email transporter:', error);
      this.transporter = null;
    }
  }

  async sendEmail(params: SendEmailParams): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not available');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.config.from.name}" <${this.config.from.email}>`,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: params.attachments,
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendBulkEmails(emails: SendEmailParams[]): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      emails.map((email) => this.sendEmail(email))
    );

    const success = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
    const failed = results.length - success;

    return { success, failed };
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  getConfig() {
    return {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      from: this.config.from,
      isConfigured: this.isConfigured(),
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Helper function to generate email HTML wrapper
export function emailWrapper(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'LIMS Notification'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .email-body {
      padding: 30px 20px;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 15px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .critical-box {
      background-color: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    table th,
    table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    table th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    .text-muted {
      color: #6b7280;
      font-size: 14px;
    }
    .text-bold {
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>LIMS - Laboratory Management System</h1>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <p>
        This is an automated notification from LIMS.<br>
        Please do not reply to this email.<br>
        <br>
        &copy; ${new Date().getFullYear()} LIMS. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Plain text version generator (for email clients that don't support HTML)
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s\s+/g, ' ')
    .trim();
}

export default emailService;
