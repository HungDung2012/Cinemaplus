'use client';

import { TheaterSummary } from '@/types';
import { useState, useEffect } from 'react';
import { cinemaService } from '@/services/cinemaService';

interface CinemaHeaderProps {
  theater: TheaterSummary;
  cityName?: string; // City name passed from parent component
}

interface CinemaDetailInfo {
  id: number;
  name: string;
  address: string;
  cityName?: string;
  cityCode?: string;
  regionName?: string;
  totalRooms: number;
  roomTypes?: string[];
  mapUrl?: string;
  hotline?: string;
  phone?: string;
}

export default function CinemaHeader({ theater, cityName }: CinemaHeaderProps) {
  const [cinemaInfo, setCinemaInfo] = useState<CinemaDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCinemaDetail = async () => {
      try {
        setLoading(true);
        const data = await cinemaService.getTheaterDetail(theater.id);
        console.log(data);
        // Map TheaterSummary to CinemaDetailInfo
        setCinemaInfo({
          id: data.id,
          name: data.name,
          address: data.address,
          totalRooms: data.totalRooms,
          mapUrl: data.mapUrl,
          phone: data.phone,
        });
      } catch (error) {
        console.error('Error fetching cinema detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCinemaDetail();
  }, [theater.id]);

  const getMapEmbedUrl = () => {
    const address = cinemaInfo?.address || theater.address;
    const city = cinemaInfo?.cityName || cityName || '';
    const encodedAddress = encodeURIComponent(`${address}, ${city}, Vietnam`);
    return `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
        <div className="h-[300px] bg-zinc-200" />
        <div className="p-6 space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-1/2" />
          <div className="h-4 bg-zinc-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Cinema Name Banner */}
      <div className="bg-[#2C2524] px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 justify-center">
          {theater.name}
        </h2>
      </div>

      {/* Cinema Info */}
      <div className="p-6 border-b border-zinc-200">
        <div className="flex flex-wrap gap-6">
          {/* Address */}
          <div className="flex items-start gap-3 flex-1 min-w-[250px]">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Địa chỉ</p>
              <p className="text-zinc-800">{theater.address}</p>
            </div>
          </div>

          {/* Hotline */}
          {(cinemaInfo?.hotline || cinemaInfo?.phone) && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <p className="text-sm text-zinc-500 font-medium">Hotline</p>
                <a href={`tel:${cinemaInfo.hotline || cinemaInfo.phone}`} className="text-red-600 font-semibold hover:underline">
                  {cinemaInfo.hotline || cinemaInfo.phone}
                </a>
              </div>
            </div>
          )}

          {/* Total Rooms */}
          {cinemaInfo && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="text-sm text-zinc-500 font-medium">Số phòng chiếu</p>
                <p className="text-zinc-800 font-semibold">{cinemaInfo.totalRooms} phòng</p>
              </div>
            </div>
          )}
        </div>

        {/* Room Types Tags */}
        {cinemaInfo?.roomTypes && cinemaInfo.roomTypes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {cinemaInfo.roomTypes.map((type, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-zinc-100 text-zinc-700 text-sm rounded-full font-medium"
              >
                {type}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Google Maps Embed */}
      <div className="relative">
        <div className="aspect-video max-h-[400px] w-full">
          <iframe
            src={getMapEmbedUrl()}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '300px' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Bản đồ ${theater.name}`}
            className="w-full h-full"
          />
        </div>
        
        {/* Map Overlay Actions */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(theater.address + ', ' + (cinemaInfo?.cityName || cityName || '') + ', Vietnam')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Xem bản đồ lớn
          </a>
        </div>
      </div>
    </div>
  );
}
