import { emailWrapper } from './email';

interface ReportReadyParams {
  patientName: string;
  reportId: string;
  orderId: string;
  reportDate: string;
  downloadUrl: string;
  verifyUrl: string;
  testCount: number;
}

export function reportReadyTemplate(params: ReportReadyParams): string {
  const content = `
    <h2>Your Test Report is Ready</h2>
    <p>Dear ${params.patientName},</p>
    <p>We are pleased to inform you that your laboratory test report is now ready and available for download.</p>
    
    <div class="info-box">
      <table>
        <tr>
          <th>Report ID:</th>
          <td>${params.reportId}</td>
        </tr>
        <tr>
          <th>Order ID:</th>
          <td>${params.orderId}</td>
        </tr>
        <tr>
          <th>Report Date:</th>
          <td>${params.reportDate}</td>
        </tr>
        <tr>
          <th>Number of Tests:</th>
          <td>${params.testCount}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center;">
      <a href="${params.downloadUrl}" class="button">Download Report</a>
    </p>

    <p class="text-muted">
      You can also verify the authenticity of your report by scanning the QR code on the report or visiting:<br>
      <a href="${params.verifyUrl}">${params.verifyUrl}</a>
    </p>

    <p class="text-muted">
      <strong>Note:</strong> Please consult with your healthcare provider to discuss your test results.
    </p>
  `;

  return emailWrapper(content, 'Your Test Report is Ready');
}

interface CriticalResultParams {
  patientName: string;
  testName: string;
  parameterName: string;
  value: string;
  referenceRange: string;
  orderId: string;
  reportDate: string;
  contactNumber: string;
}

export function criticalResultTemplate(params: CriticalResultParams): string {
  const content = `
    <h2>⚠️ Critical Test Result - Immediate Attention Required</h2>
    <p>Dear ${params.patientName},</p>
    
    <div class="critical-box">
      <p><strong>URGENT:</strong> A critical abnormality has been detected in your laboratory test results. Please contact your healthcare provider immediately.</p>
    </div>

    <div class="warning-box">
      <table>
        <tr>
          <th>Test Name:</th>
          <td>${params.testName}</td>
        </tr>
        <tr>
          <th>Parameter:</th>
          <td>${params.parameterName}</td>
        </tr>
        <tr>
          <th>Your Value:</th>
          <td><strong style="color: #dc2626;">${params.value}</strong></td>
        </tr>
        <tr>
          <th>Reference Range:</th>
          <td>${params.referenceRange}</td>
        </tr>
        <tr>
          <th>Order ID:</th>
          <td>${params.orderId}</td>
        </tr>
        <tr>
          <th>Report Date:</th>
          <td>${params.reportDate}</td>
        </tr>
      </table>
    </div>

    <p class="text-bold" style="color: #dc2626;">
      Please contact your doctor or our laboratory immediately at ${params.contactNumber}
    </p>

    <p class="text-muted">
      <strong>Important:</strong> This is an automated notification sent because your test result requires urgent medical attention. Do not delay in seeking medical advice.
    </p>
  `;

  return emailWrapper(content, 'Critical Test Result - Immediate Attention Required');
}

interface OrderConfirmationParams {
  patientName: string;
  orderId: string;
  orderDate: string;
  tests: Array<{ name: string; price: number }>;
  totalAmount: number;
  paymentStatus: string;
  estimatedDelivery: string;
}

export function orderConfirmationTemplate(params: OrderConfirmationParams): string {
  const testRows = params.tests
    .map(
      (test) => `
    <tr>
      <td>${test.name}</td>
      <td style="text-align: right;">₹${test.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const content = `
    <h2>Order Confirmation</h2>
    <p>Dear ${params.patientName},</p>
    <p>Thank you for choosing our laboratory services. Your order has been confirmed.</p>
    
    <div class="success-box">
      <table>
        <tr>
          <th>Order ID:</th>
          <td>${params.orderId}</td>
        </tr>
        <tr>
          <th>Order Date:</th>
          <td>${params.orderDate}</td>
        </tr>
        <tr>
          <th>Payment Status:</th>
          <td>${params.paymentStatus}</td>
        </tr>
        <tr>
          <th>Estimated Delivery:</th>
          <td>${params.estimatedDelivery}</td>
        </tr>
      </table>
    </div>

    <h3>Tests Ordered:</h3>
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${testRows}
        <tr style="font-weight: 600; border-top: 2px solid #2563eb;">
          <td>Total Amount</td>
          <td style="text-align: right;">₹${params.totalAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <p class="text-muted">
      <strong>Next Steps:</strong><br>
      1. Sample collection will be scheduled shortly<br>
      2. You will receive updates via SMS and email<br>
      3. Report will be available once testing is complete
    </p>
  `;

  return emailWrapper(content, 'Order Confirmation');
}

interface PaymentReceiptParams {
  patientName: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  method: string;
  transactionDate: string;
  transactionId?: string;
  remainingDue: number;
}

export function paymentReceiptTemplate(params: PaymentReceiptParams): string {
  const content = `
    <h2>Payment Receipt</h2>
    <p>Dear ${params.patientName},</p>
    <p>We have received your payment. Thank you!</p>
    
    <div class="success-box">
      <h3 style="margin-top: 0;">Payment Details</h3>
      <table>
        <tr>
          <th>Payment ID:</th>
          <td>${params.paymentId}</td>
        </tr>
        <tr>
          <th>Invoice ID:</th>
          <td>${params.invoiceId}</td>
        </tr>
        <tr>
          <th>Amount Paid:</th>
          <td><strong>₹${params.amount.toFixed(2)}</strong></td>
        </tr>
        <tr>
          <th>Payment Method:</th>
          <td>${params.method}</td>
        </tr>
        ${params.transactionId ? `
        <tr>
          <th>Transaction ID:</th>
          <td>${params.transactionId}</td>
        </tr>
        ` : ''}
        <tr>
          <th>Date & Time:</th>
          <td>${params.transactionDate}</td>
        </tr>
      </table>
    </div>

    ${params.remainingDue > 0 ? `
    <div class="warning-box">
      <p><strong>Outstanding Balance:</strong> ₹${params.remainingDue.toFixed(2)}</p>
      <p class="text-muted">Please settle the remaining amount at your earliest convenience.</p>
    </div>
    ` : `
    <div class="success-box">
      <p><strong>✓ Payment Complete</strong> - Your invoice has been fully paid. Thank you!</p>
    </div>
    `}

    <p class="text-muted">
      Please keep this receipt for your records. For any queries regarding this payment, please contact our billing department with the Payment ID mentioned above.
    </p>
  `;

  return emailWrapper(content, 'Payment Receipt');
}

interface SampleCollectionParams {
  patientName: string;
  orderId: string;
  sampleId: string;
  collectionDate: string;
  tests: string[];
  instructions?: string;
}

export function sampleCollectionTemplate(params: SampleCollectionParams): string {
  const testsList = params.tests.map((test) => `<li>${test}</li>`).join('');

  const content = `
    <h2>Sample Collection Confirmation</h2>
    <p>Dear ${params.patientName},</p>
    <p>Your sample has been collected successfully and is being processed.</p>
    
    <div class="info-box">
      <table>
        <tr>
          <th>Order ID:</th>
          <td>${params.orderId}</td>
        </tr>
        <tr>
          <th>Sample ID:</th>
          <td>${params.sampleId}</td>
        </tr>
        <tr>
          <th>Collection Date:</th>
          <td>${params.collectionDate}</td>
        </tr>
      </table>
    </div>

    <h3>Tests Being Processed:</h3>
    <ul>
      ${testsList}
    </ul>

    ${params.instructions ? `
    <div class="warning-box">
      <h4 style="margin-top: 0;">Important Instructions:</h4>
      <p>${params.instructions}</p>
    </div>
    ` : ''}

    <p>You will receive a notification once your test results are ready. This typically takes 24-48 hours depending on the tests ordered.</p>

    <p class="text-muted">
      Track your order status by logging into your account on our website.
    </p>
  `;

  return emailWrapper(content, 'Sample Collection Confirmation');
}

interface PasswordResetParams {
  name: string;
  resetUrl: string;
  expiryTime: string;
}

export function passwordResetTemplate(params: PasswordResetParams): string {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Dear ${params.name},</p>
    <p>We received a request to reset your password for your LIMS account.</p>
    
    <p style="text-align: center;">
      <a href="${params.resetUrl}" class="button">Reset Password</a>
    </p>

    <div class="warning-box">
      <p><strong>Security Notice:</strong></p>
      <ul>
        <li>This link will expire in ${params.expiryTime}</li>
        <li>If you didn't request this, please ignore this email</li>
        <li>Your password will remain unchanged</li>
      </ul>
    </div>

    <p class="text-muted">
      For security reasons, never share your password or this reset link with anyone.
    </p>
  `;

  return emailWrapper(content, 'Password Reset Request');
}

interface WelcomeEmailParams {
  name: string;
  email: string;
  role: string;
  loginUrl: string;
}

export function welcomeEmailTemplate(params: WelcomeEmailParams): string {
  const content = `
    <h2>Welcome to LIMS!</h2>
    <p>Dear ${params.name},</p>
    <p>Welcome to LIMS - Laboratory Information Management System. Your account has been created successfully.</p>
    
    <div class="success-box">
      <h3 style="margin-top: 0;">Account Details</h3>
      <table>
        <tr>
          <th>Email:</th>
          <td>${params.email}</td>
        </tr>
        <tr>
          <th>Role:</th>
          <td>${params.role}</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center;">
      <a href="${params.loginUrl}" class="button">Login to Your Account</a>
    </p>

    <h3>Getting Started:</h3>
    <ul>
      <li>Complete your profile information</li>
      <li>Explore the dashboard and features</li>
      <li>Contact support if you need any assistance</li>
    </ul>

    <p class="text-muted">
      If you have any questions or need help getting started, please don't hesitate to reach out to our support team.
    </p>
  `;

  return emailWrapper(content, 'Welcome to LIMS');
}

// Export all templates
export const emailTemplates = {
  reportReady: reportReadyTemplate,
  criticalResult: criticalResultTemplate,
  orderConfirmation: orderConfirmationTemplate,
  paymentReceipt: paymentReceiptTemplate,
  sampleCollection: sampleCollectionTemplate,
  passwordReset: passwordResetTemplate,
  welcomeEmail: welcomeEmailTemplate,
};
