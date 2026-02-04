"use client";

import { useEffect, useState, useMemo } from "react";
import { format, addDays, isValid, parse } from "date-fns";
import React from "react";
import ShowtimeTimeline from "./ShowtimeTimeline"; // We will upgrade this component next

// --- Types ---
import { Showtime, Movie, Theater, Room } from '@/types';

interface TicketPrice {
    id: number;
    name: string;
    basePrice: number;
}

export default function CreateShowtimeForm() {
    // --- State ---
    const [selectedDate, setSelectedDate] = useState<string>(format(addDays(new Date(), 1), "yyyy-MM-dd"));
    const [selectedTheaterId, setSelectedTheaterId] = useState<number>(0);
    const [selectedMovieId, setSelectedMovieId] = useState<number>(0);

    const [movies, setMovies] = useState<Movie[]>([]);
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [existingShowtimes, setExistingShowtimes] = useState<Showtime[]>([]);

    // For Quick Create Modal (future)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingSlot, setPendingSlot] = useState<{ roomId: number, time: string } | null>(null);

    // --- Fetch Initial Data (Theaters & Movies) ---
    useEffect(() => {
        const init = async () => {
            try {
                // Movies
                const mRes = await fetch("/api/movies?size=1000");
                const mJson = await mRes.json();
                if (mJson.data && mJson.data.content) setMovies(mJson.data.content);
                else if (Array.isArray(mJson.data)) setMovies(mJson.data);

                // Theaters
                const tRes = await fetch("/api/theaters");
                const tJson = await tRes.json();
                if (tJson.data) setTheaters(tJson.data);

            } catch (e) { console.error("Init Error", e); }
        };
        init();
    }, []);

    // --- Fetch Rooms & Schedule when Filters Change ---
    useEffect(() => {
        if (!selectedTheaterId || !selectedDate) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Rooms for Theater
                const rRes = await fetch(`/api/rooms/theater/${selectedTheaterId}`);
                const rJson = await rRes.json();
                const fetchedRooms = rJson.data || [];
                setRooms(fetchedRooms);

                // 2. Fetch Showtimes for Theater & Date
                const sRes = await fetch(`/api/showtimes/theater/${selectedTheaterId}/date/${selectedDate}`);
                const sJson = await sRes.json();
                setExistingShowtimes(sJson.data || []);

            } catch (e) { console.error("Filter Fetch Error", e); }
        };
        fetchData();
    }, [selectedTheaterId, selectedDate]);


    // --- Handlers ---
    const handleSlotClick = (room: Room, time: string) => {
        if (!selectedMovieId) {
            alert("Vui lòng chọn phim trước khi đặt lịch!");
            return;
        }
        console.log("Clicked slot:", room.name, time);
        setPendingSlot({ roomId: room.id, time });
        // Here we would open the confirmation modal or quick create
        // match implementation plan: Open "Create Modal" pre-filled
    };

    const selectedMovie = movies.find(m => m.id === selectedMovieId);

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

                {/* Movie (For Quick Add) */}
                <div className="flex-1 min-w-[300px]">
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Phim (Để đặt lịch nhanh)</label>
                    <select
                        value={selectedMovieId}
                        onChange={(e) => setSelectedMovieId(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        style={{ borderLeft: selectedMovieId ? "4px solid #3b82f6" : "" }}
                    >
                        <option value="0">-- Chọn phim để đặt --</option>
                        {movies.map(m => (
                            <option key={m.id} value={m.id}>{m.title} ({m.duration}p)</option>
                        ))}
                    </select>
                </div>

                {/* Search / Refresh Button */}
                <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md text-sm hover:bg-blue-700 h-[38px]">
                    Làm mới
                </button>
            </div>

            {/* 2. Main Timeline Area */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden relative">
                {selectedTheaterId ? (
                    <ShowtimeTimeline
                        rooms={rooms}
                        showtimes={existingShowtimes}
                        date={selectedDate}
                        onShowtimeClick={(st) => console.log("Edit showtime", st)}
                        // New Props for Interactive Mode
                        interactiveMode={true}
                        selectedMovie={selectedMovie}
                        onSlotClick={handleSlotClick}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 italic">
                        Vui lòng chọn Rạp để xem lịch chiếu
                    </div>
                )}
            </div>

        </div>
    );
}
