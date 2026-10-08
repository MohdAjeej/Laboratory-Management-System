import { NextRequest, NextResponse } from 'next/server';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission, PermissionCategory } from '@/lib/permissions';

// GET /api/permissions - Get all permissions organized by category
export const GET = withPermissionAuth(
  [Permission.MANAGE_ROLES, Permission.READ_USER],
  false,
  async (request: NextRequest, user: any) => {
    try {
      // Organize permissions by category
      const permissionsByCategory: Record<string, any[]> = {};

      Object.values(Permission).forEach(permission => {
        // Derive category from permission name
        const category = getPermissionCategory(permission);
        
        if (!permissionsByCategory[category]) {
          permissionsByCategory[category] = [];
        }

        permissionsByCategory[category].push({
          id: permission,
          name: permission,
          displayName: permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          description: getPermissionDescription(permission),
        });
      });

      return NextResponse.json({
        success: true,
        data: permissionsByCategory,
      });
    } catch (error) {
      console.error('Get permissions error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      );
    }
  }
);

function getPermissionCategory(permission: Permission): string {
  if (permission.includes('PATIENT')) return PermissionCategory.PATIENTS;
  if (permission.includes('HOSPITAL')) return PermissionCategory.HOSPITALS;
  if (permission.includes('DOCTOR')) return PermissionCategory.DOCTORS;
  if (permission.includes('TEST')) return PermissionCategory.TESTS;
  if (permission.includes('ORDER')) return PermissionCategory.ORDERS;
  if (permission.includes('SAMPLE')) return PermissionCategory.SAMPLES;
  if (permission.includes('RESULT')) return PermissionCategory.RESULTS;
  if (permission.includes('REPORT')) return PermissionCategory.REPORTS;
  if (permission.includes('INVOICE') || permission.includes('PAYMENT') || permission.includes('REFUND')) return PermissionCategory.BILLING;
  if (permission.includes('INVENTORY')) return PermissionCategory.INVENTORY;
  if (permission.includes('EQUIPMENT')) return PermissionCategory.EQUIPMENT;
  if (permission.includes('QC')) return PermissionCategory.QC;
  if (permission.includes('ANALYTICS')) return PermissionCategory.ANALYTICS;
  if (permission.includes('USER') || permission.includes('ROLE')) return PermissionCategory.USERS;
  if (permission.includes('SETTINGS')) return PermissionCategory.SETTINGS;
  if (permission.includes('AUDIT')) return PermissionCategory.AUDIT;
  
  return 'GENERAL';
}

function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<string, string> = {
    // Patients
    CREATE_PATIENT: 'Create new patient records',
    READ_PATIENT: 'View patient information',
    UPDATE_PATIENT: 'Edit patient details',
    DELETE_PATIENT: 'Delete patient records',
    READ_ALL_PATIENTS: 'Access all patient records across hospitals',

    // Hospitals
    CREATE_HOSPITAL: 'Add new hospitals to the system',
    READ_HOSPITAL: 'View hospital information',
    UPDATE_HOSPITAL: 'Edit hospital details',
    DELETE_HOSPITAL: 'Remove hospitals from system',
    READ_ALL_HOSPITALS: 'Access all hospital records',

    // Doctors
    CREATE_DOCTOR: 'Add new doctors to the system',
    READ_DOCTOR: 'View doctor information',
    UPDATE_DOCTOR: 'Edit doctor details',
    DELETE_DOCTOR: 'Remove doctors from system',

    // Tests
    CREATE_TEST: 'Create new test definitions',
    READ_TEST: 'View test information',
    UPDATE_TEST: 'Modify test parameters',
    DELETE_TEST: 'Remove test definitions',
    CREATE_TEST_PACKAGE: 'Create test packages',

    // Orders
    CREATE_ORDER: 'Create new test orders',
    READ_ORDER: 'View order information',
    UPDATE_ORDER: 'Modify order details',
    CANCEL_ORDER: 'Cancel pending orders',
    READ_ALL_ORDERS: 'Access all orders across system',

    // Samples
    COLLECT_SAMPLE: 'Mark samples as collected',
    RECEIVE_SAMPLE: 'Receive samples in laboratory',
    REJECT_SAMPLE: 'Reject samples with reasons',
    READ_SAMPLE: 'View sample information',
    UPDATE_SAMPLE: 'Modify sample details',

    // Results
    ENTER_RESULT: 'Enter test results',
    READ_RESULT: 'View test results',
    UPDATE_RESULT: 'Modify test results',
    VERIFY_RESULT: 'Verify result accuracy',
    APPROVE_RESULT: 'Approve results for reporting',

    // Reports
    GENERATE_REPORT: 'Generate PDF reports',
    READ_REPORT: 'View generated reports',
    PUBLISH_REPORT: 'Publish reports to patients',
    DOWNLOAD_REPORT: 'Download report files',
    VERIFY_REPORT: 'Verify report authenticity',

    // Billing
    CREATE_INVOICE: 'Create invoices for orders',
    READ_INVOICE: 'View invoice information',
    UPDATE_INVOICE: 'Modify invoice details',
    PROCESS_PAYMENT: 'Process payments',
    PROCESS_REFUND: 'Process refunds',
    READ_FINANCIAL_REPORTS: 'View financial reports',

    // Inventory
    CREATE_INVENTORY_ITEM: 'Add new inventory items',
    READ_INVENTORY: 'View inventory information',
    UPDATE_INVENTORY: 'Modify inventory records',
    DELETE_INVENTORY_ITEM: 'Remove inventory items',
    ADJUST_STOCK: 'Adjust stock levels',

    // Equipment
    CREATE_EQUIPMENT: 'Add new equipment records',
    READ_EQUIPMENT: 'View equipment information',
    UPDATE_EQUIPMENT: 'Modify equipment details',
    SCHEDULE_MAINTENANCE: 'Schedule equipment maintenance',

    // Quality Control
    CREATE_QC_LOT: 'Create quality control lots',
    RUN_QC: 'Execute QC procedures',
    READ_QC: 'View QC information',
    APPROVE_QC: 'Approve QC results',

    // Analytics
    READ_ANALYTICS: 'View system analytics',
    EXPORT_DATA: 'Export system data',

    // Users & Administration
    CREATE_USER: 'Create new user accounts',
    READ_USER: 'View user information',
    UPDATE_USER: 'Modify user details',
    DELETE_USER: 'Remove user accounts',
    MANAGE_ROLES: 'Manage user roles and permissions',

    // Settings
    READ_SETTINGS: 'View system settings',
    UPDATE_SETTINGS: 'Modify system configuration',
    MANAGE_SYSTEM_CONFIG: 'Advanced system configuration',

    // Audit
    READ_AUDIT_LOGS: 'View audit logs',
    EXPORT_AUDIT_LOGS: 'Export audit data',
  };

  return descriptions[permission] || `Permission: ${permission}`;
}