import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';
import { withPermissionAuth } from '@/lib/middleware';
import { Permission } from '@/lib/permissions';
import { auditUserAction, AuditAction } from '@/lib/audit';

// GET /api/settings — Get all or by category
export const GET = withPermissionAuth(
  [Permission.MANAGE_SETTINGS],
  true,
  async (request: NextRequest) => {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(request.url);
      const category = searchParams.get('category') || '';

      let settings;
      if (category) {
        settings = await SystemSettings.getByCategory(category);
      } else {
        settings = await SystemSettings.getAllSettings();
      }

      return NextResponse.json({ success: true, data: { settings } });
    } catch (error) {
      console.error('Get settings error:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
  }
);

// PUT /api/settings — Update a setting
export const PUT = withPermissionAuth(
  [Permission.MANAGE_SETTINGS],
  true,
  async (request: NextRequest, user: any) => {
    try {
      await connectToDatabase();
      const body = await request.json();

      const { key, value, category, description } = body;

      if (!key || !value || !category) {
        return NextResponse.json({ error: 'key, value, and category are required' }, { status: 400 });
      }

      const setting = await SystemSettings.setSetting(key, value, category, user.id, description);

      await auditUserAction(
        user.id, user.role, AuditAction.UPDATE, 'SystemSettings',
        key,
        `Updated system setting: ${key}`
      );

      return NextResponse.json({ success: true, data: setting });
    } catch (error) {
      console.error('Update setting error:', error);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
  }
);
