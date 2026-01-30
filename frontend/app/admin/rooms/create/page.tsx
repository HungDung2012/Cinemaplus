'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminRoomService } from '@/services/adminService';
import SeatGridEditor from '@/components/admin/SeatGridEditor';

export default function CreateRoomPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const theaterIdParam = searchParams.get('theaterId');

    const [name, setName] = useState('');
    const [roomType, setRoomType] = useState('STANDARD_2D');
    const [loading, setLoading] = useState(false);

    // Initial dummy data for SeatGridEditor rows/cols logic if needed,
    // but SeatGridEditor handles its own state for rows/cols.
    // We just need to capture the JSON on save.

    const handleSave = async (layoutJson: string) => {
        if (!name) {
            alert('Vui lòng nhập tên phòng');
            return;
        }
        if (!theaterIdParam) {
            alert('Thiếu thông tin rạp (theaterId)');
            return;
        }

        const layoutObj = JSON.parse(layoutJson); // SeatGridEditor returns stringified JSON
        // We need extracting rows/cols from the layout to save to DB fields
        const rowsCount = layoutObj.rows;
        const columnsCount = layoutObj.cols;

        const payload = {
            name,
            theaterId: Number(theaterIdParam),
            roomType,
            rowsCount,
            columnsCount,
            active: true,
            seatLayout: layoutJson // The backend now accepts string or object (we send string here)
        };

        setLoading(true);
        try {
            await adminRoomService.create(payload);
            alert('Tạo phòng chiếu thành công!');
            router.push(`/admin/theaters/${theaterIdParam}/rooms`); // Redirect back to room list
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Có lỗi xảy ra khi tạo phòng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Thêm Phòng Chiếu Mới</h1>
                    <p className="text-zinc-500">Thiết lập thông tin và sơ đồ ghế</p>
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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ví dụ: Phòng 01"
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                Loại phòng
                            </label>
                            <select
                                value={roomType}
                                onChange={(e) => setRoomType(e.target.value)}
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
                            <p className="font-medium mb-1">Lưu ý:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Thiết lập sơ đồ ghế ở bên phải.</li>
                                <li>Số hàng/cột sẽ được tự động cập nhật theo sơ đồ.</li>
                                <li>Ấn nút "Lưu Sơ Đồ" ở cuối để hoàn tất tạo phòng.</li>
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
                            onSave={handleSave}
                        // No roomId passed -> Create mode
                        />
                        {/* Loading Overlay */}
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                <div className="text-zinc-900 font-medium">Đang xử lý...</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
