'use client';

import { useState } from 'react';
import { PaymentMethod, PaymentMethodConfig, isOnlinePaymentMethod } from '@/types';

/**
 * Cấu hình các phương thức thanh toán hiển thị cho user.
 * isOnline = true: sẽ redirect đến cổng thanh toán bên ngoài.
 */
const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'VNPAY',
    name: 'VNPay',
    icon: '🔴',
    color: 'bg-red-600',
    promo: 'Hỗ trợ ATM, Visa, Master, QR Code',
    isOnline: true,
  },
  {
    id: 'MOMO',
    name: 'Ví MoMo',
    icon: '📱',
    color: 'bg-pink-500',
    promo: 'Giảm 5K cho đơn từ 50K',
    isOnline: true,
  },
  {
    id: 'ZALOPAY',
    name: 'ZaloPay',
    icon: '💙',
    color: 'bg-blue-500',
    promo: 'Giảm 5K mọi đơn lần đầu',
    isOnline: true,
  },
  {
    id: 'CREDIT_CARD',
    name: 'ATM card (Thẻ nội địa)',
    icon: '🏧',
    color: 'bg-blue-600',
    isOnline: false,
  },
  {
    id: 'DEBIT_CARD',
    name: 'Thẻ quốc tế (Visa, Master, JCB)',
    icon: '💳',
    color: 'bg-blue-800',
    isOnline: false,
  },
  {
    id: 'BANK_TRANSFER',
    name: 'Chuyển khoản ngân hàng',
    icon: '🏦',
    color: 'bg-green-600',
    isOnline: false,
  },
];

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Component chọn phương thức thanh toán.
 * Hiển thị Online gateways (VNPay, MoMo, ZaloPay) nổi bật,
 * và các phương thức offline bên dưới.
 * Sử dụng light theme (bg-white) phù hợp với booking page.
 */
export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false,
  loading = false,
}: PaymentMethodSelectorProps) {

  return (
    <div className="divide-y divide-zinc-100">
      {/* Online gateways — hiển thị nổi bật với badge "Online" */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          💳 Thanh toán online
        </p>
        <div className="space-y-1">
          {PAYMENT_METHODS.filter(m => m.isOnline).map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                paymentMethodSelected(selectedMethod, method.id)
                  ? 'bg-zinc-100 ring-2 ring-zinc-800'
                  : 'hover:bg-zinc-50'
              } ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => !disabled && onMethodChange(method.id)}
                disabled={disabled || loading}
                className="w-4 h-4 text-zinc-800 border-zinc-300 focus:ring-zinc-500"
              />
              <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center ml-3`}>
                <span className="text-lg">{method.icon}</span>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">{method.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 font-medium">
                    Online
                  </span>
                </div>
                {method.promo && (
                  <p className="text-xs text-green-600 mt-0.5">{method.promo}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Offline methods */}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          🏦 Phương thức khác
        </p>
        <div className="space-y-1">
          {PAYMENT_METHODS.filter(m => !m.isOnline).map((method) => (
            <label
              key={method.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                paymentMethodSelected(selectedMethod, method.id)
                  ? 'bg-zinc-100 ring-2 ring-zinc-800'
                  : 'hover:bg-zinc-50'
              } ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => !disabled && onMethodChange(method.id)}
                disabled={disabled || loading}
                className="w-4 h-4 text-zinc-800 border-zinc-300 focus:ring-zinc-500"
              />
              <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center ml-3`}>
                <span className="text-lg">{method.icon}</span>
              </div>
              <div className="ml-3 flex-1">
                <span className="text-sm font-medium text-zinc-900">{method.name}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center px-4 py-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-800 mr-2"></div>
          <span className="text-sm text-zinc-500">Đang tạo liên kết thanh toán...</span>
        </div>
      )}
    </div>
  );
}

/** Helper so sánh method đang chọn */
function paymentMethodSelected(selected: PaymentMethod, id: string): boolean {
  return selected === id;
}
