'use client';

import { useState, useEffect } from 'react';
import { adminUserService } from '@/services/adminService';

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  createdAt: string;
  enabled: boolean;
}

const ROLES = [
  { value: 'USER', label: 'Người dùng', color: 'bg-zinc-100 text-zinc-700' },
  { value: 'ADMIN', label: 'Quản trị viên', color: 'bg-purple-100 text-purple-700' },
  { value: 'MANAGER', label: 'Quản lý', color: 'bg-blue-100 text-blue-700' },
];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminUserService.getAll();
      setUsers(response);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'USER',
    });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || 'USER',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = { ...formData };
      if (editingUser && !data.password) {
        delete (data as any).password;
      }

      if (editingUser) {
        await adminUserService.update(editingUser.id, data);
      } else {
        await adminUserService.create(data);
      }

      await fetchUsers();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminUserService.updateRole(userId, newRole);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (error: any) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vai trò');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;

    try {
      await adminUserService.delete(deleteModal.user.id);
      setUsers(users.filter(u => u.id !== deleteModal.user?.id));
      setDeleteModal({ open: false, user: null });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleInfo = (role: string) => {
    return ROLES.find(r => r.value === role) || { label: role, color: 'bg-zinc-100 text-zinc-700' };
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter && user.role !== roleFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !user.fullName?.toLowerCase().includes(search) &&
        !user.email?.toLowerCase().includes(search) &&
        !user.phone?.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quản lý người dùng</h1>
          <p className="text-zinc-500 mt-1">Quản lý tài khoản người dùng trong hệ thống</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm người dùng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-zinc-900">{users.length}</div>
          <div className="text-sm text-zinc-500">Tổng người dùng</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'ADMIN').length}
          </div>
          <div className="text-sm text-zinc-500">Quản trị viên</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'MANAGER').length}
          </div>
          <div className="text-sm text-zinc-500">Quản lý</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-zinc-600">
            {users.filter(u => u.role === 'USER').length}
          </div>
          <div className="text-sm text-zinc-500">Người dùng</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả vai trò</option>
            {ROLES.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <button
            onClick={() => { setSearchTerm(''); setRoleFilter(''); }}
            className="px-4 py-2 text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Người dùng</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Số điện thoại</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Vai trò</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-700">Ngày tạo</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                
                return (
                  <tr key={user.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-medium">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            user.fullName?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="font-medium text-zinc-900">{user.fullName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{user.email}</td>
                    <td className="px-6 py-4 text-zinc-600">{user.phone || 'Chưa cập nhật'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer ${roleInfo.color}`}
                      >
                        {ROLES.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, user })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-zinc-500">Không tìm thấy người dùng nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Mật khẩu {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={editingUser ? 'Để trống nếu không đổi' : '••••••••'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Vai trò
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  {editingUser ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Xác nhận xóa</h3>
            <p className="text-zinc-600 mb-6">
              Bạn có chắc chắn muốn xóa người dùng <span className="font-medium">{deleteModal.user?.fullName}</span>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
