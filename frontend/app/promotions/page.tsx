'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Promotion, PromotionTypeOption } from '@/types';
import { getAllPromotions, getPromotionsByType, getPromotionTypes } from '@/services/promotionService';
import { LoadingSpinner } from '@/components/ui';

// Type labels with Vietnamese translations
const TYPE_LABELS: Record<string, string> = {
  'ALL': 'Tất cả',
  'GENERAL': 'Khuyến mãi chung',
  'TICKET': 'Ưu đãi vé',
  'FOOD': 'Ưu đãi đồ ăn',
  'COMBO': 'Combo tiết kiệm',
  'MEMBER': 'Ưu đãi thành viên',
  'PARTNER': 'Đối tác',
  'SPECIAL_DAY': 'Ngày đặc biệt',
  'MOVIE': 'Ưu đãi theo phim',
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [types, setTypes] = useState<PromotionTypeOption[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTypes();
    fetchPromotions();
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [selectedType]);

  const fetchTypes = async () => {
    try {
      const data = await getPromotionTypes();
      setTypes(data);
    } catch (err) {
      console.error('Error fetching promotion types:', err);
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      let data: Promotion[];
      if (selectedType === 'ALL') {
        data = await getAllPromotions();
      } else {
        data = await getPromotionsByType(selectedType);
      }
      setPromotions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Không thể tải dữ liệu khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return '';
    
    const formatDate = (date: string) => {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };
    
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) {
      return `Từ ${formatDate(startDate)}`;
    }
    return `Đến ${formatDate(endDate!)}`;
  };

  return (
    <div className="min-h-screen bg-[#f9f6f1]">
      {/* Page Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/" className="hover:text-zinc-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <span>/</span>
            <span className="text-zinc-800 font-medium">Khuyến mãi</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
            Tin khuyến mãi
          </h1>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-zinc-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`
                px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all
                ${selectedType === 'ALL'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}
              `}
            >
              Tất cả
            </button>
            {types.filter(t => t.value !== 'ALL').map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all
                  ${selectedType === type.value
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}
                `}
              >
                {TYPE_LABELS[type.value] || type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-600">{error}</p>
            <button
              onClick={fetchPromotions}
              className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-600">Chưa có khuyến mãi nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {promotions.map((promo) => (
              <Link
                key={promo.id}
                href={`/promotions/${promo.id}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-zinc-100"
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-zinc-100">
                  {promo.thumbnailUrl || promo.imageUrl ? (
                    <img
                      src={promo.thumbnailUrl || promo.imageUrl}
                      alt={promo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Featured badge */}
                  {promo.isFeatured && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      HOT
                    </div>
                  )}
                  
                  {/* Type badge */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {TYPE_LABELS[promo.type] || promo.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Date */}
                  {(promo.startDate || promo.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDateRange(promo.startDate, promo.endDate)}</span>
                    </div>
                  )}
                  
                  {/* Title */}
                  <h3 className="font-semibold text-zinc-900 line-clamp-2 group-hover:text-red-600 transition-colors min-h-[48px]">
                    {promo.title}
                  </h3>
                  
                  {/* Short Description */}
                  {promo.shortDescription && (
                    <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                      {promo.shortDescription}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
