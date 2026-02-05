"use client";

import { useEffect, useState, useMemo } from "react";
import { format, addDays, isValid, parse } from "date-fns";
import React from "react";
import ShowtimeTimeline from "./ShowtimeTimeline"; // We will upgrade this component next

import DraggableMovieSidebar from '@/components/admin/DraggableMovieSidebar';
import { adminMovieService, adminRoomService, adminShowtimeService, adminTheaterService } from '@/services/adminService';
import { useToast } from '@/components/ui/Toast';
import CopyScheduleModal from './CopyScheduleModal';

// --- Types ---
import { Showtime, Movie, Theater, Room } from '@/types';

export default function CreateShowtimeForm() {
    // --- State ---
    const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    const [selectedTheaterId, setSelectedTheaterId] = useState<number>(0);

    const [movies, setMovies] = useState<Movie[]>([]);
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [existingShowtimes, setExistingShowtimes] = useState<Showtime[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Copy Schedule Modal
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    // For Quick Create Modal (future)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingSlot, setPendingSlot] = useState<{ roomId: number, time: string } | null>(null);

    // --- Fetch Initial Data (Theaters & Movies) ---
    useEffect(() => {
        const init = async () => {
            try {
                const [mRes, tRes] = await Promise.all([
                    adminMovieService.getAll({ size: 1000 }),
                    adminTheaterService.getAll()
                ]);
                setMovies(mRes.content || mRes || []);
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
        try {
            // 1. Fetch Rooms
            const rRes = await adminRoomService.getByTheater(selectedTheaterId);
            setRooms(rRes || []);

            // 2. Fetch Showtimes
            // The service might expect different params, adjusting to standard service call
            const sRes = await adminShowtimeService.getAll({
                theaterIds: [selectedTheaterId.toString()],
                startDate: selectedDate,
                endDate: selectedDate,
                size: 2000
            });
            setExistingShowtimes(sRes.content || []);
        } catch (e) { console.error("Filter Fetch Error", e); }
    };


    // --- Handlers ---
    // --- Handlers ---
    const handleCreateShowtime = async (movieId: number, roomId: number, startTime: string) => {
        const movie = movies.find(m => m.id === movieId);
        const room = rooms.find(r => r.id === roomId);
        if (!movie || !room || !selectedDate) return;

        let price = 60000;
        if (room.roomType === 'VIP_4DX' || room.roomType === 'STANDARD_3D') price = 80000;
        if (room.roomType === 'IMAX' || room.roomType === 'IMAX_3D') price = 100000;

        const payload = {
            movieId,
            roomId,
            theaterId: room.theaterId,
            showDate: selectedDate,
            startTime,
            basePrice: price,
            status: 'AVAILABLE'
        };

        setLoading(true);
        try {
            // @ts-ignore
            await adminShowtimeService.create(payload);
            toast(`Đã tạo lịch chiếu: ${movie.title}`, "success");
            fetchSchedule();
        } catch (error: any) {
            console.error(error);
            toast(error.response?.data?.message || "Lỗi tạo lịch chiếu", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateShowtime = async (showtime: Showtime, newRoomId: number, newStartTime: string) => {
        if (showtime.roomId === newRoomId && showtime.startTime === newStartTime) return;

        const room = rooms.find(r => r.id === newRoomId);
        if (!room) return;

        const payload = {
            movieId: showtime.movieId,
            roomId: newRoomId,
            theaterId: room.theaterId,
            showDate: showtime.showDate,
            startTime: newStartTime,
            basePrice: showtime.basePrice,
            status: showtime.status
        };

        setLoading(true);
        try {
            await adminShowtimeService.update(showtime.id, payload);
            toast("Cập nhật thành công", "success");
            fetchSchedule();
        } catch (error: any) {
            toast(error.response?.data?.message || "Lỗi cập nhật", "error");
            fetchSchedule(); // Revert
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteShowtime = async (showtimeId: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa lịch chiếu này?")) return;

        try {
            await adminShowtimeService.delete(showtimeId);
            toast("Đã xóa lịch chiếu", "success");
            fetchSchedule();
        } catch (error) {
            toast("Không thể xóa", "error");
        }
    };

    const handleSlotClick = (room: Room, time: string) => {
        toast("Vui lòng kéo thả phim từ danh sách bên trái vào ô trống", "info");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] gap-4">

            {/* 1. Top Bar: Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-zinc-200 flex flex-wrap gap-4 items-end">
                {/* Date */}
                <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Ngày chiếu</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm font-medium w-40"
                    />
                </div>

                {/* Theater */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Rạp (Theater)</label>
                    <select
                        value={selectedTheaterId}
                        onChange={(e) => setSelectedTheaterId(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="0">-- Chọn rạp --</option>
                        {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                {/* Search / Refresh Button */}
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchSchedule()}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md text-sm hover:bg-blue-700 h-[38px]"
                    >
                        Làm mới
                    </button>
                    {/* Copy Button */}
                    <button
                        onClick={() => setIsCopyModalOpen(true)}
                        className="px-4 py-2 border border-zinc-300 text-zinc-700 font-semibold rounded-md text-sm hover:bg-zinc-50 h-[38px] flex items-center gap-2"
                        title="Sao chép lịch chiếu hiện tại sang ngày khác"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 01-2-2V4a1 1 0 012-2h14a1 1 0 012 2v10a1 1 0 01-2 2h-3" /></svg>
                        Sao chép Lịch
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
                                showtimes={existingShowtimes}
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
                                sourceShowtimes={existingShowtimes}
                                theaters={theaters}
                                onSuccess={() => setIsCopyModalOpen(false)}
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
