'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Promotion } from '@/types';
import { getPromotionById, getAllPromotions } from '@/services/promotionService';
import { LoadingSpinner } from '@/components/ui';

// Type labels with Vietnamese translations
const TYPE_LABELS: Record<string, string> = {
  'GENERAL': 'Khuyến mãi chung',
  'TICKET': 'Ưu đãi vé',
  'FOOD': 'Ưu đãi đồ ăn',
  'COMBO': 'Combo tiết kiệm',
  'MEMBER': 'Ưu đãi thành viên',
  'PARTNER': 'Đối tác',
  'SPECIAL_DAY': 'Ngày đặc biệt',
  'MOVIE': 'Ưu đãi theo phim',
};

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [relatedPromotions, setRelatedPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchPromotion(params.id as string);
    }
  }, [params.id]);

  const fetchPromotion = async (id: string) => {
    try {
      setLoading(true);
      const data = await getPromotionById(id);
      setPromotion(data);
      
      // Fetch related promotions
      const allPromotions = await getAllPromotions();
      const related = allPromotions
        .filter(p => p.id !== data.id && p.type === data.type)
        .slice(0, 4);
      setRelatedPromotions(related);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching promotion:', err);
      setError('Không tìm thấy khuyến mãi này');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f6f1] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="min-h-screen bg-[#f9f6f1] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Không tìm thấy khuyến mãi</h2>
          <p className="text-zinc-500 mb-6">{error || 'Khuyến mãi này không tồn tại hoặc đã hết hạn'}</p>
          <Link
            href="/promotions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f6f1]">
      {/* Page Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <span>/</span>
            <Link href="/promotions" className="hover:text-zinc-800 transition-colors">
              Khuyến mãi
            </Link>
            <span>/</span>
            <span className="text-zinc-800 font-medium line-clamp-1">{promotion.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Hero Image */}
          {promotion.imageUrl && (
            <div className="aspect-[21/9] relative overflow-hidden bg-zinc-100">
              <img
                src={promotion.imageUrl}
                alt={promotion.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Content Section */}
          <div className="p-6 md:p-10">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Type Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-zinc-900 text-white">
                {TYPE_LABELS[promotion.type] || promotion.type}
              </span>
              
              {/* Featured Badge */}
              {promotion.isFeatured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white">
                  HOT
                </span>
              )}
              
              {/* Date Range */}
              {(promotion.startDate || promotion.endDate) && (
                <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDateRange(promotion.startDate, promotion.endDate)}</span>
                </div>
              )}
              
              {/* View Count */}
              {promotion.viewCount !== undefined && promotion.viewCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{promotion.viewCount.toLocaleString()} lượt xem</span>
                </div>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-4">
              {promotion.title}
            </h1>
            
            {/* Short Description */}
            {promotion.shortDescription && (
              <p className="text-lg text-zinc-600 mb-8 pb-8 border-b border-zinc-100">
                {promotion.shortDescription}
              </p>
            )}
            
            {/* Full Content */}
            <div 
              className="prose prose-zinc max-w-none prose-headings:font-semibold prose-a:text-red-600 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: promotion.content || '' }}
            />
            
            {/* Share Section */}
            <div className="mt-10 pt-8 border-t border-zinc-100">
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-500">Chia sẻ:</span>
                <div className="flex items-center gap-2">
                  <button 
                    className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 011.141.195v3.325a8.623 8.623 0 00-.653-.036 6.685 6.685 0 00-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 00-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647z"/>
                    </svg>
                  </button>
                  <button 
                    className="w-9 h-9 rounded-full bg-sky-400 text-white flex items-center justify-center hover:bg-sky-500 transition-colors"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(promotion.title)}`, '_blank')}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button 
                    className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center hover:bg-zinc-300 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Đã sao chép liên kết!');
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Related Promotions */}
        {relatedPromotions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">
              Khuyến mãi liên quan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPromotions.map((promo) => (
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
                        <svg className="w-12 h-12 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Date */}
                    {(promo.startDate || promo.endDate) && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDateRange(promo.startDate, promo.endDate)}</span>
                      </div>
                    )}
                    
                    {/* Title */}
                    <h3 className="font-semibold text-zinc-900 line-clamp-2 group-hover:text-red-600 transition-colors text-sm">
                      {promo.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link
            href="/promotions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors border border-zinc-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Xem tất cả khuyến mãi
          </Link>
        </div>
      </div>
    </div>
  );
}
