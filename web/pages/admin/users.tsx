import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Ban,
  CheckCircle,
  XCircle,
  Crown,
  DollarSign,
  Download,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { DataTable } from '@components/ui/table';
import withAuth from '../../components/withAuth';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'banned';
  joinDate: Date;
  lastActive: Date;
  commandsUsed: number;
  aiRequests: number;
  totalSpent: number;
  level: number;
  xp: number;
}

interface Stats {
  total: number;
  active: number;
  premium: number;
  banned: number;
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    premium: 0,
    banned: 0
  });

  const usersPerPage = 10;

  useEffect(() => {
    const loadUsers = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        phone: `+123456789${i.toString().padStart(3, '0')}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        plan: ['free', 'basic', 'pro', 'enterprise'][Math.floor(Math.random() * 4)] as User['plan'],
        status: ['active', 'inactive', 'banned'][Math.floor(Math.random() * 3)] as User['status'],
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        commandsUsed: Math.floor(Math.random() * 1000),
        aiRequests: Math.floor(Math.random() * 500),
        totalSpent: Math.floor(Math.random() * 500),
        level: Math.floor(Math.random() * 50) + 1,
        xp: Math.floor(Math.random() * 5000)
      }));

      setUsers(mockUsers);
      setFilteredUsers(mockUsers);

      const calculatedStats: Stats = mockUsers.reduce((acc, user) => ({
        total: acc.total + 1,
        active: acc.active + (user.status === 'active' ? 1 : 0),
        premium: acc.premium + (user.plan !== 'free' ? 1 : 0),
        banned: acc.banned + (user.status === 'banned' ? 1 : 0)
      }), { total: 0, active: 0, premium: 0, banned: 0 });

      setStats(calculatedStats);
      setLoading(false);
    };

    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.phone.includes(searchTerm);
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
      return matchesSearch && matchesStatus && matchesPlan;
    });

    setFilteredUsers(filtered);
    setSelectedUsers([]);
  }, [users, searchTerm, filterStatus, filterPlan]);

  const handleUserAction = async (action: string, userId: string) => {
    console.log(`${action} user:`, userId);
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: action === 'ban' ? 'banned' : action === 'unban' ? 'active' : user.status }
        : user
    ));
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    console.log(`${action} users:`, selectedUsers);

    setUsers(users.map(user =>
      selectedUsers.includes(user.id)
        ? { ...user, status: action === 'ban' ? 'banned' : action === 'unban' ? 'active' : user.status }
        : user
    ));

    setSelectedUsers([]);
  };

  const exportUsers = () => {
    const csvData = filteredUsers.map(user => ({
      ID: user.id,
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      Plan: user.plan,
      Status: user.status,
      JoinDate: user.joinDate.toISOString(),
      LastActive: user.lastActive.toISOString(),
      CommandsUsed: user.commandsUsed,
      AIRequests: user.aiRequests,
      TotalSpent: user.totalSpent,
      Level: user.level,
      XP: user.xp
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusVariant = (status: User['status']) => {
    switch (status) {
      case 'active': return "default" as const;
      case 'inactive': return "secondary" as const;
      case 'banned': return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  const getPlanVariant = (plan: User['plan']) => {
    switch (plan) {
      case 'free': return "secondary" as const;
      case 'basic': return "outline" as const;
      case 'pro': return "default" as const;
      case 'enterprise': return "secondary" as const;
      default: return "secondary" as const;
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <img
            className="h-8 w-8 rounded-full"
            src={row.original.avatar}
            alt={row.original.name}
          />
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }: any) => (
        <Badge variant={getPlanVariant(row.original.plan)}>
          {row.original.plan.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "commandsUsed",
      header: "Commands Used",
      cell: ({ row }: any) => row.original.commandsUsed,
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      cell: ({ row }: any) => row.original.lastActive.toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedUser(row.original);
            setShowUserModal(true);
          }}>
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleUserAction(row.original.status === 'banned' ? 'unban' : 'ban', row.original.id)}
              >
                {row.original.status === 'banned' ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                {row.original.status === 'banned' ? 'Unban' : 'Ban'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleUserAction('edit', row.original.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts, subscriptions, and permissions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.premium.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.banned.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        {selectedUsers.length > 0 && (
          <CardContent className="p-4 bg-accent/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button variant="destructive" size="sm" onClick={() => handleBulkAction('ban')}>
                  Ban Selected
                </Button>
                <Button variant="default" size="sm" onClick={() => handleBulkAction('unban')}>
                  Unban Selected
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage and view user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredUsers} searchKey="name" />
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img
                  className="h-16 w-16 rounded-full"
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                />
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-600">
                    Level {selectedUser.level} • {selectedUser.xp} XP
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedUser.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {selectedUser.joinDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Last active {selectedUser.lastActive.toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{selectedUser.commandsUsed}</div>
                  <div className="text-sm text-muted-foreground">Commands Used</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-secondary">{selectedUser.aiRequests}</div>
                  <div className="text-sm text-muted-foreground">AI Requests</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-success">${selectedUser.totalSpent}</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-warning">{selectedUser.level}</div>
                  <div className="text-sm text-muted-foreground">Current Level</div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="destructive" onClick={() => handleUserAction(selectedUser.status === 'banned' ? 'unban' : 'ban', selectedUser.id)}>
                  {selectedUser.status === 'banned' ? 'Unban User' : 'Ban User'}
                </Button>
                <Button onClick={() => handleUserAction('edit', selectedUser.id)}>
                  Edit User
                </Button>
                <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(UserManagement);