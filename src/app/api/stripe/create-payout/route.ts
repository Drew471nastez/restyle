import { NextRequest, NextResponse } from 'next/server';
import { requestPayout } from '@/actions/wallet';

export async function POST(request: NextRequest) {
  const { amount } = await request.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const result = await requestPayout(amount);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
