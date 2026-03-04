import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { DollarSign, Package, Eye, TrendingUp } from 'lucide-react';

export default async function SellerAnalyticsPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
    return null;
  }

  // Fetch seller stats
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, item_price, platform_fee, status, created_at')
    .eq('seller_id', user.id);

  const { data: listings } = await supabase
    .from('listings')
    .select('id, views_count, status')
    .eq('seller_id', user.id);

  const completedOrders = orders?.filter(
    (o) => o.status === 'completed' || o.status === 'delivered'
  ) || [];

  const totalSales = completedOrders.length;
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + o.item_price - o.platform_fee,
    0
  );
  const totalViews = listings?.reduce((sum, l) => sum + l.views_count, 0) || 0;
  const activeListings = listings?.filter((l) => l.status === 'active').length || 0;
  const conversionRate =
    totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Seller Analytics
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Total Sales</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(totalRevenue / 100).toFixed(2)} EUR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Conversion</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {conversionRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 text-sm">
                Chart coming soon (recharts)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
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

      {/* Listing Performance */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Listing Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 space-y-2">
            <div className="flex justify-between">
              <span>Active Listings</span>
              <span className="font-medium text-gray-900">
                {activeListings}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Listings</span>
              <span className="font-medium text-gray-900">
                {listings?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg. Views per Listing</span>
              <span className="font-medium text-gray-900">
                {listings && listings.length > 0
                  ? Math.round(totalViews / listings.length)
                  : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
