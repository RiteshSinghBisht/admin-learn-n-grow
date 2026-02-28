import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with credentials from env vars
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (process.env.FIREBASE_PROJECT_ID && privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } else {
    // Fallback - try default credentials
    initializeApp();
  }
}

const db = getFirestore();

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
      createdAt: FieldValue.serverTimestamp(),
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

    const announcements = snapshot.docs.map((doc) => ({
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
      { error: 'Failed to fetch announcements', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
