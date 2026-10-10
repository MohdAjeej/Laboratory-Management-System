/**
 * Validation schemas for Master Data Management APIs
 */

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationResult {
  isValid: boolean;
  errors: ValidationError[];

  constructor() {
    this.isValid = true;
    this.errors = [];
  }

  addError(field: string, message: string) {
    this.isValid = false;
    this.errors.push({ field, message });
  }

  hasErrors(): boolean {
    return !this.isValid;
  }
}

// Hospital validation
export function validateHospital(data: any): ValidationResult {
  const result = new ValidationResult();

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    result.addError('name', 'Hospital name must be at least 2 characters');
  }

  if (!data.code || typeof data.code !== 'string' || !/^[A-Z0-9]{2,10}$/.test(data.code.toUpperCase())) {
    result.addError('code', 'Hospital code must be 2-10 uppercase alphanumeric characters');
  }

  if (data.registrationNumber && (typeof data.registrationNumber !== 'string' || data.registrationNumber.trim().length < 3)) {
    result.addError('registrationNumber', 'Registration number must be at least 3 characters');
  }

  if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    result.addError('email', 'Valid email address is required');
  }

  if (!data.phone || typeof data.phone !== 'string' || !/^\d{10,15}$/.test(data.phone)) {
    result.addError('phone', 'Phone number must be 10-15 digits');
  }

  // Address validation
  if (!data.address || typeof data.address !== 'object') {
    result.addError('address', 'Address is required');
  } else {
    if (!data.address.street || typeof data.address.street !== 'string') {
      result.addError('address.street', 'Street address is required');
    }
    if (!data.address.city || typeof data.address.city !== 'string') {
      result.addError('address.city', 'City is required');
    }
    if (!data.address.state || typeof data.address.state !== 'string') {
      result.addError('address.state', 'State is required');
    }
    if (!data.address.zipCode || typeof data.address.zipCode !== 'string') {
      result.addError('address.zipCode', 'Zip code is required');
    }
    if (!data.address.country || typeof data.address.country !== 'string') {
      result.addError('address.country', 'Country is required');
    }
  }

  if (data.creditLimit !== undefined && (typeof data.creditLimit !== 'number' || data.creditLimit < 0)) {
    result.addError('creditLimit', 'Credit limit must be a non-negative number');
  }

  return result;
}

// Doctor validation
export function validateDoctor(data: any): ValidationResult {
  const result = new ValidationResult();

  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length < 2) {
    result.addError('firstName', 'First name must be at least 2 characters');
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length < 2) {
    result.addError('lastName', 'Last name must be at least 2 characters');
  }

  if (!data.registrationNumber || typeof data.registrationNumber !== 'string' || data.registrationNumber.trim().length < 3) {
    result.addError('registrationNumber', 'Registration number must be at least 3 characters');
  }

  if (!data.specialization || typeof data.specialization !== 'string' || data.specialization.trim().length < 2) {
    result.addError('specialization', 'Specialization is required');
  }

  if (data.email && typeof data.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    result.addError('email', 'Valid email address is required');
  }

  if (!data.phone || typeof data.phone !== 'string' || !/^\d{10,15}$/.test(data.phone)) {
    result.addError('phone', 'Phone number must be 10-15 digits');
  }

  // Validate hospitalIds if provided
  if (data.hospitalIds && !Array.isArray(data.hospitalIds)) {
    result.addError('hospitalIds', 'Hospital IDs must be an array');
  } else if (data.hospitalIds && data.hospitalIds.length === 0) {
    result.addError('hospitalIds', 'At least one hospital assignment is required');
  }

  return result;
}

// Test validation
export function validateTest(data: any): ValidationResult {
  const result = new ValidationResult();

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    result.addError('name', 'Test name must be at least 2 characters');
  }

  if (!data.code || typeof data.code !== 'string' || !/^[A-Z0-9]{2,20}$/.test(data.code.toUpperCase())) {
    result.addError('code', 'Test code must be 2-20 uppercase alphanumeric characters');
  }

  if (!data.category || typeof data.category !== 'string' || data.category.trim().length < 2) {
    result.addError('category', 'Category is required');
  }

  if (!data.department || typeof data.department !== 'string' || data.department.trim().length < 2) {
    result.addError('department', 'Department is required');
  }

  if (!data.sampleType || typeof data.sampleType !== 'string' || data.sampleType.trim().length < 2) {
    result.addError('sampleType', 'Sample type is required');
  }

  if (data.price === undefined || typeof data.price !== 'number' || data.price < 0) {
    result.addError('price', 'Price must be a non-negative number');
  }

  if (data.turnaroundTime === undefined || typeof data.turnaroundTime !== 'number' || data.turnaroundTime < 1) {
    result.addError('turnaroundTime', 'Turnaround time must be at least 1 hour');
  }

  // Validate parameters array
  if (!data.parameters || !Array.isArray(data.parameters) || data.parameters.length === 0) {
    result.addError('parameters', 'At least one test parameter is required');
  } else {
    data.parameters.forEach((param: any, index: number) => {
      if (!param.name || typeof param.name !== 'string') {
        result.addError(`parameters[${index}].name`, 'Parameter name is required');
      }
      if (param.unit && typeof param.unit !== 'string') {
        result.addError(`parameters[${index}].unit`, 'Unit must be a string');
      }
      if (param.referenceRange && typeof param.referenceRange !== 'object') {
        result.addError(`parameters[${index}].referenceRange`, 'Reference range must be an object');
      }
    });
  }

  return result;
}

// Test Package validation
export function validateTestPackage(data: any): ValidationResult {
  const result = new ValidationResult();

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    result.addError('name', 'Package name must be at least 2 characters');
  }

  if (!data.code || typeof data.code !== 'string' || !/^[A-Z0-9]{2,20}$/.test(data.code.toUpperCase())) {
    result.addError('code', 'Package code must be 2-20 uppercase alphanumeric characters');
  }

  if (data.price === undefined || typeof data.price !== 'number' || data.price < 0) {
    result.addError('price', 'Price must be a non-negative number');
  }

  // Validate tests array
  if (!data.tests || !Array.isArray(data.tests) || data.tests.length === 0) {
    result.addError('tests', 'At least one test is required in the package');
  } else {
    data.tests.forEach((test: any, index: number) => {
      if (!test.testId) {
        result.addError(`tests[${index}].testId`, 'Test ID is required');
      }
    });
  }

  return result;
}

// Patient validation
export function validatePatient(data: any): ValidationResult {
  const result = new ValidationResult();

  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length < 2) {
    result.addError('firstName', 'First name must be at least 2 characters');
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length < 2) {
    result.addError('lastName', 'Last name must be at least 2 characters');
  }

  if (!data.dateOfBirth || !isValidDate(data.dateOfBirth)) {
    result.addError('dateOfBirth', 'Valid date of birth is required (YYYY-MM-DD)');
  } else {
    const age = calculateAge(new Date(data.dateOfBirth));
    if (age < 0 || age > 150) {
      result.addError('dateOfBirth', 'Date of birth must result in age between 0-150 years');
    }
  }

  if (!data.gender || !['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
    result.addError('gender', 'Gender must be MALE, FEMALE, or OTHER');
  }

  if (!data.phone || typeof data.phone !== 'string' || !/^\d{10,15}$/.test(data.phone)) {
    result.addError('phone', 'Phone number must be 10-15 digits');
  }

  if (data.email && typeof data.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    result.addError('email', 'Valid email address is required');
  }

  // Address validation (required for patients)
  if (!data.address || typeof data.address !== 'object') {
    result.addError('address', 'Address is required');
  } else {
    if (!data.address.street || typeof data.address.street !== 'string') {
      result.addError('address.street', 'Street address is required');
    }
    if (!data.address.city || typeof data.address.city !== 'string') {
      result.addError('address.city', 'City is required');
    }
    if (!data.address.state || typeof data.address.state !== 'string') {
      result.addError('address.state', 'State is required');
    }
    if (!data.address.zipCode || typeof data.address.zipCode !== 'string') {
      result.addError('address.zipCode', 'Zip code is required');
    }
  }

  return result;
}

// Helper functions
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Update validation (allows partial data)
export function validatePartialHospital(data: any): ValidationResult {
  const result = new ValidationResult();
  
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 2)) {
    result.addError('name', 'Hospital name must be at least 2 characters');
  }

  if (data.code !== undefined && (typeof data.code !== 'string' || !/^[A-Z0-9]{2,10}$/.test(data.code.toUpperCase()))) {
    result.addError('code', 'Hospital code must be 2-10 uppercase alphanumeric characters');
  }

  if (data.email !== undefined && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
    result.addError('email', 'Valid email address is required');
  }

  if (data.phone !== undefined && (typeof data.phone !== 'string' || !/^\d{10,15}$/.test(data.phone))) {
    result.addError('phone', 'Phone number must be 10-15 digits');
  }

  return result;
}

export function validatePartialDoctor(data: any): ValidationResult {
  const result = new ValidationResult();

  if (data.firstName !== undefined && (typeof data.firstName !== 'string' || data.firstName.trim().length < 2)) {
    result.addError('firstName', 'First name must be at least 2 characters');
  }

  if (data.lastName !== undefined && (typeof data.lastName !== 'string' || data.lastName.trim().length < 2)) {
    result.addError('lastName', 'Last name must be at least 2 characters');
  }

  if (data.email !== undefined && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
    result.addError('email', 'Valid email address is required');
  }

  if (data.phone !== undefined && (typeof data.phone !== 'string' || !/^\d{10,15}$/.test(data.phone))) {
    result.addError('phone', 'Phone number must be 10-15 digits');
  }

  return result;
}

export function validatePartialTest(data: any): ValidationResult {
  const result = new ValidationResult();

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 2)) {
    result.addError('name', 'Test name must be at least 2 characters');
  }

  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    result.addError('price', 'Price must be a non-negative number');
  }

  if (data.turnaroundTime !== undefined && (typeof data.turnaroundTime !== 'number' || data.turnaroundTime < 1)) {
    result.addError('turnaroundTime', 'Turnaround time must be at least 1 hour');
  }

  return result;
}

export function validatePartialTestPackage(data: any): ValidationResult {
  const result = new ValidationResult();

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 2)) {
    result.addError('name', 'Package name must be at least 2 characters');
  }

  if (data.code !== undefined && (typeof data.code !== 'string' || !/^[A-Z0-9]{2,20}$/.test(data.code.toUpperCase()))) {
    result.addError('code', 'Package code must be 2-20 uppercase alphanumeric characters');
  }

  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    result.addError('price', 'Price must be a non-negative number');
  }

  if (data.tests !== undefined) {
    if (!Array.isArray(data.tests) || data.tests.length === 0) {
      result.addError('tests', 'At least one test is required in the package');
    } else {
      data.tests.forEach((test: any, index: number) => {
        if (!test.testId) {
          result.addError(`tests[${index}].testId`, 'Test ID is required');
        }
      });
    }
  }

  return result;
}

export function validatePartialPatient(data: any): ValidationResult {
  const result = new ValidationResult();

  if (data.firstName !== undefined && (typeof data.firstName !== 'string' || data.firstName.trim().length < 2)) {
    result.addError('firstName', 'First name must be at least 2 characters');
  }

  if (data.lastName !== undefined && (typeof data.lastName !== 'string' || data.lastName.trim().length < 2)) {
    result.addError('lastName', 'Last name must be at least 2 characters');
  }

  if (data.email !== undefined && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) {
    result.addError('email', 'Valid email address is required');
  }

  if (data.phone !== undefined && (typeof data.phone !== 'string' || !/^\d{10,15}$/.test(data.phone))) {
    result.addError('phone', 'Phone number must be 10-15 digits');
  }

  return result;
}
