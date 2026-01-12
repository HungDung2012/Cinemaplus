'use client';

import { useState } from 'react';
import { Seat } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface SeatMapProps {
  seats: Seat[];
  basePrice: number;
  onSelectionChange: (selectedSeats: Seat[]) => void;
  maxSeats?: number;
}

export default function SeatMap({ seats, basePrice, onSelectionChange, maxSeats = 8 }: SeatMapProps) {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.rowName]) {
      acc[seat.rowName] = [];
    }
    acc[seat.rowName].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows and seats
  const sortedRows = Object.keys(seatsByRow).sort();
  sortedRows.forEach((row) => {
    seatsByRow[row].sort((a, b) => a.seatNumber - b.seatNumber);
  });

  const handleSeatClick = (seat: Seat) => {
    if (seat.isBooked || !seat.active) return;

    const isSelected = selectedSeats.find((s) => s.id === seat.id);
    let newSelection: Seat[];

    if (isSelected) {
      newSelection = selectedSeats.filter((s) => s.id !== seat.id);
    } else {
      if (selectedSeats.length >= maxSeats) {
        alert(`Bạn chỉ có thể chọn tối đa ${maxSeats} ghế`);
        return;
      }
      newSelection = [...selectedSeats, seat];
    }

    setSelectedSeats(newSelection);
    onSelectionChange(newSelection);
  };

  const getSeatColor = (seat: Seat) => {
    if (seat.isBooked) return 'bg-gray-400 cursor-not-allowed';
    if (!seat.active) return 'bg-gray-300 cursor-not-allowed';
    if (selectedSeats.find((s) => s.id === seat.id)) return 'bg-green-500 text-white';
    
    switch (seat.seatType) {
      case 'VIP':
        return 'bg-yellow-400 hover:bg-yellow-500';
      case 'COUPLE':
        return 'bg-pink-400 hover:bg-pink-500';
      case 'DISABLED':
        return 'bg-blue-400 hover:bg-blue-500';
      default:
        return 'bg-white border-2 border-gray-300 hover:bg-gray-100';
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => {
    return sum + basePrice * seat.priceMultiplier;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Screen */}
      <div className="relative">
        <div className="mx-auto w-3/4 h-8 bg-gradient-to-b from-gray-400 to-transparent rounded-t-full flex items-center justify-center text-sm text-gray-600">
          MÀN HÌNH
        </div>
      </div>

      {/* Seat Map */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {sortedRows.map((row) => (
            <div key={row} className="flex items-center justify-center gap-2 mb-2">
              <span className="w-6 text-center font-bold text-gray-600">{row}</span>
              <div className="flex gap-1">
                {seatsByRow[row].map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.isBooked || !seat.active}
                    className={`w-8 h-8 text-xs font-medium rounded transition-colors ${getSeatColor(seat)}`}
                    title={`${seat.seatLabel} - ${seat.seatType} - ${formatCurrency(basePrice * seat.priceMultiplier)}`}
                  >
                    {seat.seatNumber}
                  </button>
                ))}
              </div>
              <span className="w-6 text-center font-bold text-gray-600">{row}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
          <span>Thường</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-400 rounded"></div>
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-pink-400 rounded"></div>
          <span>Couple</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span>Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-400 rounded"></div>
          <span>Đã đặt</span>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Ghế đã chọn:</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedSeats.map((seat) => (
              <span key={seat.id} className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                {seat.seatLabel}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-300">
            <span className="font-medium">Tổng tiền:</span>
            <span className="text-xl font-bold text-red-500">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
