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
    // DnD Callbacks
    onShowtimeUpdate?: (showtime: Showtime, newRoomId: number, newStartTime: string) => Promise<void>;
    onCreateShowtime?: (movieId: number, roomId: number, startTime: string) => Promise<void>;
}

export default function ShowtimeTimeline({
    rooms,
    showtimes,
    interactiveMode,
    selectedMovie,
    onShowtimeUpdate,
    onCreateShowtime,
    date
}: ShowtimeTimelineProps) {
    const START_HOUR = 8;
    const END_HOUR = 28; // Extend to 04:00 AM next day
    const PIXELS_PER_MINUTE = 2.5;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const TOTAL_WIDTH = TOTAL_HOURS * 60 * PIXELS_PER_MINUTE;
    const HEADER_HEIGHT = 40;
    const ROW_HEIGHT = 80;

    const [hoverState, setHoverState] = useState<{ roomId: number, timeStr: string, left: number } | null>(null);
    const [hoveredShowtime, setHoveredShowtime] = useState<{ showtime: Showtime, x: number, y: number } | null>(null);
    const [dragState, setDragState] = useState<{
        type: 'MOVIE' | 'SHOWTIME',
        id: number,
        duration: number,
        title: string
    } | null>(null);

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
        // Handle overlapping midnight times (e.g. 00:00, 01:00 should be treated as 24, 25 for positioning if they belong to this session)
        // Ideally backend returns specific date, but here we simplify: 
        // If time is 00:00 - 04:00, we treat it as next day (add 24h) IF currently mapped in a late slot

        // HOWEVER, s.startTime usually comes as "HH:mm:ss".
        // Simple heuristic: If hour < START_HOUR (8), add 24.
        let hour = h;
        if (hour < START_HOUR) hour += 24;

        const minutesFromStart = (hour - START_HOUR) * 60 + m;
        return Math.max(0, minutesFromStart) * PIXELS_PER_MINUTE;
    };

    const getWidth = (mins: number) => mins * PIXELS_PER_MINUTE;

    const getTimeFromX = (x: number) => {
        const minutesFromStart = x / PIXELS_PER_MINUTE;
        const totalMinutes = minutesFromStart + (START_HOUR * 60);

        let h = Math.floor(totalMinutes / 60);
        let m = Math.floor(totalMinutes % 60);

        // Snap to 5 minutes
        m = Math.round(m / 5) * 5;
        if (m === 60) { m = 0; h += 1; }

        // Wrap for display string (24:00 -> 00:00)
        const displayH = h >= 24 ? h - 24 : h;

        return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // Phantom Calculations (Use dragging state if active, else hover)
    const phantom = useMemo(() => {
        const ADS = 20;
        const CLEAN = 15;
        // Prioritize drag duration, if not check selectedMovie (hover mode)
        const duration = dragState ? dragState.duration : (selectedMovie?.duration || 120);
        const totalDur = ADS + duration + CLEAN;

        const width = getWidth(totalDur);

        // Conflict Detection
        // Calculate Time Range
        if (!hoverState) return null; // Add safety check

        const startMin = hoverState.left / PIXELS_PER_MINUTE + (START_HOUR * 60);
        const endMin = startMin + totalDur;

        // Find overlaps in the SAME room
        // If "dragState.id" is present, we must EXCLUDE it from conflict check (moving self is not conflict with self)
        const isConflict = showtimes.some(s => {
            // 1. Must be same room
            if (s.roomId !== hoverState.roomId) return false;
            // 2. Ignore self (if dragging existing showtime)
            if (dragState && dragState.type === 'SHOWTIME' && s.id === dragState.id) return false;
            if (!dragState && !selectedMovie) return false; // Safety

            // 3. Time Overlap Check
            // Parse s.startTime -> minutes
            const [h, m] = s.startTime.split(':').map(Number);
            let sH = h;
            if (sH < START_HOUR) sH += 24; // Handle visual position for late shows

            const sStart = (sH - START_HOUR) * 60 + m;
            const sDur = (s.movieDuration || 120) + 20 + 15; // ADS + CLEAN approx or real
            const sEnd = sStart + sDur;

            return (startMin < sEnd && endMin > sStart);
        });

        return {
            width,
            adsWidth: getWidth(ADS),
            movieWidth: getWidth(duration),
            cleanWidth: getWidth(CLEAN),
            left: hoverState.left,
            title: dragState ? dragState.title : selectedMovie?.title,
            isConflict
        };
    }, [selectedMovie, hoverState, dragState, showtimes]);

    // Filter showtimes for the specific date if provided
    // If showtime.showDate exists, compare it. If not, assume it belongs (backward compat).
    const filteredShowtimes = useMemo(() => {
        if (!date) return showtimes;
        return showtimes.filter(s => !s.showDate || s.showDate === date);
    }, [showtimes, date]);

    // Total Height
    const totalHeight = HEADER_HEIGHT + (rooms.length * ROW_HEIGHT) + (sortedTheaterNames.length * 30);
    const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

    const handleDragOver = (e: React.DragEvent, room: Room) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const timeStr = getTimeFromX(x);

        // When dragging, we might get "25:00" from internal calcs if we don't normalize, 
        // but `getTimeFromX` normalizes to "01:00".
        // `getPosition` expects "01:00" and converts back to > 24h pixel/minute logic.
        const snappedLeft = getPosition(timeStr);

        if (!dragState) {
            setDragState({ type: 'MOVIE', id: 0, duration: 120, title: 'New Showtime' });
        }

        setHoverState({ roomId: room.id, timeStr, left: snappedLeft });
    };

    const handleDrop = async (e: React.DragEvent, room: Room) => {
        e.preventDefault();
        setHoverState(null);
        setDragState(null);

        try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const timeStr = getTimeFromX(x);

            if (data.type === "MOVIE") {
                if (onCreateShowtime) {
                    await onCreateShowtime(data.movieId, room.id, timeStr);
                }
            } else if (data.type === "SHOWTIME") {
                if (onShowtimeUpdate && data.showtime) {
                    await onShowtimeUpdate(data.showtime, room.id, timeStr);
                }
            }
        } catch (error) {
            console.error("Drop error", error);
        }
    };

    return (
        <div className=" inset-0 overflow-auto bg-white select-none">
            <div style={{ width: `${Math.max(1000, 160 + TOTAL_WIDTH)}px`, height: `${totalHeight}px` }}>

                {/* Header */}
                <div className="flex sticky top-0 bg-zinc-50 border-b border-zinc-200 z-[60]" style={{ height: HEADER_HEIGHT }}>
                    <div className="sticky z-[70] left-0 w-40 bg-zinc-50 border-r border-zinc-200 p-2 text-xs font-semibold text-zinc-500 flex items-center justify-center shadow-[4px_0_4px_-2px_rgba(0,0,0,0.05)]">
                        Phòng / Thời gian
                    </div>
                    <div className="relative flex-1">
                        {hours.map(h => {
                            const displayH = h >= 24 ? h - 24 : h;
                            return (
                                <div key={h} className="absolute border-l border-zinc-200 text-xs text-zinc-400 pl-1 pt-1"
                                    style={{ left: getWidth((h - START_HOUR) * 60) }}>
                                    {displayH.toString().padStart(2, '0')}:00
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Body */}
                {sortedTheaterNames.map(tName => (
                    <React.Fragment key={tName}>
                        <div className="sticky left-0 z-[65] w-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 uppercase border-b border-zinc-200 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
                            <span className="sticky left-3">
                                {tName}
                            </span>
                        </div>
                        {roomsByTheater[tName].map(room => (
                            <div key={room.id} className="flex border-b border-zinc-100 h-[80px] relative group z-10">
                                {/* Room Name */}
                                <div className="sticky left-0 w-40 flex-shrink-0 bg-white border-r border-zinc-200 p-3 flex flex-col justify-center z-[60] shadow-[4px_0_4px_-2px_rgba(0,0,0,0.05)]">
                                    <div className="font-semibold text-zinc-900 text-sm">{room.name}</div>
                                    <div className="text-xs text-zinc-500">{room.roomType}</div>
                                </div>

                                {/* Timeline Area */}
                                <div className="relative flex-1 cursor-crosshair"
                                    onDragOver={(e) => handleDragOver(e, room)}
                                    onDrop={(e) => handleDrop(e, room)}
                                >
                                    {/* Grid Lines */}
                                    {hours.map(h => (
                                        <div key={h} className="absolute top-0 bottom-0 border-l border-zinc-100"
                                            style={{ left: getWidth((h - START_HOUR) * 60) }} />
                                    ))}

                                    {/* Phantom Block (Hover or Drag) */}
                                    {interactiveMode && phantom && hoverState?.roomId === room.id && (
                                        <div
                                            className={`absolute top-2 bottom-2 rounded opacity-80 pointer-events-none flex overflow-hidden z-20 animate-pulse ring-2 ${phantom.isConflict
                                                ? 'ring-red-500 bg-red-100' // Red if conflict
                                                : dragState ? 'ring-green-500 bg-green-50' : 'ring-blue-400'
                                                }`}
                                            style={{ left: phantom.left, width: phantom.width }}
                                        >
                                            <div style={{ width: phantom.adsWidth }} className="bg-yellow-200/50 h-full flex items-center justify-center text-[10px] text-yellow-800 font-bold border-r border-white/30 truncate">ADS</div>
                                            <div style={{ width: phantom.movieWidth }} className={`h-full flex items-center justify-center text-[10px] font-bold border-r border-white/30 truncate px-1 ${phantom.isConflict ? 'text-red-800 bg-red-200/50' : 'text-blue-800 bg-blue-200/50'
                                                }`}>
                                                {phantom.title} ({hoverState.timeStr})
                                            </div>
                                            <div style={{ width: phantom.cleanWidth }} className="bg-zinc-200/50 h-full flex items-center justify-center text-[10px] text-zinc-600 font-bold truncate">CLN</div>
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
                                                draggable
                                                onDragStart={(e) => {
                                                    // Set drag data
                                                    e.dataTransfer.setData("application/json", JSON.stringify({
                                                        type: "SHOWTIME",
                                                        showtime: s,
                                                        duration: totalDur // Approximation
                                                    }));
                                                    // Set local drag state for phantom
                                                    setDragState({
                                                        type: 'SHOWTIME',
                                                        id: s.id,
                                                        duration: s.movieDuration,
                                                        title: s.movieTitle
                                                    });
                                                }}
                                                onDragEnd={() => {
                                                    setDragState(null);
                                                    setHoverState(null);
                                                }}
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
                                    <span className="text-zinc-500">Quảng cáo:</span>
                                    <span className="font-medium text-zinc-900">20 phút</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Dọn phòng:</span>
                                    <span className="font-medium text-zinc-900">15 phút</span>
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
