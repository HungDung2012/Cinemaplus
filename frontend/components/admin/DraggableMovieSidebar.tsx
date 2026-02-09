"use client";

import { Movie, Showtime } from "@/types";
import { useState } from "react";

interface DraggableMovieSidebarProps {
    movies: Movie[];
    onDeleteShowtime?: (showtimeId: number) => void;
}

export default function DraggableMovieSidebar({ movies, onDeleteShowtime }: DraggableMovieSidebarProps) {
    const [search, setSearch] = useState("");
    const [isTrashActive, setIsTrashActive] = useState(false);

    const filteredMovies = movies.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleDragStart = (e: React.DragEvent, movie: Movie) => {
        e.dataTransfer.setData("application/json", JSON.stringify({
            type: "MOVIE",
            movieId: movie.id,
            duration: movie.duration,
            title: movie.title
        }));
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <div className="w-64 bg-white border-r border-zinc-200 flex flex-col h-full">
            <div className="p-4 border-b border-zinc-200">
                <h3 className="font-bold text-zinc-900 mb-2">Phim đang chiếu</h3>
                <input
                    type="text"
                    placeholder="Tìm phim..."
                    className="w-full px-3 py-2 border rounded text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredMovies.map(movie => (
                    <div
                        key={movie.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, movie)}
                        className="p-3 bg-zinc-50 border border-zinc-200 rounded cursor-grab hover:border-indigo-500 hover:shadow-sm active:cursor-grabbing transition-all group"
                    >
                        <div className="flex gap-3">
                            <div className="w-10 h-14 bg-zinc-200 rounded overflow-hidden flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {movie.posterUrl && <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-zinc-900 line-clamp-2 leading-tight group-hover:text-indigo-600">
                                    {movie.title}
                                </div>
                                <div className="text-xs text-zinc-500 mt-1">{movie.duration} phút</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Trash Can Drop Zone */}
            <div
                className={`p-4 border-t border-zinc-200 transition-colors ${isTrashActive ? 'bg-red-50 border-red-200' : 'bg-white'}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsTrashActive(true);
                    e.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={() => setIsTrashActive(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsTrashActive(false);
                    try {
                        const data = JSON.parse(e.dataTransfer.getData("application/json"));
                        if (data.type === "SHOWTIME" && onDeleteShowtime) {
                            // Confirm or just delete? Quick delete expected.
                            // execute async to avoid blocking
                            setTimeout(() => {
                                onDeleteShowtime(data.showtime.id);
                            }, 0);
                        }
                    } catch (err) { console.error(err); }
                }}
            >
                <div className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-all ${isTrashActive ? 'border-red-400 text-red-600 bg-red-100' : 'border-zinc-300 text-zinc-400'}`}>
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider">Kéo vào đây để xóa</span>
                </div>
            </div>
        </div>
    );
}
