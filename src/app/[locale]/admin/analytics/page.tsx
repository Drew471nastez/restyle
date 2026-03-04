import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';

export default async function AdminAnalyticsPage() {
  // Gather platform-wide analytics
  const [
    { count: totalUsers },
    { count: totalListings },
    { count: activeListings },
    { data: allOrders },
    { count: totalDisputes },
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabaseAdmin
      .from('orders')
      .select('total_amount, platform_fee, status, created_at'),
    supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disputed'),
  ]);

  const completedOrders =
    allOrders?.filter(
      (o) => o.status === 'completed' || o.status === 'delivered'
    ) || [];
  const totalGMV = completedOrders.reduce((s, o) => s + o.total_amount, 0);
  const totalPlatformRevenue = completedOrders.reduce(
    (s, o) => s + o.platform_fee,
    0
  );

  // Calculate monthly data for the chart placeholder
  const now = new Date();
  const monthlyData: Array<{ month: string; orders: number; revenue: number }> =
    [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleString('default', {
      month: 'short',
      year: 'numeric',
    });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const monthOrders =
      allOrders?.filter((o) => {
        const created = new Date(o.created_at);
        return created >= monthStart && created < monthEnd;
      }) || [];

    monthlyData.push({
      month: monthStr,
      orders: monthOrders.length,
      revenue: monthOrders.reduce((s, o) => s + o.platform_fee, 0),
    });
  }

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Platform Analytics
      </h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Total GMV</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(totalGMV / 100).toFixed(2)} EUR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Platform Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(totalPlatformRevenue / 100).toFixed(2)} EUR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalUsers || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Active Listings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {activeListings || 0} / {totalListings || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-sm">
                Chart coming soon (recharts)
              </p>
            </div>
            {/* Monthly data summary as fallback */}
            <div className="mt-4 space-y-2">
              {monthlyData.map((m) => (
                <div key={m.month} className="flex justify-between text-sm">
                  <span className="text-gray-500">{m.month}</span>
                  <span className="font-medium text-gray-900">
                    {(m.revenue / 100).toFixed(2)} EUR ({m.orders} orders)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-sm">
                Chart coming soon (recharts)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listing Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listing Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Listings</p>
              <p className="text-xl font-bold text-gray-900">
                {totalListings || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Active</p>
              <p className="text-xl font-bold text-green-600">
                {activeListings || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">
                {allOrders?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Open Disputes</p>
              <p className="text-xl font-bold text-red-600">
                {totalDisputes || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
