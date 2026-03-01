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

  // Only render active seats (inactive = position removed from room layout)
  const activeSeats = seats.filter((s) => s.active);

  // Group seats by row
  const seatsByRow = activeSeats.reduce((acc, seat) => {
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

  // Compute the full column range across all rows so gaps are shown as empty cells
  const allSeatNumbers = activeSeats.map((s) => s.seatNumber);
  const minCol = allSeatNumbers.length ? Math.min(...allSeatNumbers) : 1;
  const maxCol = allSeatNumbers.length ? Math.max(...allSeatNumbers) : 1;
  const allColumns = Array.from({ length: maxCol - minCol + 1 }, (_, i) => i + minCol);

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

  // Fallback colors by code when backend doesn't supply seatColor
  // Cinema-style palette inspired by CGV/Lotte
  const FALLBACK_COLORS: Record<string, string> = {
    STANDARD: '#6b7280',  // slate gray
    VIP:      '#b45309',  // deep amber/gold
    COUPLE:   '#be185d',  // rose/magenta
    DISABLED: '#2563eb',  // blue (accessible)
  };

  const getSeatBgColor = (seat: Seat): string => {
    const code = seat.seatTypeCode || seat.seatType || 'STANDARD';
    return seat.seatColor || FALLBACK_COLORS[code] || '#64748b';
  };

  const getSeatClass = (seat: Seat) => {
    if (seat.isBooked) return 'cursor-not-allowed opacity-60';
    if (selectedSeats.find((s) => s.id === seat.id)) return 'ring-4 ring-green-400 ring-offset-1 scale-110 shadow-lg';
    return 'hover:brightness-125 hover:scale-105 hover:shadow-md cursor-pointer';
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
          {sortedRows.map((row) => {
            const seatMap = new Map(seatsByRow[row].map((s) => [s.seatNumber, s]));
            return (
              <div key={row} className="flex items-center justify-center gap-2 mb-2">
                <span className="w-6 text-center font-bold text-gray-600">{row}</span>
                <div className="flex gap-1">
                  {allColumns.map((col) => {
                    const seat = seatMap.get(col);
                    if (!seat) {
                      // Empty gap — matches deleted/NONE column in admin editor
                      return <div key={col} className="w-8 h-8" />;
                    }
                    return (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.isBooked}
                        className={`w-8 h-8 text-xs font-semibold rounded transition-all duration-150 text-white shadow-sm ${getSeatClass(seat)}`}
                        style={{ backgroundColor: seat.isBooked ? '#374151' : getSeatBgColor(seat) }}
                        title={`${seat.seatLabel} - ${seat.seatTypeName || seat.seatType} - ${formatCurrency(basePrice * seat.priceMultiplier)}`}
                      >
                        {seat.seatNumber}
                      </button>
                    );
                  })}
                </div>
                <span className="w-6 text-center font-bold text-gray-600">{row}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: '#6b7280' }}></div>
          <span>Thường</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: '#b45309' }}></div>
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded shadow-sm" style={{ backgroundColor: '#be185d' }}></div>
          <span>Đôi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded ring-4 ring-green-400 ring-offset-1 shadow-sm" style={{ backgroundColor: '#22c55e' }}></div>
          <span>Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded opacity-60" style={{ backgroundColor: '#374151' }}></div>
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
