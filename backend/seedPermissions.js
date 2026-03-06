const { RolePermission } = require('./models');

const permissions = [
  // Customer Permissions
  'customers:view', 'customers:create', 'customers:edit', 'customers:delete', 'customers:bulk_import',
  // Package Permissions
  'packages:view', 'packages:create', 'packages:edit', 'packages:delete',
  // Area Permissions
  'areas:view', 'areas:create', 'areas:delete',
  // Payment Permissions
  'payments:view', 'payments:create',
  // Renewal Permissions
  'renewals:view', 'renewals:create',
  // Report Permissions
  'reports:view',
  // User Permissions
  'users:manage'
];

const roles = ['Admin', 'Technician', 'Area Manager'];

const seedPermissions = async () => {
  try {
    for (const role of roles) {
      for (const permission of permissions) {
        // Default: Admin has most permissions, others have limited
        let enabled = false;
        
        if (role === 'Admin') {
          enabled = true; // Admin gets almost everything by default
        } else if (role === 'Area Manager') {
          if (permission.startsWith('customers') || permission.startsWith('packages') || permission.startsWith('areas') || permission.startsWith('payments') || permission.startsWith('renewals')) {
             if (!permission.endsWith('delete')) enabled = true;
          }
        } else if (role === 'Technician') {
          if (permission === 'customers:view' || permission === 'payments:create' || permission === 'renewals:create' || permission === 'packages:view') {
            enabled = true;
          }
        }

        await RolePermission.findOrCreate({
          where: { role, permission },
          defaults: { enabled }
        });
      }
    }
    console.log('Permissions seeded successfully');
  } catch (error) {
    console.error('Error seeding permissions:', error);
  }
};

module.exports = seedPermissions;
