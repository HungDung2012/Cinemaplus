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

  const getSeatStyles = (seat: Seat, isSelected: boolean) => {
    // Basic shared classes
    const base = "w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-[11px] font-medium rounded border transition-all duration-150 shadow-sm flex items-center justify-center";

    if (seat.isBooked) {
      return `${base} bg-gray-300 border-gray-300 text-white cursor-not-allowed`;
    }

    if (isSelected) {
      return `${base} bg-[#b11515] border-[#b11515] text-white shadow-md transform scale-110`;
    }

    // Dynamic coloring based on seat.seatColor from DB (if missing fallback to manual logic)
    const code = seat.seatTypeCode || seat.seatType || 'STANDARD';
    const hexColor = seat.seatColor;

    if (hexColor) {
      // Special case for couple seats (fill the whole box)
      if (code === 'COUPLE') {
        return `${base} text-white hover:brightness-110`;
      }
      // Outline style for VIP and Standard
      return `${base} bg-white text-gray-800 hover:brightness-95`;
    }

    // Absolutely no hex from backend (Fallback default logic)
    if (code === 'VIP') {
      return `${base} bg-white border-red-500 text-gray-800 hover:bg-red-50`;
    }
    if (code === 'COUPLE') {
      return `${base} bg-pink-400 border-pink-400 text-white hover:bg-pink-500`;
    }
    return `${base} bg-white border-green-500 text-gray-800 hover:bg-green-50`;
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
              <div key={row} className="flex items-center justify-center gap-1 mb-1">
                <div className="flex gap-[2px]">
                  {allColumns.map((col) => {
                    const seat = seatMap.get(col);
                    if (!seat) {
                      // Empty gap — matches deleted/NONE column in admin editor
                      return <div key={col} className="w-6 h-6 sm:w-7 sm:h-7" />;
                    }
                    const isSelected = !!selectedSeats.find((s) => s.id === seat.id);
                    return (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.isBooked}
                        className={getSeatStyles(seat, isSelected)}
                        style={
                          (!seat.isBooked && !isSelected && seat.seatColor)
                            ? (
                              (seat.seatTypeCode === 'COUPLE' || seat.seatType === 'COUPLE')
                                ? { backgroundColor: seat.seatColor, borderColor: seat.seatColor }
                                : { borderColor: seat.seatColor }
                            )
                            : {}
                        }
                        title={`${seat.seatLabel} - ${seat.seatTypeName || seat.seatType} - ${formatCurrency(basePrice * seat.priceMultiplier)}`}
                      >
                        {seat.isBooked ? 'X' : (seat.seatLabel || seat.seatNumber)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm mt-8 border-t pt-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border bg-white shadow-sm" style={{ borderColor: '#22c55e' }}></div>
          <span className="text-gray-700">Thường</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border bg-white shadow-sm" style={{ borderColor: '#ef4444' }}></div>
          <span className="text-gray-700">VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded shadow-sm border" style={{ backgroundColor: '#f472b6', borderColor: '#f472b6' }}></div>
          <span className="text-gray-700">Sweetbox (Đôi)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#b11515] shadow-sm border border-[#b11515]"></div>
          <span className="text-gray-700">Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-300 shadow-sm border border-gray-300 flex items-center justify-center text-white text-xs font-bold">X</div>
          <span className="text-gray-700">Không thể chọn</span>
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
