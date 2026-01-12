'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
      return;
    }

    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: '',
        address: '',
      });
    }
  }, [user, isAuthenticated, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update
    setEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Thông tin tài khoản</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-white">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-red-500">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h2 className="text-xl font-bold">{user?.fullName}</h2>
                <p className="text-red-100">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Họ và tên"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  helperText="Email không thể thay đổi"
                />
                <Input
                  label="Số điện thoại"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div className="flex justify-end space-x-4">
                {editing ? (
                  <>
                    <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                      Hủy
                    </Button>
                    <Button type="submit">Lưu thay đổi</Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setEditing(true)}>
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
          <form className="space-y-4">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              placeholder="Nhập mật khẩu mới"
            />
            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
            />
            <Button type="submit">Đổi mật khẩu</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
