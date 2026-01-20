import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import LayoutWrapper from '@/components/layout/LayoutWrapper';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'CinemaPlus - Đặt vé xem phim trực tuyến',
  description: 'Hệ thống đặt vé xem phim trực tuyến hàng đầu Việt Nam. Trải nghiệm điện ảnh tuyệt vời cùng CinemaPlus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
