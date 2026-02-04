'use client';

import React, { useRef, useState, useMemo } from 'react';

import { Showtime, Room, Movie } from '@/types';

interface ShowtimeTimelineProps {
    rooms: Room[];
    showtimes: Showtime[];
    onShowtimeClick: (showtime: Showtime) => void;
    date: string;

    // Interactive Props
    interactiveMode?: boolean;
    selectedMovie?: Movie;
    onSlotClick?: (room: Room, time: string) => void;
}

export default function ShowtimeTimeline({
    rooms,
    showtimes,
    onShowtimeClick,
    interactiveMode,
    selectedMovie,
    onSlotClick,
    date
}: ShowtimeTimelineProps) {
    const START_HOUR = 8;
    const END_HOUR = 24;
    const PIXELS_PER_MINUTE = 2.5;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const TOTAL_WIDTH = TOTAL_HOURS * 60 * PIXELS_PER_MINUTE;
    const HEADER_HEIGHT = 40;
    const ROW_HEIGHT = 80;

    const [hoverState, setHoverState] = useState<{ roomId: number, timeStr: string, left: number } | null>(null);
    const [hoveredShowtime, setHoveredShowtime] = useState<{ showtime: Showtime, x: number, y: number } | null>(null);

    // Group rooms (Previous logic)
    const roomsByTheater = useMemo(() => {
        return rooms.reduce((acc, room) => {
            const tName = room.theaterName || "Rạp hiện tại";
            if (!acc[tName]) acc[tName] = [];
            acc[tName].push(room);
            return acc;
        }, {} as Record<string, Room[]>);
    }, [rooms]);
    const sortedTheaterNames = Object.keys(roomsByTheater).sort();

    // Helper: Position & Time
    const getPosition = (timeStr: string) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        const minutesFromStart = (h - START_HOUR) * 60 + m;
        return Math.max(0, minutesFromStart) * PIXELS_PER_MINUTE;
    };

    const getTimeFromX = (x: number) => {
        const minutesFromStart = x / PIXELS_PER_MINUTE;
        const totalMinutes = (START_HOUR * 60) + minutesFromStart;
        const h = Math.floor(totalMinutes / 60);
        const m = Math.floor(totalMinutes % 60);
        // Snap to 5 mins
        const snappedM = Math.round(m / 5) * 5;
        return `${h.toString().padStart(2, '0')}:${snappedM.toString().padStart(2, '0')}`;
    };

    const getWidth = (mins: number) => mins * PIXELS_PER_MINUTE;

    // Phantom Calculations
    const phantom = useMemo(() => {
        if (!selectedMovie || !hoverState) return null;

        const ADS = 20;
        const CLEAN = 15;
        const totalDur = ADS + selectedMovie.duration + CLEAN;

        return {
            width: getWidth(totalDur),
            adsWidth: getWidth(ADS),
            movieWidth: getWidth(selectedMovie.duration),
            cleanWidth: getWidth(CLEAN),
            left: hoverState.left // Align with cursor snapped
        };
    }, [selectedMovie, hoverState]);

    const handleMouseMove = (e: React.MouseEvent, room: Room) => {
        if (!interactiveMode || !selectedMovie) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const timeStr = getTimeFromX(x);

        // Snap left position for visual stability
        const snappedLeft = getPosition(timeStr);

        setHoverState({ roomId: room.id, timeStr, left: snappedLeft });
    };

    const handleMouseLeave = () => setHoverState(null);

    const handleClick = (room: Room) => {
        if (hoverState && onSlotClick) {
            onSlotClick(room, hoverState.timeStr);
        }
    };

    // Filter showtimes for the specific date if provided
    // If showtime.showDate exists, compare it. If not, assume it belongs (backward compat).
    const filteredShowtimes = useMemo(() => {
        if (!date) return showtimes;
        return showtimes.filter(s => !s.showDate || s.showDate === date);
    }, [showtimes, date]);

    // Total Height
    const totalHeight = HEADER_HEIGHT + (rooms.length * ROW_HEIGHT) + (sortedTheaterNames.length * 30);
    const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

    return (
        <div className=" inset-0 overflow-auto bg-white select-none">
            <div style={{ width: `${Math.max(1000, 160 + TOTAL_WIDTH)}px`, height: `${totalHeight}px` }}>

                {/* Header */}
                <div className="flex sticky top-0 bg-zinc-50 border-b border-zinc-200" style={{ height: HEADER_HEIGHT }}>
                    <div className="sticky z-20 left-0 w-40 bg-zinc-50 border-r border-zinc-200 p-2 text-xs font-semibold text-zinc-500 flex items-center justify-center shadow-[4px_0_4px_-2px_rgba(0,0,0,0.05)]">
                        Phòng / Thời gian
                    </div>
                    <div className="relative flex-1">
                        {hours.map(h => (
                            <div key={h} className="absolute border-l border-zinc-200 text-xs text-zinc-400 pl-1 pt-1"
                                style={{ left: getWidth((h - START_HOUR) * 60) }}>
                                {h}:00
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                {sortedTheaterNames.map(tName => (
                    <React.Fragment key={tName}>
                        <div className="sticky left-0 bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 uppercase border-b border-zinc-200 z-20">
                            {tName}
                        </div>
                        {roomsByTheater[tName].map(room => (
                            <div key={room.id} className="flex border-b border-zinc-100 h-[80px] hover:bg-zinc-50 relative group">
                                {/* Room Name */}
                                <div className="sticky left-0 w-40 flex-shrink-0 bg-white border-r border-zinc-200 p-3 flex flex-col justify-center z-20 shadow-[4px_0_4px_-2px_rgba(0,0,0,0.05)]">
                                    <div className="font-semibold text-zinc-900 text-sm">{room.name}</div>
                                    <div className="text-xs text-zinc-500">{room.roomType}</div>
                                </div>

                                {/* Timeline Area */}
                                <div
                                    className="relative flex-1 cursor-crosshair"
                                    onMouseMove={(e) => handleMouseMove(e, room)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => handleClick(room)}
                                >
                                    {/* Grid Lines */}
                                    {hours.map(h => (
                                        <div key={h} className="absolute top-0 bottom-0 border-l border-zinc-100"
                                            style={{ left: getWidth((h - START_HOUR) * 60) }} />
                                    ))}

                                    {/* Phantom Block (Hover) */}
                                    {interactiveMode && phantom && hoverState?.roomId === room.id && (
                                        <div
                                            className="absolute top-2 bottom-2 rounded opacity-80 pointer-events-none flex overflow-hidden z-10 animate-pulse ring-2 ring-blue-400"
                                            style={{ left: phantom.left, width: phantom.width }}
                                        >
                                            <div style={{ width: phantom.adsWidth }} className="bg-yellow-200/50 h-full flex items-center justify-center text-[10px] text-yellow-800 font-bold border-r border-white/30">ADS</div>
                                            <div style={{ width: phantom.movieWidth }} className="bg-blue-200/50 h-full flex items-center justify-center text-[10px] text-blue-800 font-bold border-r border-white/30 truncate px-1">
                                                {selectedMovie?.title} ({hoverState.timeStr})
                                            </div>
                                            <div style={{ width: phantom.cleanWidth }} className="bg-zinc-200/50 h-full flex items-center justify-center text-[10px] text-zinc-600 font-bold">CLN</div>
                                        </div>
                                    )}

                                    {/* Existing Showtimes */}
                                    {filteredShowtimes.filter(s => s.roomId === room.id).map(s => {
                                        const ADS = 20;
                                        const CLEAN = 15;
                                        const mDur = s.movieDuration || 120;
                                        const totalDur = ADS + mDur + CLEAN;

                                        return (
                                            <div key={s.id}
                                                className="absolute top-2 bottom-2 flex rounded shadow-sm border border-blue-200 bg-blue-100 hover:z-50 overflow-hidden group/item"
                                                style={{
                                                    left: getPosition(s.startTime),
                                                    width: getWidth(totalDur),
                                                    minWidth: '50px' // Đảm bảo không bị biến mất nếu thời gian ngắn
                                                }}
                                                onClick={(e) => { e.stopPropagation(); onShowtimeClick(s); }}
                                                onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoveredShowtime({
                                                        showtime: s,
                                                        x: rect.left + rect.width / 2, // Center horizontally relative to item
                                                        y: rect.top // Top of the item
                                                    });
                                                }}
                                                onMouseLeave={() => setHoveredShowtime(null)}
                                            >
                                                {/* 1. Phần ADS - Màu vàng (Tăng width từ 4px lên giá trị thực) */}
                                                <div style={{ width: getWidth(ADS) }} className="bg-yellow-400/80 h-full flex items-center justify-center text-[10px] font-bold text-yellow-900 border-r border-white/20">
                                                    ADS
                                                </div>

                                                {/* 2. Nội dung chính - Movie Title */}
                                                <div className="flex-1 px-2 flex flex-col justify-center overflow-hidden">
                                                    <span className="text-[11px] font-bold text-blue-900 truncate uppercase">
                                                        {s.movieTitle}
                                                    </span>
                                                    <span className="text-[10px] text-blue-700 font-medium">
                                                        {s.startTime} - {mDur}p
                                                    </span>
                                                </div>

                                                {/* 3. Phần CLEAN - Màu xám */}
                                                <div style={{ width: getWidth(CLEAN) }} className="bg-zinc-400/50 h-full flex items-center justify-center text-[10px] font-bold text-zinc-700">
                                                    CLN
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
            {/* Tooltip Portal or Fixed Layer */}
            {hoveredShowtime && (
                <div
                    className="fixed z-[100] bg-white rounded-lg shadow-xl border border-zinc-200 p-3 w-64 pointer-events-none transform -translate-x-1/2 -translate-y-[110%]"
                    style={{ left: hoveredShowtime.x, top: hoveredShowtime.y }}
                >
                    <div className="flex gap-3">
                        {/* Poster */}
                        <div className="w-16 h-24 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {hoveredShowtime.showtime.moviePosterUrl ? (
                                <img src={hoveredShowtime.showtime.moviePosterUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">No Image</div>
                            )}
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-zinc-900 line-clamp-2 leading-tight mb-1">
                                {hoveredShowtime.showtime.movieTitle}
                            </div>
                            <div className="text-xs text-zinc-500 mb-2">
                                {hoveredShowtime.showtime.movieDuration} phút
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Thời gian:</span>
                                    <span className="font-medium text-zinc-900">{hoveredShowtime.showtime.startTime.substring(0, 5)} - {hoveredShowtime.showtime.endTime.substring(0, 5)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Giá vé:</span>
                                    <span className="font-medium text-indigo-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(hoveredShowtime.showtime.basePrice)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Trạng thái:</span>
                                    <span className={`font-medium ${hoveredShowtime.showtime.status === 'AVAILABLE' ? 'text-green-600' : 'text-zinc-500'}`}>
                                        {hoveredShowtime.showtime.status === 'AVAILABLE' ? 'Sẵn sàng' : hoveredShowtime.showtime.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
