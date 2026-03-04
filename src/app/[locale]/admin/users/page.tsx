import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminUserActions } from './AdminUserActions';

export default async function AdminUsersPage() {
  const { data: users } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        User Management
      </h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-4 font-medium text-gray-500">User</th>
                <th className="p-4 font-medium text-gray-500">Username</th>
                <th className="p-4 font-medium text-gray-500">Status</th>
                <th className="p-4 font-medium text-gray-500">Joined</th>
                <th className="p-4 font-medium text-gray-500">Rating</th>
                <th className="p-4 font-medium text-gray-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                            {(
                              user.display_name?.[0] ||
                              user.username[0]
                            ).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {user.display_name || user.username}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">@{user.username}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {user.is_verified && (
                        <Badge variant="default">Verified</Badge>
                      )}
                      {user.is_admin && (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                      {user.is_pro && (
                        <Badge variant="secondary">Pro</Badge>
                      )}
                      {!user.is_verified && !user.is_admin && (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-600">
                    {user.rating_avg > 0
                      ? `${user.rating_avg.toFixed(1)} (${user.rating_count})`
                      : '-'}
                  </td>
                  <td className="p-4 text-right">
                    <AdminUserActions
                      userId={user.id}
                      isVerified={user.is_verified}
                    />
                  </td>
                </tr>
              ))}

              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
