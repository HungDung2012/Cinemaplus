'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Payment, PaymentStatus } from '@/types';
import { paymentService } from '@/services/bookingService';

/**
 * Trang thanh toán trả về (Payment Return Page).
 * 
 * Sau khi user thanh toán xong trên cổng thanh toán (VNPay/MoMo/ZaloPay),
 * cổng sẽ redirect user về URL này kèm theo query params.
 * 
 * Trang này sẽ:
 * 1. Đọc bookingCode từ query params (tuỳ cổng sẽ khác nhau)
 * 2. Gọi API backend kiểm tra trạng thái thanh toán
 * 3. Hiển thị kết quả (thành công / thất bại / đang xử lý)
 */

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const method = searchParams.get('method'); // vnpay | momo | zalopay

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Lấy bookingCode từ query params tuỳ cổng thanh toán
        const bookingCode = extractBookingCode(method, searchParams);
        
        if (!bookingCode) {
          setError('Không tìm thấy thông tin đơn hàng');
          setStatus('failed');
          return;
        }

        // Gọi API kiểm tra trạng thái thanh toán
        const paymentData = await paymentService.getPaymentStatus(bookingCode);
        setPayment(paymentData);

        if (paymentData.status === 'COMPLETED') {
          setStatus('success');
        } else if (paymentData.status === 'FAILED' || paymentData.status === 'CANCELLED') {
          setStatus('failed');
        } else {
          // PENDING — IPN chưa được xử lý, retry sau vài giây
          setStatus('pending');
          
          // Auto-retry tối đa 5 lần, mỗi lần cách nhau 3s
          if (retryCount < 5) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 3000);
          }
        }
      } catch (err: any) {
        console.error('Error checking payment status:', err);
        setError(err.response?.data?.message || 'Không thể kiểm tra trạng thái thanh toán');
        setStatus('failed');
      }
    };

    checkPaymentStatus();
  }, [method, searchParams, retryCount]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Loading state */}
        {status === 'loading' && (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Đang xử lý thanh toán</h2>
            <p className="text-gray-400">Vui lòng đợi trong giây lát...</p>
          </div>
        )}

        {/* Pending state (IPN chưa xử lý xong) */}
        {status === 'pending' && (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Đang chờ xác nhận</h2>
            <p className="text-gray-400 mb-2">Giao dịch đang được xử lý bởi cổng thanh toán.</p>
            <p className="text-sm text-gray-500">
              Tự động kiểm tra lại... ({retryCount}/5)
            </p>
            {payment && (
              <div className="mt-4 p-3 bg-gray-700/50 rounded-lg text-sm text-gray-300">
                <p>Mã đơn: <span className="font-mono text-yellow-400">{payment.bookingCode}</span></p>
                <p>Số tiền: <span className="font-semibold">{payment.amount?.toLocaleString('vi-VN')}đ</span></p>
              </div>
            )}
            {retryCount >= 5 && (
              <div className="mt-4">
                <p className="text-sm text-yellow-400 mb-3">
                  Nếu đã thanh toán thành công, vui lòng kiểm tra lại sau vài phút.
                </p>
                <Link href="/profile" className="text-yellow-500 hover:text-yellow-400 underline text-sm">
                  Xem lịch sử đặt vé →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Success state */}
        {status === 'success' && payment && (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thanh toán thành công! 🎉</h2>
            <p className="text-gray-400 mb-6">Vé xem phim của bạn đã được xác nhận.</p>
            
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Mã đơn hàng:</span>
                <span className="font-mono text-yellow-400 font-semibold">{payment.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mã giao dịch:</span>
                <span className="font-mono text-green-400 text-sm">{payment.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số tiền:</span>
                <span className="text-white font-semibold">{payment.amount?.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phương thức:</span>
                <span className="text-white">{getMethodLabel(payment.paymentMethod)}</span>
              </div>
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Thời gian:</span>
                  <span className="text-white text-sm">{new Date(payment.paidAt).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/profile"
                className="w-full py-3 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors text-center"
              >
                Xem vé của tôi
              </Link>
              <Link
                href="/"
                className="w-full py-3 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors text-center"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        )}

        {/* Failed state */}
        {status === 'failed' && (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thanh toán thất bại</h2>
            <p className="text-gray-400 mb-4">
              {error || 'Giao dịch không thành công. Vui lòng thử lại.'}
            </p>
            
            {payment && (
              <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mã đơn:</span>
                  <span className="font-mono text-yellow-400">{payment.bookingCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trạng thái:</span>
                  <span className="text-red-400 font-medium">{payment.status}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.back()}
                className="w-full py-3 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors"
              >
                Thử lại
              </button>
              <Link
                href="/"
                className="w-full py-3 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors text-center"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Trích xuất bookingCode từ query params của cổng thanh toán.
 * Mỗi cổng trả về khác nhau nên cần parse riêng.
 */
function extractBookingCode(
  method: string | null,
  searchParams: URLSearchParams
): string | null {
  switch (method) {
    case 'vnpay':
      // VNPay trả vnp_TxnRef = bookingCode
      return searchParams.get('vnp_TxnRef');
    case 'momo':
      // MoMo trả orderId = bookingCode
      return searchParams.get('orderId');
    case 'zalopay':
      // ZaloPay trả về trong apptransid, nhưng ta embed orderId trong embed_data
      // Do redirect URL có thể không chứa bookingCode trực tiếp,
      // ta dùng apptransid hoặc ta tự append bookingCode trong returnUrl
      return searchParams.get('bookingCode') || searchParams.get('apptransid');
    default:
      // Fallback: thử tìm bookingCode trực tiếp
      return searchParams.get('bookingCode') || searchParams.get('vnp_TxnRef') || searchParams.get('orderId');
  }
}

function getMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    VNPAY: 'VNPay',
    MOMO: 'Ví MoMo',
    ZALOPAY: 'ZaloPay',
    CREDIT_CARD: 'Thẻ nội địa',
    DEBIT_CARD: 'Thẻ quốc tế',
    BANK_TRANSFER: 'Chuyển khoản',
    CASH: 'Tiền mặt',
  };
  return labels[method] || method;
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}
