import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

// Generate QR code as base64 data URL
export async function generateQRCode(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const qrOptions = {
      width: options.width || 200,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const,
    };

    return await QRCode.toDataURL(text, qrOptions);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Generate QR code for report verification
export async function generateReportQRCode(reportId: string, verificationToken?: string): Promise<string> {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const verifyUrl = verificationToken 
    ? `${baseUrl}/verify/${verificationToken}`
    : `${baseUrl}/reports/${reportId}/verify`;
  
  return generateQRCode(verifyUrl, {
    width: 150,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

// Generate QR code for sample tracking
export async function generateSampleQRCode(sampleId: string): Promise<string> {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const trackUrl = `${baseUrl}/samples/${sampleId}/track`;
  
  return generateQRCode(trackUrl, {
    width: 100,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

// Generate QR code for patient profile
export async function generatePatientQRCode(patientId: string): Promise<string> {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const profileUrl = `${baseUrl}/patients/${patientId}`;
  
  return generateQRCode(profileUrl, {
    width: 120,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

// Generate QR code for order tracking
export async function generateOrderQRCode(orderId: string): Promise<string> {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const trackUrl = `${baseUrl}/orders/${orderId}/track`;
  
  return generateQRCode(trackUrl, {
    width: 120,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
}

// Generate QR code as SVG string
export async function generateQRCodeSVG(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const qrOptions = {
      width: options.width || 200,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const,
    };

    return await QRCode.toString(text, { 
      type: 'svg',
      ...qrOptions 
    });
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

// Validate QR code content
export function validateQRCodeContent(text: string): boolean {
  // Basic validation - check if text is not empty and within limits
  if (!text || text.length === 0) {
    return false;
  }
  
  // QR codes can hold up to 4,296 alphanumeric characters
  if (text.length > 4296) {
    return false;
  }
  
  return true;
}

// Generate verification token for QR codes
export function generateVerificationToken(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}