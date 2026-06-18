'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, ShieldAlert, UserCheck, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        throw new Error('Không thể tải danh sách tài khoản.');
      }
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      toast({
        title: 'Lỗi hệ thống',
        description: error.message || 'Không thể liên kết dữ liệu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Cập nhật tài khoản thất bại.');
      }

      toast({
        title: 'Cập nhật thành công',
        description: `Đã thay đổi thông tin của ${json.name || 'thành viên'}.`,
      });

      // Update local state
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, name: editName, email: editEmail, role: editRole } : u)));
      setIsEditOpen(false);
    } catch (error: any) {
      toast({
        title: 'Thao tác thất bại',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Xóa tài khoản thất bại.');
      }

      toast({
        title: 'Đã xóa tài khoản',
        description: `Tài khoản ${selectedUser.email} đã bị xóa khỏi hệ thống.`,
      });

      // Update local state
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast({
        title: 'Thao tác thất bại',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = searchQuery.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
            Quản lý Tài khoản Học viên
          </h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tất cả thành viên trong hệ thống MyELTS. Xem, phân quyền Admin hoặc xóa tài khoản.
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm" className="border-pink-200 text-pink-600 hover:bg-pink-50">
          <RefreshCw className="mr-2 h-4 w-4" /> Làm mới
        </Button>
      </div>

      <Card className="border-[#F3D1E4] shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Bộ lọc tìm kiếm</CardTitle>
            <CardDescription>Tìm học viên theo tên hoặc email.</CardDescription>
          </div>
          <div className="relative mt-2 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Nhập tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-pink-100 focus-visible:ring-pink-500 focus-visible:border-pink-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Không tìm thấy người dùng nào phù hợp.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-pink-100 dark:border-gray-800">
              <Table>
                <TableHeader className="bg-pink-50/50 dark:bg-gray-800/20">
                  <TableRow>
                    <TableHead className="font-semibold">Tên hiển thị</TableHead>
                    <TableHead className="font-semibold">Email tài khoản</TableHead>
                    <TableHead className="font-semibold">Vai trò</TableHead>
                    <TableHead className="font-semibold">Ngày tạo</TableHead>
                    <TableHead className="text-right font-semibold">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-pink-50/20">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-600 text-xs font-bold dark:bg-pink-950/40 dark:text-pink-400">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span>{user.name || 'Chưa cập nhật'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.role === 'ADMIN' 
                            ? 'bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {user.role === 'ADMIN' ? (
                            <>
                              <ShieldAlert className="h-3 w-3" /> ADMIN
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3" /> USER
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(user)}
                          className="h-8 w-8 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(user)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thay đổi thông tin</DialogTitle>
            <DialogDescription>
              Cập nhật tên hiển thị, email và vai trò trong hệ thống của tài khoản.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Tên hiển thị</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3 border-pink-100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="col-span-3 border-pink-100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Vai trò</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="col-span-3 border-pink-100">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER (Học viên)</SelectItem>
                  <SelectItem value="ADMIN">ADMIN (Quản trị viên)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={actionLoading}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Xác nhận xóa tài khoản</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Tài khoản học viên sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu hệ thống cùng với mọi tiến trình học tập của họ.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-700 space-y-1">
            <p><strong>Tên:</strong> {selectedUser?.name || 'Chưa cập nhật'}</p>
            <p><strong>Email:</strong> {selectedUser?.email}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
            <Button
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
