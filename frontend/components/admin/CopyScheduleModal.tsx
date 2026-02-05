'use client';

import { useState, useEffect } from 'react';
import { format, addDays, eachDayOfInterval, parseISO } from 'date-fns';
import { adminShowtimeService, adminRoomService } from '@/services/adminService';
import { useToast } from '@/components/ui/Toast';
import { Showtime, Theater, Room } from '@/types';

interface CopyScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceDate: string;
    sourceTheaterId: number;
    sourceShowtimes: Showtime[];
    theaters: Theater[];
    onSuccess: () => void;
}

export default function CopyScheduleModal({
    isOpen,
    onClose,
    sourceDate,
    sourceTheaterId,
    sourceShowtimes,
    theaters,
    onSuccess
}: CopyScheduleModalProps) {
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [targetTheaterId, setTargetTheaterId] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Initialize state when modal opens or source changes
    useEffect(() => {
        if (isOpen) {
            const nextDay = format(addDays(new Date(sourceDate), 1), 'yyyy-MM-dd');
            setFromDate(nextDay);
            setToDate(nextDay);
            setTargetTheaterId(sourceTheaterId);
        }
    }, [isOpen, sourceDate, sourceTheaterId]);

    if (!isOpen) return null;

    const handleCopy = async () => {
        if (!fromDate || !toDate) {
            toast("Vui lòng chọn khoảng thời gian", "error");
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            toast("Ngày bắt đầu không được lớn hơn ngày kết thúc", "error");
            return;
        }

        if (sourceShowtimes.length === 0) {
            toast("Không có lịch chiếu nào để sao chép", "error");
            onClose();
            return;
        }

        const confirmMsg = targetTheaterId === sourceTheaterId
            ? `Bạn có muốn sao chép đến khoảng thời gian: ${fromDate} -> ${toDate}?`
            : `Bạn có muốn sao chép đến RẠP KHÁC (${theaters.find(t => t.id === targetTheaterId)?.name}) trong khoảng: ${fromDate} -> ${toDate}?`;

        if (!confirm(confirmMsg)) return;

        setIsLoading(true);
        let successCount = 0;
        let failCount = 0;

        try {
            // 1. Prepare Target Rooms (if different theater)
            let targetRooms: Room[] = [];

            // Fetch target rooms if theater is different
            if (targetTheaterId !== sourceTheaterId) {
                targetRooms = await adminRoomService.getByTheater(targetTheaterId);
            }

            // 2. Generate Days List
            const days = eachDayOfInterval({
                start: parseISO(fromDate),
                end: parseISO(toDate)
            });

            // 3. Process
            for (const day of days) {
                const dayStr = format(day, 'yyyy-MM-dd');

                // Skip if copying to same day (though unlikely if UI defaults to next day)
                if (dayStr === sourceDate && targetTheaterId === sourceTheaterId) continue;

                const promises = sourceShowtimes.map(async (st) => {
                    let targetRoomId = st.roomId;

                    // Map Room ID if Theater is different
                    if (targetTheaterId !== sourceTheaterId) {
                        // We rely on matching Room Name.
                        // Assuming st has access to roomName. If not, we might be in trouble.
                        // However, Showtime interface usually has roomName if it comes from the view.
                        // Let's check st usage.
                        // @ts-ignore
                        const sourceRoomName = st.roomName || st.room?.name || st.roomName;
                        // Note: st comes from existingShowtimes which is fetched from getAll.
                        // getAll usually returns DTOs with roomName.

                        if (!sourceRoomName) return; // Cannot map

                        const match = targetRooms.find(r => r.name === sourceRoomName);
                        if (!match) return; // No matching room in target theater, skip

                        targetRoomId = match.id;
                    }

                    const payload = {
                        movieId: st.movieId,
                        roomId: targetRoomId,
                        theaterId: targetTheaterId,
                        showDate: dayStr,
                        startTime: st.startTime,
                        basePrice: st.basePrice,
                        status: 'AVAILABLE'
                    };

                    try {
                        // @ts-ignore
                        await adminShowtimeService.create(payload);
                        successCount++;
                    } catch (e) {
                        failCount++;
                    }
                });

                await Promise.all(promises);
            }

            toast(`Đã xử lý xong. Thành công: ${successCount}. Bỏ qua/Lỗi: ${failCount}`, "info");
            onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            toast("Lỗi hệ thống khi sao chép", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-[600px] p-6">
                <h2 className="text-xl font-bold mb-4">Sao chép Lịch Chiếu</h2>

                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded text-sm grid grid-cols-2 gap-2">
                    <div>Ngày nguồn: <strong>{sourceDate}</strong></div>
                    <div>Số lượng: <strong>{sourceShowtimes.length}</strong> suất</div>
                </div>

                <div className="space-y-4 mb-6">
                    {/* Target Theater */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Rạp đích</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={targetTheaterId}
                            onChange={(e) => setTargetTheaterId(Number(e.target.value))}
                        >
                            {theaters.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {targetTheaterId !== sourceTheaterId && (
                            <p className="text-xs text-orange-600 mt-1">Hệ thống sẽ thử tìm các phòng có CÙNG TÊN để sao chép.</p>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Từ ngày</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Đến ngày</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded"
                        disabled={isLoading}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Thực hiện Sao chép'}
                    </button>
                </div>
            </div>
        </div>
    );
}
