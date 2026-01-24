import { NextRequest, NextResponse } from 'next/server';
import mysqlConnection from '@/lib/mysql-connection';

export async function GET() {
  try {
    const rows = await mysqlConnection.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    
    return NextResponse.json({
      success: true,
      notifications: rows
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notifications'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type, priority, targetUsers } = body;
    
    if (!title || !message || !type) {
      return NextResponse.json({
        success: false,
        error: 'Title, message, and type are required'
      }, { status: 400 });
    }

    const result = await mysqlConnection.execute(
      'INSERT INTO notifications (title, message, type, priority, target_users) VALUES (?, ?, ?, ?, ?)',
      [title, message, type, priority || 'medium', targetUsers || 'all']
    );
    
    return NextResponse.json({
      success: true,
      notification: {
        id: result.insertId,
        title,
        message,
        type,
        priority: priority || 'medium',
        targetUsers: targetUsers || 'all',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create notification'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Notification ID is required'
      }, { status: 400 });
    }

    const result = await mysqlConnection.execute(
      'DELETE FROM notifications WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'Notification not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete notification'
    }, { status: 500 });
  }
}