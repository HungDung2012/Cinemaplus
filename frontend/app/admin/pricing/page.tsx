'use client';

import { useState, useEffect } from 'react';
import { pricingService, TicketPrice, SeatType } from '@/services/pricingService';
import { toast } from 'react-hot-toast';

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState<'ticket' | 'seat'>('ticket');
    const [ticketPrices, setTicketPrices] = useState<TicketPrice[]>([]);
    const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<TicketPrice | null>(null);
    const [editingSeatType, setEditingSeatType] = useState<SeatType | null>(null);

    const [ticketForm, setTicketForm] = useState<TicketPrice>({
        roomType: 'STANDARD_2D',
        dayType: 'WEEKDAY',
        price: 50000,
        description: ''
    });

    const [seatTypeForm, setSeatTypeForm] = useState<SeatType>({
        code: '',
        name: '',
        priceMultiplier: 1.0,
        extraFee: 0,
        seatColor: '#000000',
        active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tickets, seats] = await Promise.all([
                pricingService.getAllTicketPrices(),
                pricingService.getAllSeatTypes()
            ]);
            setTicketPrices(tickets);
            setSeatTypes(seats);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Không thể tải dữ liệu giá');
        } finally {
            setLoading(false);
        }
    };

    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await pricingService.createTicketPrice(ticketForm);
            setIsModalOpen(false);
            fetchData();
            toast.success('Đã lưu giá vé thành công');
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi lưu giá vé');
        }
    };

    const handleSeatTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await pricingService.createSeatType(seatTypeForm);
            setIsModalOpen(false);
            fetchData();
            toast.success('Đã lưu loại ghế thành công');
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi lưu loại ghế');
        }
    };

    const openTicketModal = (item?: TicketPrice) => {
        if (item) {
            setEditingTicket(item);
            setTicketForm(item);
        } else {
            setEditingTicket(null);
            setTicketForm({
                roomType: 'STANDARD_2D',
                dayType: 'WEEKDAY',
                price: 50000,
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const openSeatTypeModal = (item?: SeatType) => {
        if (item) {
            setEditingSeatType(item);
            setSeatTypeForm(item);
        } else {
            setEditingSeatType(null);
            setSeatTypeForm({
                code: '',
                name: '',
                priceMultiplier: 1.0,
                extraFee: 0,
                seatColor: '#000000',
                active: true
            });
        }
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Bảng Giá & Loại Ghế</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('ticket')}
                    className={`py-2 px-4 font-medium transition-colors ${activeTab === 'ticket'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Giá Vé Cơ Bản
                </button>
                <button
                    onClick={() => setActiveTab('seat')}
                    className={`py-2 px-4 font-medium transition-colors ${activeTab === 'seat'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Loại Ghế & Phụ Thu
                </button>
            </div>

            {/* Content */}
            {activeTab === 'ticket' ? (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => openTicketModal()}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            + Thêm Giá Vé
                        </button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500">Loại Phòng</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Loại Ngày</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Giá Vé</th>
                                    <th className="px-6 py-3 font-medium text-gray-500">Mô tả</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ticketPrices.map((price) => (
                                    <tr key={price.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">{price.roomType}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${price.dayType === 'WEEKEND' ? 'bg-purple-100 text-purple-800' :
                                                price.dayType === 'HOLIDAY' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {price.dayType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price.price)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{price.description || '-'}</td>
                                    </tr>
                                ))}
                                {ticketPrices.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500">Chưa có dữ liệu giá vé</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => openSeatTypeModal()}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            + Thêm Loại Ghế
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {seatTypes.map((type) => (
                            <div key={type.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45" style={{ backgroundColor: type.seatColor }} />
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{type.name}</h3>
                                        <span className="text-sm text-gray-500">Mã: {type.code}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${type.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {type.active ? 'Hoạt động' : 'Ẩn'}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Hệ số giá:</span>
                                        <span className="font-medium">x{type.priceMultiplier}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Phụ thu:</span>
                                        <span className="font-medium text-red-600">
                                            +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(type.extraFee)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {seatTypes.length === 0 && (
                            <div className="col-span-full text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                                Chưa có cấu hình loại ghế
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {activeTab === 'ticket'
                                ? (editingTicket ? 'Cập nhật Giá Vé' : 'Thêm Giá Vé Mới')
                                : (editingSeatType ? 'Cập nhật Loại Ghế' : 'Thêm Loại Ghế Mới')
                            }
                        </h2>

                        {activeTab === 'ticket' ? (
                            <form onSubmit={handleTicketSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại Phòng</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={ticketForm.roomType}
                                            onChange={e => setTicketForm({ ...ticketForm, roomType: e.target.value as any })}
                                        >
                                            <option value="STANDARD_2D">Standard 2D</option>
                                            <option value="STANDARD_3D">Standard 3D</option>
                                            <option value="IMAX">IMAX</option>
                                            <option value="IMAX_3D">IMAX 3D</option>
                                            <option value="VIP_4DX">VIP 4DX</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại Ngày</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={ticketForm.dayType}
                                            onChange={e => setTicketForm({ ...ticketForm, dayType: e.target.value as any })}
                                        >
                                            <option value="WEEKDAY">Ngày thường (T2-T5)</option>
                                            <option value="WEEKEND">Cuối tuần (T6-CN)</option>
                                            <option value="HOLIDAY">Lễ Tết</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá Vé (VND)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={ticketForm.price}
                                        onChange={e => setTicketForm({ ...ticketForm, price: Number(e.target.value) })}
                                        required
                                        min="0"
                                        step="1000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                    <textarea
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={ticketForm.description || ''}
                                        onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Lưu lại
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSeatTypeSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã ghế (Code)</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            value={seatTypeForm.code}
                                            onChange={e => setSeatTypeForm({ ...seatTypeForm, code: e.target.value })}
                                            required
                                            placeholder="VD: VIP"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            value={seatTypeForm.name}
                                            onChange={e => setSeatTypeForm({ ...seatTypeForm, name: e.target.value })}
                                            required
                                            placeholder="VD: Ghế VIP"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hệ số giá (Multiplier)</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            value={seatTypeForm.priceMultiplier}
                                            onChange={e => setSeatTypeForm({ ...seatTypeForm, priceMultiplier: Number(e.target.value) })}
                                            required
                                            min="0"
                                            step="0.1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phụ thu (Extra Fee)</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            value={seatTypeForm.extraFee}
                                            onChange={e => setSeatTypeForm({ ...seatTypeForm, extraFee: Number(e.target.value) })}
                                            required
                                            min="0"
                                            step="1000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="h-10 w-20 p-1 border border-gray-300 rounded cursor-pointer"
                                            value={seatTypeForm.seatColor}
                                            onChange={e => setSeatTypeForm({ ...seatTypeForm, seatColor: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            value={seatTypeForm.seatColor}
                                            onChange={e => setSeatTypeForm({ ...seatTypeForm, seatColor: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="active-seat"
                                        checked={seatTypeForm.active}
                                        onChange={e => setSeatTypeForm({ ...seatTypeForm, active: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="active-seat" className="text-sm font-medium text-gray-700">Kích hoạt</label>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        Lưu lại
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
