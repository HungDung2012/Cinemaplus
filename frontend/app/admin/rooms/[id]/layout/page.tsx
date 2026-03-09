'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminRoomService } from '@/services/adminService';
import SeatGridEditor from '@/components/admin/SeatGridEditor';

export default function RoomLayoutPage() {
    const router = useRouter();
    const params = useParams();
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
            if (room.theaterId) {
                router.push(`/admin/theaters/${room.theaterId}/rooms`);
            } else {
                router.push('/admin/theaters');
            }
        } catch (error) {
            console.error('Error saving layout:', error);
            alert('Có lỗi xảy ra khi lưu sơ đồ.');
        }
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;
    if (!room) return <div className="p-8 text-center">Không tìm thấy phòng</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Cập nhật Phòng Chiếu</h1>
                    <p className="text-zinc-500">Chỉnh sửa thông tin phòng và sơ đồ ghế ({room.name})</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 font-medium"
                >
                    Hủy bỏ
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
                        <h2 className="font-semibold text-lg text-zinc-900">Thông tin cơ bản</h2>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                Tên phòng <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={room.name}
                                onChange={(e) => setRoom({ ...room, name: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                Loại phòng
                            </label>
                            <select
                                value={room.roomType}
                                onChange={(e) => setRoom({ ...room, roomType: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                            >
                                <option value="STANDARD_2D">Standard 2D</option>
                                <option value="STANDARD_3D">Standard 3D</option>
                                <option value="IMAX">IMAX</option>
                                <option value="IMAX_3D">IMAX 3D</option>
                                <option value="VIP_4DX">VIP 4DX</option>
                            </select>
                        </div>

                        <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-lg">
                            <p className="font-medium mb-1">Thống kê hiện tại:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>{room.rowsCount}</strong> hàng x <strong>{room.columnsCount}</strong> cột</li>
                                <li>Số lượng ghế: <strong>{room.totalSeats || room.seats?.length || 0}</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column: Seat Grid Editor */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm h-full">
                        <div className="mb-4">
                            <h2 className="font-semibold text-lg text-zinc-900 mb-2">Sơ đồ ghế</h2>
                            <p className="text-sm text-zinc-500">
                                Điều chỉnh số hàng/cột và click vào ghế để chọn loại ghế.
                            </p>
                        </div>

                        <SeatGridEditor
                            roomId={roomId}
                            onSave={handleSaveLayout}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
