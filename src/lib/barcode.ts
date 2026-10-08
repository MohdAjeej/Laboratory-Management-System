import JsBarcode from 'jsbarcode';

export interface BarcodeOptions {
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  textMargin?: number;
  background?: string;
  lineColor?: string;
}

// Generate barcode as base64 data URL (browser environment)
export function generateBarcode(
  text: string, 
  options: BarcodeOptions = {}
): string {
  try {
    // Create a canvas element for browser environment
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    
    JsBarcode(canvas, text, {
      format: options.format || 'CODE128',
      width: options.width || 2,
      height: options.height || 50,
      displayValue: options.displayValue !== false,
      fontSize: options.fontSize || 12,
      textMargin: options.textMargin || 2,
      background: options.background || '#ffffff',
      lineColor: options.lineColor || '#000000',
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw new Error('Failed to generate barcode');
  }
}

// Generate barcode as SVG string (works in both environments)
export function generateBarcodeSVG(
  text: string, 
  options: BarcodeOptions = {}
): string {
  try {
    let svgString = '';
    
    JsBarcode(svgString, text, {
      format: options.format || 'CODE128',
      width: options.width || 2,
      height: options.height || 50,
      displayValue: options.displayValue !== false,
      fontSize: options.fontSize || 12,
      textMargin: options.textMargin || 2,
      background: options.background || '#ffffff',
      lineColor: options.lineColor || '#000000',
      xmlDocument: true, // Generate SVG
    });

    return svgString;
  } catch (error) {
    console.error('Error generating barcode SVG:', error);
    throw new Error('Failed to generate barcode SVG');
  }
}

// Generate barcode for sample labels
export function generateSampleBarcode(sampleId: string): string {
  return generateBarcode(sampleId, {
    format: 'CODE128',
    width: 2,
    height: 40,
    displayValue: true,
    fontSize: 10,
    textMargin: 2,
  });
}

// Generate barcode for patient labels
export function generatePatientBarcode(patientId: string): string {
  return generateBarcode(patientId, {
    format: 'CODE128',
    width: 2,
    height: 30,
    displayValue: true,
    fontSize: 8,
    textMargin: 2,
  });
}

// Validate barcode format
export function validateBarcodeFormat(text: string, format: string = 'CODE128'): boolean {
  try {
    const canvas = createCanvas(100, 50);
    JsBarcode(canvas, text, { format: format as any });
    return true;
  } catch (error) {
    return false;
  }
}

// Get supported barcode formats
export function getSupportedFormats(): string[] {
  return ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC'];
}