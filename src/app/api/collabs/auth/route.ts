import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const correctPin = process.env.COLLAB_SECRET_PIN || '123321';

    if (pin && typeof pin === 'string' && pin.trim() === correctPin.trim()) {
      return NextResponse.json({ success: true, authorized: true });
    }

    return NextResponse.json(
      { success: false, authorized: false, error: 'Incorrect secret PIN.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, authorized: false, error: 'Failed to verify PIN.' },
      { status: 500 }
    );
  }
}
