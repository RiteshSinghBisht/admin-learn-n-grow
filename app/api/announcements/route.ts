import { NextRequest, NextResponse } from 'next/server';
import { firestore, initializeApp, getApps } from 'firebase-admin';

// Initialize Firebase Admin (only once) - works on Vercel with FIREBASE_CONFIG
if (!getApps().length) {
  initializeApp();
}

const db = firestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, date } = body;

    // Validate required fields
    if (!title || !message || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, date' },
        { status: 400 }
      );
    }

    // Create announcement document
    const docRef = db.collection('announcements').doc();

    await docRef.set({
      title: String(title).trim(),
      message: String(message).trim(),
      date: date,
      createdAt: firestore.FieldValue.serverTimestamp(),
      id: docRef.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      id: docRef.id,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection('announcements')
      .orderBy('date', 'desc')
      .get();

    const announcements = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}
