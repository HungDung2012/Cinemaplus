'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Movie, Promotion } from '@/types';
import { movieService } from '@/services/movieService';
import { getAllPromotions } from '@/services/promotionService';
import { MovieCard } from '@/components';
import {
  PlayCircle, Ticket, Compass, Star,
  ShieldCheck, Gift, Utensils, Zap, ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const [nowShowingMovies, setNowShowingMovies] = useState<Movie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = useState<Movie[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [nowShowing, comingSoon, fetchedPromotions] = await Promise.all([
        movieService.getNowShowingMovies(),
        movieService.getComingSoonMovies(),
        getAllPromotions()
      ]);
      setNowShowingMovies(nowShowing);
      setComingSoonMovies(comingSoon);
      setPromotions(fetchedPromotions.filter((p: Promotion) => p.status === 'ACTIVE').slice(0, 3));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        {/* Background Image with Parallax feel */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent z-10 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Hero Cinema Background"
            className="w-full h-full object-cover opacity-60 scale-105"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-100 text-sm font-semibold tracking-wide mb-6">
              <Star className="w-4 h-4 text-red-400 fill-red-400" />
              Hệ Thống Rạp Chiếu Phim Hàng Đầu
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-2xl">
              Trải nghiệm <br />điện ảnh
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400 ml-3">đỉnh cao</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl font-medium leading-relaxed drop-shadow-md">
              Đắm chìm vào thế giới phim bom tấn với hệ thống âm thanh vòm cực đã và màn hình sắc nét. Đặt vé ngay hôm nay!
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/movies"
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-1 active:scale-95"
              >
                <Ticket className="w-5 h-5" />
                Mua Vé Ngay
              </Link>
              <Link
                href="/movies?tab=coming-soon"
                className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 hover:-translate-y-1 active:scale-95"
              >
                <PlayCircle className="w-5 h-5" />
                Xem Trailer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 text-red-600 font-bold tracking-widest uppercase text-sm mb-2">
              <PlayCircle className="w-5 h-5" /> Phim Hiện Tại
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Phim Đang Chiếu
            </h2>
          </div>
          <Link
            href="/movies?tab=now-showing"
            className="group flex items-center text-sm font-bold text-gray-500 hover:text-red-600 transition-colors bg-white hover:bg-red-50 px-4 py-2 rounded-full border border-gray-200 hover:border-red-200"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="bg-gray-200 aspect-[2/3] rounded-xl mb-4"></div>
                <div className="bg-gray-200 h-5 rounded-md mb-3"></div>
                <div className="bg-gray-200 h-4 rounded-md w-2/3"></div>
              </div>
            ))}
          </div>
        ) : nowShowingMovies.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Chưa có phim đang chiếu lúc này</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
            {nowShowingMovies.slice(0, 10).map((movie) => (
              <MovieCard key={movie.id} movie={movie} showBookingButton={true} />
            ))}
          </div>
        )}
      </section>

      {/* Promotion Offers Section */}
      <section className="py-16 md:py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 text-red-600 font-bold tracking-widest uppercase text-sm mb-3 px-4 py-1.5 rounded-full bg-red-50">
              <Gift className="w-4 h-4" /> Ưu đãi hot
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Khuyến Mãi Mới Nhất
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {promotions.map((promo) => (
              <Link href={`/promotions/${promo.id}`} key={promo.id} className="group rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-2 transition-all duration-300 block">
                <div className="relative h-[200px] overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                  <img src={promo.imageUrl || 'https://via.placeholder.com/800x400'} alt={promo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg z-20 shadow-lg shadow-red-600/30">
                    {promo.type === 'FOOD' ? 'F&B' : promo.type === 'TICKET' ? 'Giá Vé' :
                      promo.type === 'SPECIAL_DAY' ? 'Sự Kiện' : promo.type === 'MEMBER' ? 'Member' : 'Ưu Đãi'}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                    {promo.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-2">
                    {promo.shortDescription}
                  </p>
                  <div className="text-red-600 font-bold text-sm flex items-center gap-1 group/btn">
                    Xem chi tiết
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-widest uppercase text-sm mb-2">
              <Zap className="w-5 h-5" /> Sắp ra mắt
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Phim Sắp Chiếu
            </h2>
          </div>
          <Link
            href="/movies?tab=coming-soon"
            className="group flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors bg-white hover:bg-indigo-50 px-4 py-2 rounded-full border border-gray-200 hover:border-indigo-200"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="bg-gray-200 aspect-[2/3] rounded-xl mb-4"></div>
                <div className="bg-gray-200 h-5 rounded-md mb-3"></div>
                <div className="bg-gray-200 h-4 rounded-md w-2/3"></div>
              </div>
            ))}
          </div>
        ) : comingSoonMovies.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Compass className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Chưa có phim sắp chiếu</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
            {comingSoonMovies.slice(0, 5).map((movie) => (
              <MovieCard key={movie.id} movie={movie} showBookingButton={false} />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">
              Tại sao chọn CinemaPlus?
            </h2>
            <p className="text-gray-400 text-lg">Chúng tôi cam kết mang lại trải nghiệm tiện nghi, dịch vụ giải trí hàng đầu với công nghệ tiệm cận chuẩn quốc tế.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
              <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-red-500/30">
                <Ticket className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Đặt vé 3 Giây</h3>
              <p className="text-gray-400 leading-relaxed">
                Hệ thống đặt vé siêu tốc. Chỉ với vài cú chạm, bạn đã có ngay vị trí đẹp nhất trong rạp mà không cần chờ đợi.
              </p>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-blue-500/30">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Thanh toán An toàn</h3>
              <p className="text-gray-400 leading-relaxed">
                Hoàn toàn bảo mật. Hỗ trợ đa dạng phương thức từ Momo, ZaloPay, VNPay đến thẻ tín dụng quốc tế Visa/Mastercard.
              </p>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
              <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-amber-500/30">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Dịch vụ Thượng hạng</h3>
              <p className="text-gray-400 leading-relaxed">
                Tích điểm thành viên VVIP. Cơ hội nhận vô số combo quà tặng F&B, bỏng ngô và các event Private Screening hấp dẫn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
