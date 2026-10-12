// User roles
export enum UserRole {
  ADMIN = 'ADMIN',
  LAB_ADMIN = 'LAB_ADMIN',
  RECEPTIONIST = 'RECEPTIONIST',
  TECHNICIAN = 'TECHNICIAN',
  PATHOLOGIST = 'PATHOLOGIST',
  ACCOUNTANT = 'ACCOUNTANT',
  HOSPITAL_STAFF = 'HOSPITAL_STAFF',
  PATIENT = 'PATIENT',
}

// Permission categories
export enum PermissionCategory {
  PATIENTS = 'PATIENTS',
  HOSPITALS = 'HOSPITALS',
  DOCTORS = 'DOCTORS',
  TESTS = 'TESTS',
  ORDERS = 'ORDERS',
  SAMPLES = 'SAMPLES',
  RESULTS = 'RESULTS',
  REPORTS = 'REPORTS',
  BILLING = 'BILLING',
  INVENTORY = 'INVENTORY',
  EQUIPMENT = 'EQUIPMENT',
  QC = 'QC',
  ANALYTICS = 'ANALYTICS',
  USERS = 'USERS',
  SETTINGS = 'SETTINGS',
  AUDIT = 'AUDIT',
}

// Specific permissions
export enum Permission {
  // Patients
  CREATE_PATIENT = 'CREATE_PATIENT',
  READ_PATIENT = 'READ_PATIENT',
  UPDATE_PATIENT = 'UPDATE_PATIENT',
  DELETE_PATIENT = 'DELETE_PATIENT',
  READ_ALL_PATIENTS = 'READ_ALL_PATIENTS',

  // Hospitals
  CREATE_HOSPITAL = 'CREATE_HOSPITAL',
  READ_HOSPITAL = 'READ_HOSPITAL',
  UPDATE_HOSPITAL = 'UPDATE_HOSPITAL',
  DELETE_HOSPITAL = 'DELETE_HOSPITAL',
  READ_ALL_HOSPITALS = 'READ_ALL_HOSPITALS',

  // Doctors
  CREATE_DOCTOR = 'CREATE_DOCTOR',
  READ_DOCTOR = 'READ_DOCTOR',
  UPDATE_DOCTOR = 'UPDATE_DOCTOR',
  DELETE_DOCTOR = 'DELETE_DOCTOR',

  // Tests
  CREATE_TEST = 'CREATE_TEST',
  READ_TEST = 'READ_TEST',
  UPDATE_TEST = 'UPDATE_TEST',
  DELETE_TEST = 'DELETE_TEST',

  // Orders
  CREATE_ORDER = 'CREATE_ORDER',
  READ_ORDER = 'READ_ORDER',
  UPDATE_ORDER = 'UPDATE_ORDER',
  CANCEL_ORDER = 'CANCEL_ORDER',
  READ_ALL_ORDERS = 'READ_ALL_ORDERS',

  // Samples
  COLLECT_SAMPLE = 'COLLECT_SAMPLE',
  RECEIVE_SAMPLE = 'RECEIVE_SAMPLE',
  REJECT_SAMPLE = 'REJECT_SAMPLE',
  READ_SAMPLE = 'READ_SAMPLE',
  UPDATE_SAMPLE = 'UPDATE_SAMPLE',

  // Results
  ENTER_RESULT = 'ENTER_RESULT',
  READ_RESULT = 'READ_RESULT',
  UPDATE_RESULT = 'UPDATE_RESULT',
  VERIFY_RESULT = 'VERIFY_RESULT',
  APPROVE_RESULT = 'APPROVE_RESULT',

  // Reports
  GENERATE_REPORT = 'GENERATE_REPORT',
  READ_REPORT = 'READ_REPORT',
  PUBLISH_REPORT = 'PUBLISH_REPORT',
  DOWNLOAD_REPORT = 'DOWNLOAD_REPORT',
  VERIFY_REPORT = 'VERIFY_REPORT',

  // Billing
  CREATE_INVOICE = 'CREATE_INVOICE',
  READ_INVOICE = 'READ_INVOICE',
  UPDATE_INVOICE = 'UPDATE_INVOICE',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  PROCESS_REFUND = 'PROCESS_REFUND',
  READ_FINANCIAL_REPORTS = 'READ_FINANCIAL_REPORTS',

  // Inventory
  CREATE_INVENTORY_ITEM = 'CREATE_INVENTORY_ITEM',
  READ_INVENTORY = 'READ_INVENTORY',
  UPDATE_INVENTORY = 'UPDATE_INVENTORY',
  DELETE_INVENTORY_ITEM = 'DELETE_INVENTORY_ITEM',
  ADJUST_STOCK = 'ADJUST_STOCK',

  // Equipment
  CREATE_EQUIPMENT = 'CREATE_EQUIPMENT',
  READ_EQUIPMENT = 'READ_EQUIPMENT',
  UPDATE_EQUIPMENT = 'UPDATE_EQUIPMENT',
  SCHEDULE_MAINTENANCE = 'SCHEDULE_MAINTENANCE',

  // Quality Control
  CREATE_QC_LOT = 'CREATE_QC_LOT',
  RUN_QC = 'RUN_QC',
  READ_QC = 'READ_QC',
  APPROVE_QC = 'APPROVE_QC',

  // Analytics
  READ_ANALYTICS = 'READ_ANALYTICS',
  EXPORT_DATA = 'EXPORT_DATA',

  // Users & Administration
  CREATE_USER = 'CREATE_USER',
  READ_USER = 'READ_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  MANAGE_ROLES = 'MANAGE_ROLES',

  // Settings
  READ_SETTINGS = 'READ_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  MANAGE_SYSTEM_CONFIG = 'MANAGE_SYSTEM_CONFIG',

  // Audit
  READ_AUDIT_LOGS = 'READ_AUDIT_LOGS',
  EXPORT_AUDIT_LOGS = 'EXPORT_AUDIT_LOGS',
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission), // Full access

  [UserRole.LAB_ADMIN]: [
    // Patients
    Permission.CREATE_PATIENT,
    Permission.READ_PATIENT,
    Permission.UPDATE_PATIENT,
    Permission.READ_ALL_PATIENTS,
    
    // Hospitals & Doctors
    Permission.CREATE_HOSPITAL,
    Permission.READ_HOSPITAL,
    Permission.UPDATE_HOSPITAL,
    Permission.READ_ALL_HOSPITALS,
    Permission.CREATE_DOCTOR,
    Permission.READ_DOCTOR,
    Permission.UPDATE_DOCTOR,
    
    // Tests
    Permission.CREATE_TEST,
    Permission.READ_TEST,
    Permission.UPDATE_TEST,
    
    // Orders & Samples
    Permission.CREATE_ORDER,
    Permission.READ_ORDER,
    Permission.UPDATE_ORDER,
    Permission.READ_ALL_ORDERS,
    Permission.COLLECT_SAMPLE,
    Permission.RECEIVE_SAMPLE,
    Permission.READ_SAMPLE,
    
    // Results & Reports
    Permission.READ_RESULT,
    Permission.GENERATE_REPORT,
    Permission.READ_REPORT,
    Permission.DOWNLOAD_REPORT,
    
    // Billing
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.READ_FINANCIAL_REPORTS,
    
    // Inventory & Equipment
    Permission.CREATE_INVENTORY_ITEM,
    Permission.READ_INVENTORY,
    Permission.UPDATE_INVENTORY,
    Permission.ADJUST_STOCK,
    Permission.CREATE_EQUIPMENT,
    Permission.READ_EQUIPMENT,
    Permission.UPDATE_EQUIPMENT,
    
    // QC & Analytics
    Permission.CREATE_QC_LOT,
    Permission.READ_QC,
    Permission.READ_ANALYTICS,
    
    // Settings & Audit
    Permission.READ_SETTINGS,
    Permission.UPDATE_SETTINGS,
    Permission.READ_AUDIT_LOGS,
  ],

  [UserRole.RECEPTIONIST]: [
    // Patients
    Permission.CREATE_PATIENT,
    Permission.READ_PATIENT,
    Permission.UPDATE_PATIENT,
    
    // Orders & Billing
    Permission.CREATE_ORDER,
    Permission.READ_ORDER,
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.PROCESS_PAYMENT,
    
    // Samples
    Permission.COLLECT_SAMPLE,
    Permission.READ_SAMPLE,
    
    // Basic reads
    Permission.READ_HOSPITAL,
    Permission.READ_DOCTOR,
    Permission.READ_TEST,
    Permission.READ_REPORT,
    Permission.DOWNLOAD_REPORT,
  ],

  [UserRole.TECHNICIAN]: [
    // Samples
    Permission.RECEIVE_SAMPLE,
    Permission.REJECT_SAMPLE,
    Permission.READ_SAMPLE,
    Permission.UPDATE_SAMPLE,
    
    // Results
    Permission.ENTER_RESULT,
    Permission.READ_RESULT,
    Permission.UPDATE_RESULT,
    
    // QC
    Permission.RUN_QC,
    Permission.READ_QC,
    
    // Basic reads
    Permission.READ_PATIENT,
    Permission.READ_ORDER,
    Permission.READ_TEST,
    Permission.READ_INVENTORY,
    Permission.READ_EQUIPMENT,
  ],

  [UserRole.PATHOLOGIST]: [
    // Results & Reports
    Permission.READ_RESULT,
    Permission.VERIFY_RESULT,
    Permission.APPROVE_RESULT,
    Permission.GENERATE_REPORT,
    Permission.READ_REPORT,
    Permission.PUBLISH_REPORT,
    Permission.VERIFY_REPORT,
    
    // QC
    Permission.APPROVE_QC,
    Permission.READ_QC,
    
    // Basic reads
    Permission.READ_PATIENT,
    Permission.READ_ORDER,
    Permission.READ_SAMPLE,
    Permission.READ_TEST,
  ],

  [UserRole.ACCOUNTANT]: [
    // Billing
    Permission.CREATE_INVOICE,
    Permission.READ_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.PROCESS_PAYMENT,
    Permission.PROCESS_REFUND,
    Permission.READ_FINANCIAL_REPORTS,
    
    // Basic reads
    Permission.READ_PATIENT,
    Permission.READ_HOSPITAL,
    Permission.READ_ORDER,
    Permission.READ_REPORT,
  ],

  [UserRole.HOSPITAL_STAFF]: [
    // Limited to own hospital data
    Permission.READ_PATIENT,
    Permission.READ_ORDER,
    Permission.READ_SAMPLE,
    Permission.READ_RESULT,
    Permission.READ_REPORT,
    Permission.DOWNLOAD_REPORT,
    Permission.READ_INVOICE,
  ],

  [UserRole.PATIENT]: [
    // Own data only
    Permission.READ_ORDER,
    Permission.READ_REPORT,
    Permission.DOWNLOAD_REPORT,
    Permission.VERIFY_REPORT,
  ],
};

// Check if user has specific permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
}

// Check multiple permissions (user must have ALL)
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Check multiple permissions (user must have at least ONE)
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if role can access specific hospital data
export function canAccessHospitalData(userRole: UserRole, userHospitalId?: string, targetHospitalId?: string): boolean {
  // Admin and lab admin can access all hospital data
  if (userRole === UserRole.ADMIN || userRole === UserRole.LAB_ADMIN) {
    return true;
  }

  // Hospital staff can only access their own hospital data
  if (userRole === UserRole.HOSPITAL_STAFF) {
    return userHospitalId === targetHospitalId;
  }

  // Other roles have general access rules
  return true;
}

// Check if role can access patient data
export function canAccessPatientData(userRole: UserRole, userId: string, patientId: string): boolean {
  // Patients can only access their own data
  if (userRole === UserRole.PATIENT) {
    return userId === patientId;
  }

  // Other roles follow general permission rules
  return hasPermission(userRole, Permission.READ_PATIENT);
}