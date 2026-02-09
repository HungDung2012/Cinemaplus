"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { format, addDays, isValid, parse } from "date-fns";
import React from "react";
import ShowtimeTimeline from "./ShowtimeTimeline";
import DraggableMovieSidebar from '@/components/admin/DraggableMovieSidebar';
import { adminMovieService, adminRoomService, adminShowtimeService, adminTheaterService } from '@/services/adminService';
import { useToast } from '@/components/ui/Toast';
import CopyScheduleModal from './CopyScheduleModal';
import { useRouter } from 'next/navigation';

// --- Types ---
import { Showtime, Movie, Theater, Room } from '@/types';
import { movieService } from "@/services";

export default function CreateShowtimeForm() {
    const router = useRouter();
    // --- State ---
    const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    const [selectedTheaterId, setSelectedTheaterId] = useState<number>(0);

    const [movies, setMovies] = useState<Movie[]>([]);
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Server state (reference)
    const [serverShowtimes, setServerShowtimes] = useState<Showtime[]>([]);
    // Local state (displayed)
    const [localShowtimes, setLocalShowtimes] = useState<Showtime[]>([]);

    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Pending Changes Tracking
    const [pendingCreates, setPendingCreates] = useState<any[]>([]);
    const [pendingUpdates, setPendingUpdates] = useState<Record<number, any>>({});
    const [pendingDeletes, setPendingDeletes] = useState<Set<number>>(new Set());
    const [isDirty, setIsDirty] = useState(false);

    // Copy Schedule Modal
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    // --- Fetch Initial Data (Theaters & Movies) ---
    useEffect(() => {
        const init = async () => {
            try {
                const [mRes, tRes] = await Promise.all([
                    movieService.getNowShowingMovies(),
                    adminTheaterService.getAll()
                ]);
                setMovies(mRes || []);
                setTheaters(Array.isArray(tRes) ? tRes : []);
            } catch (e) { console.error("Init Error", e); }
        };
        init();
    }, []);

    // --- Fetch Rooms & Schedule when Filters Change ---
    useEffect(() => {
        if (!selectedTheaterId || !selectedDate) return;
        fetchSchedule();
    }, [selectedTheaterId, selectedDate]);

    const fetchSchedule = async () => {
        if (!selectedTheaterId || !selectedDate) return;
        setLoading(true);
        try {
            // 1. Fetch Rooms
            const rRes = await adminRoomService.getByTheater(selectedTheaterId);
            setRooms(rRes || []);

            // 2. Fetch Showtimes
            const sRes = await adminShowtimeService.getAll({
                theaterIds: [selectedTheaterId.toString()],
                startDate: selectedDate,
                endDate: selectedDate,
                size: 2000
            });
            const fetched = sRes.content || sRes || [];
            setServerShowtimes(fetched);
            setLocalShowtimes(fetched);

            // Reset pending
            setPendingCreates([]);
            setPendingUpdates({});
            setPendingDeletes(new Set());
            setIsDirty(false);

        } catch (e) { console.error("Filter Fetch Error", e); }
        finally { setLoading(false); }
    };

    // --- Handlers (Local State Only) ---

    const handleCreateShowtime = async (movieId: number, roomId: number, startTime: string) => {
        const movie = movies.find(m => m.id === movieId);
        const room = rooms.find(r => r.id === roomId);
        if (!movie || !room || !selectedDate) return;

        let price = 60000;
        if (room.roomType === 'VIP_4DX' || room.roomType === 'STANDARD_3D') price = 80000;
        if (room.roomType === 'IMAX' || room.roomType === 'IMAX_3D') price = 100000;

        // Create Temp ID (negative)
        const tempId = -Date.now();

        const newShowtime: any = {
            id: tempId,
            movieId,
            movieTitle: movie.title,
            moviePosterUrl: movie.posterUrl,
            movieDuration: movie.duration,
            roomId,
            roomName: room.name,
            theaterId: room.theaterId,
            showDate: selectedDate,
            startTime,
            endTime: "00:00", // Not critical for display if timeline calculates it, but better to estimate
            basePrice: price,
            status: 'AVAILABLE'
        };

        const payload = {
            movieId,
            roomId,
            theaterId: room.theaterId,
            showDate: selectedDate,
            startTime,
            basePrice: price,
            status: 'AVAILABLE'
        };

        // Update Local State
        setLocalShowtimes(prev => [...prev, newShowtime]);

        // Track Change
        setPendingCreates(prev => [...prev, { tempId, payload }]);
        setIsDirty(true);
    };

    const handleUpdateShowtime = async (showtime: Showtime, newRoomId: number, newStartTime: string) => {
        if (showtime.roomId === newRoomId && showtime.startTime === newStartTime) return;

        const room = rooms.find(r => r.id === newRoomId);
        if (!room) return;

        // Update Local State
        setLocalShowtimes(prev => prev.map(s => {
            if (s.id === showtime.id) {
                return { ...s, roomId: newRoomId, startTime: newStartTime, roomName: room.name };
            }
            return s;
        }));

        // Track Change
        setIsDirty(true);

        // If it's a temp item (newly created), update the pending create payload
        if (showtime.id < 0) {
            setPendingCreates(prev => prev.map(p => {
                if (p.tempId === showtime.id) {
                    return { ...p, payload: { ...p.payload, roomId: newRoomId, startTime: newStartTime } };
                }
                return p;
            }));
        } else {
            // It's a server item
            const payload = {
                movieId: showtime.movieId,
                roomId: newRoomId,
                theaterId: room.theaterId,
                showDate: showtime.showDate,
                startTime: newStartTime,
                basePrice: showtime.basePrice,
                status: showtime.status
            };
            setPendingUpdates(prev => ({ ...prev, [showtime.id]: payload }));
        }
    };

    const handleDeleteShowtime = async (showtimeId: number) => {
        // Update Local State
        setLocalShowtimes(prev => prev.filter(s => s.id !== showtimeId));
        setIsDirty(true);

        // Track Change
        if (showtimeId < 0) {
            // It was a temp create, just remove from pending creates
            setPendingCreates(prev => prev.filter(p => p.tempId !== showtimeId));
        } else {
            // It was server item, mark for delete
            // Also remove from pending updates if any
            if (pendingUpdates[showtimeId]) {
                const { [showtimeId]: _, ...rest } = pendingUpdates;
                setPendingUpdates(rest);
            }
            setPendingDeletes(prev => new Set(prev).add(showtimeId));
        }
    };

    const handleSaveChanges = async () => {
        if (!confirm("Bạn có chắc muốn lưu các thay đổi này không?")) return;
        setLoading(true);
        let errors = 0;

        try {
            // 1. Process Deletes
            const deletes = Array.from(pendingDeletes);
            await Promise.all(deletes.map(async (id) => {
                try { await adminShowtimeService.delete(id); } catch (e) { errors++; }
            }));

            // 2. Process Updates
            const updates = Object.entries(pendingUpdates);
            await Promise.all(updates.map(async ([id, payload]) => {
                try { await adminShowtimeService.update(Number(id), payload); } catch (e) { errors++; }
            }));

            // 3. Process Creates
            await Promise.all(pendingCreates.map(async (item) => {
                try { await adminShowtimeService.create(item.payload); } catch (e) { errors++; }
            }));

            if (errors === 0) {
                toast("Lưu thành công", "success");
                fetchSchedule(); // Refresh from server
            } else {
                toast(`Lưu hoàn tất nhưng có ${errors} lỗi. Vui lòng kiểm tra lại.`, "info");
                fetchSchedule(); // Refresh to match server state
            }

        } catch (error) {
            console.error(error);
            toast("Lỗi hệ thống khi lưu", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (room: Room, time: string) => {
        toast("Vui lòng kéo thả phim từ danh sách bên trái vào ô trống", "info");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">

            {/* 1. Top Bar: Filters & Actions */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-zinc-200 flex flex-wrap gap-4 items-end justify-between">

                <div className="flex gap-4 items-end flex-1">
                    {/* Back Button */}
                    <button
                        onClick={() => router.push('/admin/showtimes')}
                        className="p-2 text-zinc-500 hover:text-zinc-800 border border-zinc-200 rounded hover:bg-zinc-50"
                        title="Quay lại danh sách"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Ngày chiếu</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Chuyển ngày sẽ mất thay đổi?")) return;
                                setSelectedDate(e.target.value);
                            }}
                            className="px-3 py-2 border rounded-md text-sm font-medium w-40"
                        />
                    </div>

                    {/* Theater */}
                    <div className="flex-1 min-w-[200px] max-w-sm">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Rạp (Theater)</label>
                        <select
                            value={selectedTheaterId}
                            onChange={(e) => {
                                if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Chuyển rạp sẽ mất thay đổi?")) return;
                                setSelectedTheaterId(Number(e.target.value));
                            }}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                            <option value="0">-- Chọn rạp --</option>
                            {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => fetchSchedule()}
                        className="px-4 py-2 border border-blue-200 text-blue-600 font-semibold rounded-md text-sm hover:bg-blue-50 h-[38px]"
                        disabled={loading}
                    >
                        Làm mới
                    </button>

                    {/* Copy Button */}
                    <button
                        onClick={() => setIsCopyModalOpen(true)}
                        className="px-4 py-2 border border-zinc-300 text-zinc-700 font-semibold rounded-md text-sm hover:bg-zinc-50 h-[38px] flex items-center gap-2"
                        title="Sao chép lịch chiếu hiện tại sang ngày khác"
                        disabled={loading || !selectedTheaterId}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 01-2-2V4a1 1 0 012-2h14a1 1 0 012 2v10a1 1 0 01-2 2h-3" /></svg>
                        Sao chép
                    </button>

                    {/* SAVE BUTTON */}
                    <button
                        onClick={handleSaveChanges}
                        className={`px-6 py-2 font-bold rounded-md text-sm h-[38px] flex items-center gap-2 shadow-sm transition-all
                            ${isDirty
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-md transform hover:-translate-y-0.5'
                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                        disabled={!isDirty || loading}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                </div>
            </div>

            {/* 2. Main Timeline Area with Sidebar */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden relative flex">
                <DraggableMovieSidebar movies={movies} onDeleteShowtime={handleDeleteShowtime} />

                <div className="flex-1 relative overflow-hidden">
                    {selectedTheaterId ? (
                        <>
                            <ShowtimeTimeline
                                rooms={rooms}
                                showtimes={localShowtimes}
                                date={selectedDate}
                                onShowtimeClick={(st) => console.log("Edit showtime", st)}
                                interactiveMode={true}
                                onSlotClick={handleSlotClick}
                                onCreateShowtime={handleCreateShowtime}
                                onShowtimeUpdate={handleUpdateShowtime}
                            />
                            {/* Modals */}
                            <CopyScheduleModal
                                isOpen={isCopyModalOpen}
                                onClose={() => setIsCopyModalOpen(false)}
                                sourceDate={selectedDate}
                                sourceTheaterId={selectedTheaterId}
                                sourceShowtimes={serverShowtimes} // Pass SERVER state to copy to avoid copying unsaved temp items easily
                                theaters={theaters}
                                onSuccess={() => {
                                    setIsCopyModalOpen(false);
                                    fetchSchedule();
                                }}
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-400 italic">
                            Vui lòng chọn Rạp để xem lịch chiếu
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
