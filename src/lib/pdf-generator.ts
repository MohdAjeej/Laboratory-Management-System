import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Readable } from 'stream';

interface ReportData {
  reportId: string;
  orderId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  hospitalName?: string;
  doctorName?: string;
  collectionDate: Date;
  reportDate: Date;
  tests: Array<{
    testName: string;
    testCode: string;
    category: string;
    parameters: Array<{
      name: string;
      value: string | number;
      unit?: string;
      referenceRange?: string;
      flag?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
    }>;
    comments?: string;
  }>;
  verifiedBy?: string;
  verifiedDate?: Date;
  technicalComments?: string;
  clinicalSignificance?: string;
}

interface LabInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
}

export class PDFReportGenerator {
  private doc: PDFKit.PDFDocument;
  private yPosition: number = 0;
  private pageHeight: number = 792; // Letter size
  private pageWidth: number = 612;
  private margin: number = 50;
  private contentWidth: number;

  constructor() {
    this.doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: this.margin,
        bottom: this.margin,
        left: this.margin,
        right: this.margin,
      },
    });
    this.contentWidth = this.pageWidth - 2 * this.margin;
    this.yPosition = this.margin;
  }

  async generateReport(reportData: ReportData, labInfo: LabInfo): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const chunks: Buffer[] = [];

        this.doc.on('data', (chunk) => chunks.push(chunk));
        this.doc.on('end', () => resolve(Buffer.concat(chunks)));
        this.doc.on('error', reject);

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(
          `${process.env.APP_URL || 'http://localhost:3000'}/verify-report/${reportData.reportId}`,
          { width: 120, margin: 1 }
        );

        // Header
        await this.addHeader(labInfo, qrCodeDataUrl);

        // Patient Information
        this.addPatientInfo(reportData);

        // Test Results
        this.addTestResults(reportData);

        // Comments and Signatures
        this.addCommentsAndSignatures(reportData);

        // Footer
        this.addFooter(reportData);

        // Finalize PDF
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async addHeader(labInfo: LabInfo, qrCodeDataUrl: string) {
    // Lab Name
    this.doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(labInfo.name, this.margin, this.yPosition, {
        width: this.contentWidth - 130,
        align: 'left',
      });

    // QR Code (top right)
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    this.doc.image(qrBuffer, this.pageWidth - this.margin - 100, this.margin, {
      width: 100,
      height: 100,
    });

    this.yPosition += 25;

    // Lab Details
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#4b5563')
      .text(labInfo.address, this.margin, this.yPosition, {
        width: this.contentWidth - 130,
      });

    this.yPosition += 12;
    this.doc.text(`Phone: ${labInfo.phone} | Email: ${labInfo.email}`, {
      width: this.contentWidth - 130,
    });

    if (labInfo.website) {
      this.yPosition += 12;
      this.doc.text(`Website: ${labInfo.website}`, {
        width: this.contentWidth - 130,
      });
    }

    this.yPosition = Math.max(this.yPosition + 20, 160);

    // Title
    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text('LABORATORY REPORT', this.margin, this.yPosition, {
        width: this.contentWidth,
        align: 'center',
      });

    this.yPosition += 30;
    this.addHorizontalLine();
    this.yPosition += 15;
  }

  private addPatientInfo(reportData: ReportData) {
    const startY = this.yPosition;
    const colWidth = this.contentWidth / 2;

    // Left Column
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');

    this.doc.text('Patient Name:', this.margin, this.yPosition);
    this.yPosition += 12;
    this.doc.text('Patient ID:', this.margin, this.yPosition);
    this.yPosition += 12;
    this.doc.text('Age/Gender:', this.margin, this.yPosition);
    this.yPosition += 12;
    this.doc.text('Phone:', this.margin, this.yPosition);

    if (reportData.hospitalName) {
      this.yPosition += 12;
      this.doc.text('Hospital:', this.margin, this.yPosition);
    }

    if (reportData.doctorName) {
      this.yPosition += 12;
      this.doc.text('Referring Doctor:', this.margin, this.yPosition);
    }

    // Reset for values
    this.yPosition = startY;
    this.doc.font('Helvetica').fillColor('#1f2937');

    this.doc.text(reportData.patientName, this.margin + 100, this.yPosition, {
      width: colWidth - 110,
    });
    this.yPosition += 12;
    this.doc.text(reportData.patientId, this.margin + 100, this.yPosition);
    this.yPosition += 12;
    this.doc.text(
      `${reportData.patientAge} Years / ${reportData.patientGender}`,
      this.margin + 100,
      this.yPosition
    );
    this.yPosition += 12;
    this.doc.text(reportData.patientPhone, this.margin + 100, this.yPosition);

    if (reportData.hospitalName) {
      this.yPosition += 12;
      this.doc.text(reportData.hospitalName, this.margin + 100, this.yPosition);
    }

    if (reportData.doctorName) {
      this.yPosition += 12;
      this.doc.text(reportData.doctorName, this.margin + 100, this.yPosition);
    }

    // Right Column
    const rightColX = this.margin + colWidth + 20;
    this.yPosition = startY;

    this.doc.font('Helvetica-Bold').fillColor('#374151');

    this.doc.text('Report ID:', rightColX, this.yPosition);
    this.yPosition += 12;
    this.doc.text('Order ID:', rightColX, this.yPosition);
    this.yPosition += 12;
    this.doc.text('Collection Date:', rightColX, this.yPosition);
    this.yPosition += 12;
    this.doc.text('Report Date:', rightColX, this.yPosition);

    // Reset for values
    this.yPosition = startY;
    this.doc.font('Helvetica').fillColor('#1f2937');

    this.doc.text(reportData.reportId, rightColX + 100, this.yPosition);
    this.yPosition += 12;
    this.doc.text(reportData.orderId, rightColX + 100, this.yPosition);
    this.yPosition += 12;
    this.doc.text(
      new Date(reportData.collectionDate).toLocaleDateString('en-IN'),
      rightColX + 100,
      this.yPosition
    );
    this.yPosition += 12;
    this.doc.text(
      new Date(reportData.reportDate).toLocaleDateString('en-IN'),
      rightColX + 100,
      this.yPosition
    );

    this.yPosition += 25;
    this.addHorizontalLine();
    this.yPosition += 15;
  }

  private addTestResults(reportData: ReportData) {
    reportData.tests.forEach((test, testIndex) => {
      // Check if we need a new page
      if (this.yPosition > this.pageHeight - 150) {
        this.doc.addPage();
        this.yPosition = this.margin;
      }

      // Test Header
      this.doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1f2937')
        .text(test.testName, this.margin, this.yPosition);

      this.yPosition += 15;

      this.doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`Test Code: ${test.testCode} | Category: ${test.category}`, this.margin, this.yPosition);

      this.yPosition += 20;

      // Table Header
      this.doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');

      const col1X = this.margin;
      const col2X = this.margin + 180;
      const col3X = this.margin + 280;
      const col4X = this.margin + 380;

      this.doc.text('Parameter', col1X, this.yPosition);
      this.doc.text('Result', col2X, this.yPosition);
      this.doc.text('Reference Range', col3X, this.yPosition);
      this.doc.text('Flag', col4X, this.yPosition);

      this.yPosition += 15;
      this.addHorizontalLine();
      this.yPosition += 10;

      // Parameters
      test.parameters.forEach((param) => {
        if (this.yPosition > this.pageHeight - 100) {
          this.doc.addPage();
          this.yPosition = this.margin;
        }

        const paramStartY = this.yPosition;

        // Parameter name
        this.doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#1f2937')
          .text(param.name, col1X, this.yPosition, {
            width: 170,
            lineBreak: false,
          });

        // Result value
        const resultText = `${param.value}${param.unit ? ' ' + param.unit : ''}`;
        this.doc.text(resultText, col2X, this.yPosition);

        // Reference range
        if (param.referenceRange) {
          this.doc
            .fontSize(8)
            .fillColor('#6b7280')
            .text(param.referenceRange, col3X, this.yPosition, {
              width: 95,
            });
        }

        // Flag
        if (param.flag && param.flag !== 'NORMAL') {
          let flagColor = '#6b7280';
          if (param.flag === 'CRITICAL') flagColor = '#dc2626';
          else if (param.flag === 'HIGH' || param.flag === 'ABNORMAL') flagColor = '#ea580c';
          else if (param.flag === 'LOW') flagColor = '#2563eb';

          this.doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor(flagColor)
            .text(param.flag, col4X, this.yPosition);
        }

        this.yPosition += 18;
      });

      // Test Comments
      if (test.comments) {
        this.yPosition += 5;
        this.doc
          .fontSize(8)
          .font('Helvetica-Oblique')
          .fillColor('#4b5563')
          .text(`Comments: ${test.comments}`, this.margin, this.yPosition, {
            width: this.contentWidth,
          });
        this.yPosition += 15;
      }

      // Add spacing between tests
      if (testIndex < reportData.tests.length - 1) {
        this.yPosition += 10;
        this.addHorizontalLine();
        this.yPosition += 15;
      }
    });

    this.yPosition += 10;
  }

  private addCommentsAndSignatures(reportData: ReportData) {
    if (this.yPosition > this.pageHeight - 200) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }

    this.addHorizontalLine();
    this.yPosition += 15;

    // Technical Comments
    if (reportData.technicalComments) {
      this.doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Technical Comments:', this.margin, this.yPosition);

      this.yPosition += 12;

      this.doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#1f2937')
        .text(reportData.technicalComments, this.margin, this.yPosition, {
          width: this.contentWidth,
        });

      this.yPosition += 20;
    }

    // Clinical Significance
    if (reportData.clinicalSignificance) {
      this.doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('Clinical Significance:', this.margin, this.yPosition);

      this.yPosition += 12;

      this.doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#1f2937')
        .text(reportData.clinicalSignificance, this.margin, this.yPosition, {
          width: this.contentWidth,
        });

      this.yPosition += 20;
    }

    // Verification Info
    if (reportData.verifiedBy && reportData.verifiedDate) {
      this.yPosition += 30;

      this.doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#1f2937')
        .text('Verified By:', this.margin, this.yPosition);

      this.yPosition += 15;

      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(reportData.verifiedBy, this.margin, this.yPosition);

      this.yPosition += 12;

      this.doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(
          `Date: ${new Date(reportData.verifiedDate).toLocaleString('en-IN')}`,
          this.margin,
          this.yPosition
        );
    }
  }

  private addFooter(reportData: ReportData) {
    const footerY = this.pageHeight - this.margin - 60;

    this.doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(
        '*** End of Report ***',
        this.margin,
        footerY,
        {
          width: this.contentWidth,
          align: 'center',
        }
      );

    this.doc.text(
      'This is a digitally generated report. Verify authenticity by scanning the QR code.',
      this.margin,
      footerY + 12,
      {
        width: this.contentWidth,
        align: 'center',
      }
    );

    this.doc.text(
      `Report ID: ${reportData.reportId} | Generated: ${new Date().toLocaleString('en-IN')}`,
      this.margin,
      footerY + 24,
      {
        width: this.contentWidth,
        align: 'center',
      }
    );
  }

  private addHorizontalLine() {
    this.doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(this.margin, this.yPosition)
      .lineTo(this.pageWidth - this.margin, this.yPosition)
      .stroke();
  }
}

export async function generateLabReport(reportData: ReportData): Promise<Buffer> {
  const labInfo: LabInfo = {
    name: process.env.LAB_NAME || 'Modern Diagnostic Laboratory',
    address: process.env.LAB_ADDRESS || '123 Healthcare Street, Medical District, City - 400001',
    phone: process.env.LAB_PHONE || '+91 22 1234 5678',
    email: process.env.LAB_EMAIL || 'reports@modernlab.com',
    website: process.env.LAB_WEBSITE || 'www.modernlab.com',
  };

  const generator = new PDFReportGenerator();
  return await generator.generateReport(reportData, labInfo);
}
