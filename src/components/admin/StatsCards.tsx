import { Card, CardContent } from '@/components/ui/card';
import { Users, ShoppingBag, Package, DollarSign } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface StatsCardsProps {
  totalUsers: number;
  totalListings: number;
  totalOrders: number;
  revenue: number;
}

const icons = {
  users: Users,
  listings: ShoppingBag,
  orders: Package,
  revenue: DollarSign,
};

export function StatsCards({ totalUsers, totalListings, totalOrders, revenue }: StatsCardsProps) {
  const stats = [
    { key: 'users' as const, label: 'Total Users', value: totalUsers.toLocaleString(), icon: 'users' as const },
    { key: 'listings' as const, label: 'Active Listings', value: totalListings.toLocaleString(), icon: 'listings' as const },
    { key: 'orders' as const, label: 'Total Orders', value: totalOrders.toLocaleString(), icon: 'orders' as const },
    { key: 'revenue' as const, label: 'Revenue', value: formatPrice(revenue, 'RON'), icon: 'revenue' as const },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = icons[stat.icon];
        return (
          <Card key={stat.key}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
