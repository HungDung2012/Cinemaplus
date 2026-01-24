'use client';

import { useState, useEffect } from 'react';
import { pricingService, PriceConfig } from '@/services/pricingService';

export default function PricingPage() {
    const [configs, setConfigs] = useState<PriceConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<PriceConfig | null>(null);

    // Form states
    const [formData, setFormData] = useState<PriceConfig>({
        roomType: 'STANDARD_2D',
        dayType: 'WEEKDAY',
        seatType: 'STANDARD',
        basePrice: 0,
        active: true
    });

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        try {
            const response = await pricingService.getAll();
            if (response && response.data) {
                setConfigs(response.data);
            }
        } catch (error) {
            console.error('Error fetching prices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await pricingService.createOrUpdate(formData);
            setIsModalOpen(false);
            fetchPrices();
            alert('Đã cập nhật giá thành công!');
        } catch (error) {
            console.error('Error saving price:', error);
            alert('Có lỗi xảy ra khi lưu giá.');
        }
    };

    const openModal = (config?: PriceConfig) => {
        if (config) {
            setEditingConfig(config);
            setFormData(config);
        } else {
            setEditingConfig(null);
            setFormData({
                roomType: 'STANDARD_2D',
                dayType: 'WEEKDAY',
                seatType: 'STANDARD',
                basePrice: 0,
                active: true
            });
        }
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-zinc-900">Quản lý Bảng Giá</h1>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    + Thêm Cấu Hình Giá
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-zinc-500">Loại Phòng</th>
                            <th className="px-6 py-3 font-medium text-zinc-500">Loại Ngày</th>
                            <th className="px-6 py-3 font-medium text-zinc-500">Loại Ghế</th>
                            <th className="px-6 py-3 font-medium text-zinc-500">Giá Cơ Bản</th>
                            <th className="px-6 py-3 font-medium text-zinc-500">Trạng Thái</th>
                            <th className="px-6 py-3 text-right font-medium text-zinc-500">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {configs.map((config) => (
                            <tr key={config.id} className="hover:bg-zinc-50">
                                <td className="px-6 py-4">{config.roomType}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.dayType === 'WEEKEND' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {config.dayType}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{config.seatType}</td>
                                <td className="px-6 py-4 font-bold text-zinc-900">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(config.basePrice)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {config.active ? 'Hoạt động' : 'Ẩn'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => openModal(config)}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Sửa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Configuration Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
                        <h2 className="text-xl font-bold mb-4">
                            {editingConfig ? 'Cập nhật Giá' : 'Thêm Cấu Hình Giá Mới'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Loại Phòng</label>
                                    <select
                                        className="w-full p-2 border border-zinc-300 rounded-lg"
                                        value={formData.roomType}
                                        onChange={e => setFormData({ ...formData, roomType: e.target.value as any })}
                                    >
                                        <option value="STANDARD_2D">Standard 2D</option>
                                        <option value="STANDARD_3D">Standard 3D</option>
                                        <option value="IMAX">IMAX</option>
                                        <option value="IMAX_3D">IMAX 3D</option>
                                        <option value="VIP_4DX">VIP 4DX</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Loại Ngày</label>
                                    <select
                                        className="w-full p-2 border border-zinc-300 rounded-lg"
                                        value={formData.dayType}
                                        onChange={e => setFormData({ ...formData, dayType: e.target.value as any })}
                                    >
                                        <option value="WEEKDAY">Ngày thường (T2-T5)</option>
                                        <option value="WEEKEND">Cuối tuần (T6-CN)</option>
                                        <option value="HOLIDAY">Lễ Tết</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Loại Ghế</label>
                                    <select
                                        className="w-full p-2 border border-zinc-300 rounded-lg"
                                        value={formData.seatType}
                                        onChange={e => setFormData({ ...formData, seatType: e.target.value as any })}
                                    >
                                        <option value="STANDARD">Thường</option>
                                        <option value="VIP">VIP</option>
                                        <option value="COUPLE">Đôi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Giá (VND)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-zinc-300 rounded-lg"
                                        value={formData.basePrice}
                                        onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                />
                                <label htmlFor="active" className="text-sm font-medium text-zinc-700">Kích hoạt</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                                >
                                    {editingConfig ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
