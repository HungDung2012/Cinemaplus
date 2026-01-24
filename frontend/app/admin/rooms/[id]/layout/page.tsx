'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminRoomService } from '@/services/adminService';
import SeatGridEditor from '@/components/admin/SeatGridEditor';

export default function RoomLayoutPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const roomId = Number(params.id);
    const [room, setRoom] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoom();
    }, [roomId]);

    const fetchRoom = async () => {
        try {
            const data = await adminRoomService.getById(roomId);
            setRoom(data);
        } catch (error) {
            console.error('Error fetching room:', error);
            alert('Không thể tải thông tin phòng.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLayout = async (layoutJson: string) => {
        try {
            await adminRoomService.update(roomId, { ...room, seatLayout: layoutJson });
            alert('Cập nhật sơ đồ ghế thành công!');
            router.push('/admin/theaters'); // Or back to room list
        } catch (error) {
            console.error('Error saving layout:', error);
            alert('Có lỗi xảy ra khi lưu sơ đồ.');
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!room) return <div className="p-8 text-center">Không tìm thấy phòng</div>;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Thiết lập Sơ đồ ghế</h1>
                    <p className="text-zinc-500">
                        Phòng: {room.name} ({room.rowsCount} hàng x {room.columnsCount} cột)
                    </p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200"
                >
                    Quay lại
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                <SeatGridEditor
                    initialLayout={room.seatLayout}
                    rows={room.rowsCount || 10}
                    cols={room.columnsCount || 10}
                    onSave={handleSaveLayout}
                />
            </div>
        </div>
    );
}
