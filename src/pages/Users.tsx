// Last updated: 20th January 2025
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Users as UsersIcon, Search, Edit, Lock, Unlock, Shield } from 'lucide-react';

interface UserRecord {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role_id: number;
  is_active: boolean;
  is_locked: boolean;
  locked_until: string | null;
  created_at: string;
}

const roleNames: Record<number, string> = {
  1: 'Admin',
  2: 'Investigator',
  3: 'Auditor',
  4: 'Customer',
};

const roleColors: Record<number, string> = {
  1: 'bg-purple-100 text-purple-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-teal-100 text-teal-700',
  4: 'bg-gray-100 text-gray-700',
};

export default function Users() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    setLoadingData(true);
    // SECURITY: Use users_safe view to exclude password_hash column
    const { data, error } = await supabase
      .from('users_safe')
      .select('user_id, full_name, email, phone, role_id, is_active, is_locked, locked_until, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as UserRecord[]);
    }
    setLoadingData(false);
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setSaving(true);

    const { error } = await supabase
      .from('users')
      .update({
        full_name: editUser.full_name,
        role_id: editUser.role_id,
        is_active: editUser.is_active,
        is_locked: editUser.is_locked,
        locked_until: editUser.is_locked ? null : editUser.locked_until,
      })
      .eq('user_id', editUser.user_id);

    if (error) {
      toast.error(`Failed to update user: ${error.message}`);
    } else {
      toast.success('User updated successfully');
      setEditUser(null);
      fetchUsers();
    }
    setSaving(false);
  };

  const toggleLock = async (userRecord: UserRecord) => {
    const { error } = await supabase
      .from('users')
      .update({
        is_locked: !userRecord.is_locked,
        locked_until: userRecord.is_locked ? null : new Date(Date.now() + 3600000).toISOString(),
      })
      .eq('user_id', userRecord.user_id);

    if (error) {
      toast.error(`Failed to toggle lock: ${error.message}`);
    } else {
      toast.success(userRecord.is_locked ? 'User unlocked' : 'User locked');
      fetchUsers();
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role_id === parseInt(roleFilter);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((roleId) => (
            <Card key={roleId} className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {roleNames[roleId]}s
                </CardTitle>
                <Shield className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.role_id === roleId).length}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="1">Admin</SelectItem>
                  <SelectItem value="2">Investigator</SelectItem>
                  <SelectItem value="3">Auditor</SelectItem>
                  <SelectItem value="4">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.user_id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{u.full_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-4">
                          <Badge className={roleColors[u.role_id]}>{roleNames[u.role_id]}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {!u.is_active && (
                              <Badge variant="outline" className="bg-gray-100">
                                Inactive
                              </Badge>
                            )}
                            {u.is_locked && (
                              <Badge variant="outline" className="bg-red-100 text-red-700">
                                Locked
                              </Badge>
                            )}
                            {u.is_active && !u.is_locked && (
                              <Badge className="bg-green-100 text-green-700">Active</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditUser(u)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleLock(u)}
                            >
                              {u.is_locked ? (
                                <Unlock className="h-4 w-4 text-green-600" />
                              ) : (
                                <Lock className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {editUser && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={editUser.full_name}
                    onChange={(e) =>
                      setEditUser({ ...editUser, full_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editUser.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={editUser.role_id.toString()}
                    onValueChange={(v) =>
                      setEditUser({ ...editUser, role_id: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Admin</SelectItem>
                      <SelectItem value="2">Investigator</SelectItem>
                      <SelectItem value="3">Auditor</SelectItem>
                      <SelectItem value="4">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={editUser.is_active}
                    onCheckedChange={(v) => setEditUser({ ...editUser, is_active: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Locked</Label>
                  <Switch
                    checked={editUser.is_locked}
                    onCheckedChange={(v) => setEditUser({ ...editUser, is_locked: v })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
