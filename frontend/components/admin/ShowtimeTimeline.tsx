'use client';

import React, { useRef, useState, useMemo } from 'react';

interface Movie {
    id: number;
    title: string;
    duration: number;
}

interface Showtime {
    id: number;
    movieTitle: string;
    movieDuration: number;
    startTime: string; // HH:mm:ss
    endTime: string;
    roomId: number;
    showDate?: string; // Date string yyyy-MM-dd
}

interface Room {
    id: number;
    name: string;
    roomType: string;
    theaterName?: string;
    theaterId?: number;
}

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
        <div className="absolute inset-0 overflow-auto bg-white select-none">
            <div style={{ width: `${Math.max(1000, 160 + TOTAL_WIDTH)}px`, height: `${totalHeight}px` }}>

                {/* Header */}
                <div className="flex sticky top-0 bg-zinc-50 border-b border-zinc-200 z-30" style={{ height: HEADER_HEIGHT }}>
                    <div className="sticky left-0 w-40 bg-zinc-50 border-r border-zinc-200 p-2 text-xs font-semibold text-zinc-500 flex items-center justify-center shadow-[4px_0_4px_-2px_rgba(0,0,0,0.05)]">
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
                                        const ADS = 20; const CLEAN = 15;
                                        const mDur = s.movieDuration || 120; // Fallback
                                        const dur = ADS + mDur + CLEAN;

                                        // Calculate exact widths for the thin bars
                                        const adsWidth = getWidth(ADS);
                                        const cleanWidth = getWidth(CLEAN);

                                        return (
                                            <div key={s.id}
                                                className="absolute top-2 bottom-2 flex rounded overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-shadow bg-blue-50 border border-blue-100 hover:z-50 group"
                                                style={{ left: getPosition(s.startTime), width: getWidth(dur) }}
                                                onClick={(e) => { e.stopPropagation(); onShowtimeClick(s); }}
                                                title={`${s.movieTitle} (${s.startTime})`}
                                            >
                                                {/* Thin ADS Bar */}
                                                <div style={{ width: 4 }} className="bg-yellow-300 h-full flex-shrink-0" />

                                                {/* Main Content */}
                                                <div className="flex-1 px-2 py-1 text-xs text-blue-900 font-medium truncate relative flex items-center">
                                                    {s.movieTitle || 'Showtime'}
                                                </div>

                                                {/* Thin CLEAN Bar */}
                                                <div style={{ width: 4 }} className="bg-zinc-300 h-full flex-shrink-0" />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
