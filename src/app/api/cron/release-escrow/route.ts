import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { releaseEscrow } from '@/lib/stripe/escrow';
import { ESCROW_AUTO_RELEASE_HOURS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - ESCROW_AUTO_RELEASE_HOURS);

  // Find orders delivered more than 48h ago that haven't been completed
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('status', 'delivered')
    .lt('delivered_at', cutoff.toISOString());

  if (!orders?.length) {
    return NextResponse.json({ released: 0 });
  }

  let released = 0;
  for (const order of orders) {
    try {
      await releaseEscrow(order.id);
      released++;
    } catch (err) {
      console.error(`Failed to release escrow for order ${order.id}:`, err);
    }
  }

  return NextResponse.json({ released, total: orders.length });
}
