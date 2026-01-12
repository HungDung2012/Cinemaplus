'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h-2v-2h2zm-2-2h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-4h2v-2h-2v2zM7 13v2H5v-2h2zm0-2H5v-2h2v2z" />
            </svg>
            <span className="text-xl font-bold">CinemaPlus</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-red-500 transition-colors">
              Trang chủ
            </Link>
            <Link href="/movies" className="hover:text-red-500 transition-colors">
              Phim
            </Link>
            <Link href="/dat-ve" className="hover:text-red-500 transition-colors">
              Đặt vé
            </Link>
            <Link href="/theaters" className="hover:text-red-500 transition-colors">
              Rạp chiếu
            </Link>
            <Link href="/promotions" className="hover:text-red-500 transition-colors">
              Khuyến mãi
            </Link>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user?.fullName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-gray-800">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Tài khoản
                    </Link>
                    <Link
                      href="/my-bookings"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Lịch sử đặt vé
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Quản trị
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="hover:text-red-500 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                Trang chủ
              </Link>
              <Link href="/movies" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                Phim
              </Link>
              <Link href="/dat-ve" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                Đặt vé
              </Link>
              <Link href="/theaters" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                Rạp chiếu
              </Link>
              <Link href="/promotions" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                Khuyến mãi
              </Link>
              <hr className="border-gray-800" />
              {isAuthenticated ? (
                <>
                  <Link href="/profile" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                    Tài khoản
                  </Link>
                  <Link href="/my-bookings" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                    Lịch sử đặt vé
                  </Link>
                  <button onClick={logout} className="text-left text-red-500">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link href="/register" className="hover:text-red-500" onClick={() => setIsMenuOpen(false)}>
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
