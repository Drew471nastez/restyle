import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Users, ShoppingBag, Package, DollarSign } from 'lucide-react';

export default async function AdminDashboardPage() {
  // Fetch aggregate stats using admin client
  const [
    { count: totalUsers },
    { count: activeListings },
    { count: totalOrders },
    { data: revenueData },
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('orders')
      .select('platform_fee')
      .in('status', ['completed', 'delivered']),
  ]);

  const totalRevenue =
    revenueData?.reduce((sum, o) => sum + o.platform_fee, 0) || 0;

  // Recent orders
  const { data: recentOrders } = await supabaseAdmin
    .from('orders')
    .select(
      '*, listing:listings(title), buyer:profiles!buyer_id(username)'
    )
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Admin Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
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
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Active Listings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {activeListings || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Total Orders</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalOrders || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Platform Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(totalRevenue / 100).toFixed(2)} EUR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Orders
          </h2>
          {!recentOrders || recentOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">Order</th>
                    <th className="pb-3 font-medium text-gray-500">Item</th>
                    <th className="pb-3 font-medium text-gray-500">Buyer</th>
                    <th className="pb-3 font-medium text-gray-500">Status</th>
                    <th className="pb-3 font-medium text-gray-500 text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((order) => {
                    const typedOrder = order as typeof order & {
                      listing: { title: string };
                      buyer: { username: string };
                    };
                    return (
                    <tr key={order.id}>
                      <td className="py-3 font-mono text-xs text-gray-600">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 text-gray-900">
                        {typedOrder.listing?.title || 'Unknown'}
                      </td>
                      <td className="py-3 text-gray-600">
                        @{typedOrder.buyer?.username || 'unknown'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'disputed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {(order.total_amount / 100).toFixed(2)}{' '}
                        {order.currency}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
