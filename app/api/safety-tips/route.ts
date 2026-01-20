import { NextRequest, NextResponse } from 'next/server';
import type { SafetyTip, EmergencyKitItem } from '@/types';

console.log('🚀 Safety Tips API route loaded');

// GET /api/safety-tips - Get all safety tips
export async function GET() {
  console.log('📡 GET /api/safety-tips called');

  try {
    // Try to load from database, fallback to mock data if database fails
    const mysqlConnection = await import('@/lib/mysql-connection').then(mod => mod.mysqlConnection);

    try {
      // Get safety tips
      const tipRows = await mysqlConnection.query(
        'SELECT id, icon, title, items, category, `order`, created_by, updated_at FROM safety_tips ORDER BY `order` ASC'
      );

      const tips: SafetyTip[] = tipRows.map(row => ({
        id: row.id,
        icon: row.icon,
        title: row.title,
        items: JSON.parse(row.items || '[]'),
        category: row.category,
        order: row.order,
        created_by: row.created_by,
        updated_at: row.updated_at
      }));

      // Get emergency kit items
      const kitRows = await mysqlConnection.query(
        'SELECT id, title, items, `order`, created_by, updated_at FROM emergency_kit_items ORDER BY `order` ASC'
      );

      const emergencyKit: EmergencyKitItem[] = kitRows.map(row => ({
        id: row.id,
        title: row.title,
        items: JSON.parse(row.items || '[]'),
        order: row.order,
        created_by: row.created_by,
        updated_at: row.updated_at
      }));

      console.log('✅ Returning database safety tips:', tips.length, 'tips and', emergencyKit.length, 'kit items');
      return NextResponse.json({ success: true, tips, emergencyKit });
    } catch (dbError) {
      console.warn('⚠️ Database not available, using mock data:', dbError);
    }
  } catch (importError) {
    console.warn('⚠️ Cannot import database connection, using mock data:', importError);
  }

  // Fallback to mock data (same as current hardcoded data)
  const mockTips: SafetyTip[] = [
    {
      id: 'tip_1',
      icon: '🌊',
      title: 'Flood Safety',
      items: [
        'Move to higher ground immediately when flooding occurs',
        'Keep emergency supplies ready',
        'Avoid walking or driving through floodwaters',
        'Disconnect electrical appliances',
      ],
      category: 'disaster',
      order: 1,
      updated_at: new Date().toISOString()
    },
    {
      id: 'tip_2',
      icon: '🔥',
      title: 'Fire Safety',
      items: [
        'Install smoke alarms and check regularly',
        'Keep fire extinguishers accessible',
        'Never leave cooking unattended',
        'Know your escape routes',
      ],
      category: 'disaster',
      order: 2,
      updated_at: new Date().toISOString()
    },
    {
      id: 'tip_3',
      icon: '🌋',
      title: 'Earthquake Safety',
      items: [
        'Drop, cover, and hold on during shaking',
        'Stay away from windows and heavy objects',
        'Prepare a family emergency plan',
        'Evacuate if building is unsafe',
      ],
      category: 'disaster',
      order: 3,
      updated_at: new Date().toISOString()
    },
    {
      id: 'tip_4',
      icon: '🌀',
      title: 'Typhoon Safety',
      items: [
        'Secure your home and outdoor items',
        'Monitor weather updates',
        'Evacuate early if advised',
        'Keep emergency contacts handy',
      ],
      category: 'disaster',
      order: 4,
      updated_at: new Date().toISOString()
    },
    {
      id: 'tip_5',
      icon: '🚨',
      title: 'General Preparedness',
      items: [
        'Know evacuation routes and centers',
        'Keep important documents waterproof',
        'Help neighbors, especially elderly',
        'Report hazards immediately',
      ],
      category: 'disaster',
      order: 5,
      updated_at: new Date().toISOString()
    },
    {
      id: 'tip_6',
      icon: '📱',
      title: 'Digital Safety',
      items: [
        'Keep phone charged during emergencies',
        'Save emergency numbers',
        'Use B-READY for quick reporting',
        'Share location with trusted contacts',
      ],
      category: 'disaster',
      order: 6,
      updated_at: new Date().toISOString()
    },
  ];

  const mockEmergencyKit: EmergencyKitItem[] = [
    {
      id: 'kit_1',
      title: 'Essential Items',
      items: [
        'Water (1 gallon per person per day)',
        'Non-perishable food',
        'First aid kit',
        'Flashlight with batteries',
      ],
      order: 1,
      updated_at: new Date().toISOString()
    },
    {
      id: 'kit_2',
      title: 'Important Documents',
      items: [
        'Identification cards',
        'Medical records',
        'Emergency contacts',
        'Insurance policies',
      ],
      order: 2,
      updated_at: new Date().toISOString()
    },
    {
      id: 'kit_3',
      title: 'Additional Supplies',
      items: [
        'Prescription medications',
        'Personal hygiene items',
        'Multi-tool or knife',
        'Portable phone charger',
      ],
      order: 3,
      updated_at: new Date().toISOString()
    },
  ];

  console.log('✅ Returning mock safety tips');
  return NextResponse.json({ success: true, tips: mockTips, emergencyKit: mockEmergencyKit });
}

// POST /api/safety-tips - Add a new safety tip (admin only)
export async function POST(request: NextRequest) {
  console.log('📡 POST /api/safety-tips called');

  try {
    const mysqlConnection = await import('@/lib/mysql-connection').then(mod => mod.mysqlConnection);

    const { icon, title, items, category, created_by } = await request.json();

    if (!title || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Title and items array are required' },
        { status: 400 }
      );
    }

    // Generate a unique ID
    const tipId = `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get the next order number
    const orderResult = await mysqlConnection.query(
      'SELECT MAX(`order`) as maxOrder FROM safety_tips WHERE category = ?',
      [category || 'disaster']
    );
    const nextOrder = (orderResult[0]?.maxOrder || 0) + 1;

    // Ensure database tables are created
    await mysqlConnection.createTables();

    await mysqlConnection.query(
      'INSERT INTO safety_tips (id, icon, title, items, category, `order`, created_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [tipId, icon || '📋', title, JSON.stringify(items), category || 'disaster', nextOrder, created_by || null]
    );

    const newTip: SafetyTip = {
      id: tipId,
      icon: icon || '📋',
      title,
      items,
      category: category || 'disaster',
      order: nextOrder,
      created_by,
      updated_at: new Date().toISOString()
    };

    console.log('✅ Safety tip added to database:', tipId);
    return NextResponse.json({ success: true, tip: newTip });
  } catch (error) {
    console.error('❌ Error adding safety tip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add safety tip - database may not be running' },
      { status: 500 }
    );
  }
}

// PUT /api/safety-tips - Update a safety tip (admin only)
export async function PUT(request: NextRequest) {
  console.log('📡 PUT /api/safety-tips called');

  try {
    const mysqlConnection = await import('@/lib/mysql-connection').then(mod => mod.mysqlConnection);

    const { id, icon, title, items, category, order, updated_by } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Safety tip ID is required' },
        { status: 400 }
      );
    }

    if (!title || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Title and items array are required' },
        { status: 400 }
      );
    }

    await mysqlConnection.query(
      'UPDATE safety_tips SET icon = ?, title = ?, items = ?, category = ?, `order` = ?, updated_at = NOW() WHERE id = ?',
      [icon || '📋', title, JSON.stringify(items), category || 'disaster', order || 1, id]
    );

    const updatedTip: SafetyTip = {
      id,
      icon: icon || '📋',
      title,
      items,
      category: category || 'disaster',
      order: order || 1,
      updated_at: new Date().toISOString()
    };

    console.log('✅ Safety tip updated in database:', id);
    return NextResponse.json({ success: true, tip: updatedTip });
  } catch (error) {
    console.error('❌ Error updating safety tip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update safety tip - database may not be running' },
      { status: 500 }
    );
  }
}

// DELETE /api/safety-tips?id=tip_id - Delete a safety tip (admin only)
export async function DELETE(request: NextRequest) {
  console.log('📡 DELETE /api/safety-tips called');

  try {
    const mysqlConnection = await import('@/lib/mysql-connection').then(mod => mod.mysqlConnection);

    const { searchParams } = new URL(request.url);
    const tipId = searchParams.get('id');

    if (!tipId) {
      return NextResponse.json(
        { success: false, error: 'Safety tip ID is required' },
        { status: 400 }
      );
    }

    const result = await mysqlConnection.execute(
      'DELETE FROM safety_tips WHERE id = ?',
      [tipId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Safety tip not found' },
        { status: 404 }
      );
    }

    console.log('✅ Safety tip deleted from database:', tipId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting safety tip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete safety tip - database may not be running' },
      { status: 500 }
    );
  }
}
