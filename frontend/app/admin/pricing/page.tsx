'use client';

import { useState, useEffect } from 'react';
import { pricingService } from '@/services/pricingService';
import { PriceHeader, PriceLine, Surcharge, CustomerType, DayType, TimeSlot, RoomType, SurchargeType, SeatTypeConfig } from '@/types';
import { toast } from 'react-hot-toast';

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState<'rate-card' | 'surcharge' | 'seat-type'>('rate-card');

    // Data States
    const [headers, setHeaders] = useState<PriceHeader[]>([]);
    const [surcharges, setSurcharges] = useState<Surcharge[]>([]);
    const [seatTypes, setSeatTypes] = useState<SeatTypeConfig[]>([]);
    const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
    const [priceLines, setPriceLines] = useState<PriceLine[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
    const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
    const [isSeatTypeModalOpen, setIsSeatTypeModalOpen] = useState(false);

    // Forms
    const [headerForm, setHeaderForm] = useState<Partial<PriceHeader>>({
        name: '',
        startDate: '',
        endDate: '',
        priority: 0,
        active: true
    });

    const [surchargeForm, setSurchargeForm] = useState<Partial<Surcharge>>({
        name: '',
        type: 'SEAT_TYPE',
        targetId: '',
        amount: 0,
        active: true
    });

    const [seatTypeForm, setSeatTypeForm] = useState<SeatTypeConfig>({
        code: '',
        name: '',
        priceMultiplier: 1,
        extraFee: 0,
        seatColor: '#000000',
        active: true
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedHeaderId) {
            fetchPriceLines(selectedHeaderId);
        }
    }, [selectedHeaderId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [headersRes, surchargesRes, seatTypesRes] = await Promise.all([
                pricingService.getAllPriceHeaders(),
                pricingService.getAllSurcharges(),
                pricingService.getAllSeatTypes()
            ]);
            setHeaders(headersRes);
            setSurcharges(surchargesRes);
            setSeatTypes(seatTypesRes);
            if (headersRes.length > 0 && !selectedHeaderId) {
                setSelectedHeaderId(headersRes[0].id);
            }
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
            toast.error('Không thể tải dữ liệu giá');
        } finally {
            setLoading(false);
        }
    };

    const fetchPriceLines = async (headerId: number) => {
        try {
            const lines = await pricingService.getPriceLinesByHeader(headerId);
            setPriceLines(lines);
        } catch (error) {
            console.error('Lỗi tải bảng giá chi tiết:', error);
            toast.error('Không thể tải bảng giá chi tiết');
        }
    };

    // --- Headers Handling ---
    const handleHeaderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newHeader = await pricingService.createPriceHeader(headerForm as PriceHeader);
            setHeaders([...headers, newHeader]);
            setIsHeaderModalOpen(false);
            toast.success('Đã tạo bảng giá mới');
        } catch (error) {
            toast.error('Lỗi khi tạo bảng giá');
        }
    };

    // --- Price Lines (Matrix) Handling ---
    const handlePriceCellChange = async (
        customerType: CustomerType,
        dayType: DayType,
        timeSlot: TimeSlot,
        roomType: RoomType,
        newPrice: number
    ) => {
        if (!selectedHeaderId) return;

        const existingLine = priceLines.find(l =>
            l.customerType === customerType &&
            l.dayType === dayType &&
            l.timeSlot === timeSlot &&
            l.roomType === roomType
        );

        const lineData: PriceLine = {
            ...existingLine,
            priceHeaderId: selectedHeaderId,
            customerType,
            dayType,
            timeSlot,
            roomType,
            price: newPrice
        };

        try {
            const savedLine = await pricingService.createPriceLine(selectedHeaderId, lineData);

            setPriceLines(prev => {
                const filtered = prev.filter(l =>
                    !(l.customerType === customerType &&
                        l.dayType === dayType &&
                        l.timeSlot === timeSlot &&
                        l.roomType === roomType)
                );
                return [...filtered, savedLine];
            });
            toast.success('Đã cập nhật giá');
        } catch (error) {
            toast.error('Lỗi cập nhật giá');
        }
    };

    // --- Surcharges Handling ---
    const handleSurchargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newSurcharge = await pricingService.createSurcharge(surchargeForm as Surcharge);
            setSurcharges([...surcharges, newSurcharge]);
            setIsSurchargeModalOpen(false);
            toast.success('Đã tạo phụ thu mới');
        } catch (error) {
            toast.error('Lỗi khi tạo phụ thu');
        }
    };

    const handleDeleteSurcharge = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            await pricingService.deleteSurcharge(id);
            setSurcharges(surcharges.filter(s => s.id !== id));
            toast.success('Đã xóa phụ thu');
        } catch (error) {
            toast.error('Lỗi khi xóa phụ thu');
        }
    };

    // --- Seat Types Handling ---
    const handleSeatTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newSeatType = await pricingService.createSeatType(seatTypeForm);
            if (newSeatType) {
                setSeatTypes([...seatTypes, newSeatType]);
                setIsSeatTypeModalOpen(false);
                toast.success('Đã tạo loại ghế mới');
            } else {
                toast.error('Lỗi: Không nhận được phản hồi từ server');
            }
        } catch (error) {
            toast.error('Lỗi khi tạo loại ghế');
        }
    };

    const handleDeleteSeatType = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            await pricingService.deleteSeatType(id);
            setSeatTypes(seatTypes.filter(s => s.id !== id));
            toast.success('Đã xóa loại ghế');
        } catch (error) {
            toast.error('Lỗi khi xóa loại ghế');
        }
    };

    // --- Render Helpers ---
    const renderMatrix = (roomType: RoomType, dayType: DayType) => {
        const customerTypes: CustomerType[] = ['ADULT', 'STUDENT', 'MEMBER'];
        const timeSlots: TimeSlot[] = ['MORNING', 'DAY', 'EVENING', 'LATE'];

        // Translations for UI display
        const customerLabels: Record<CustomerType, string> = {
            'ADULT': 'Người lớn',
            'STUDENT': 'HSSV/U22',
            'MEMBER': 'Thành viên'
        };

        const timeSlotLabels: Record<TimeSlot, string> = {
            'MORNING': 'Sáng',
            'DAY': 'Ngày',
            'EVENING': 'Tối',
            'LATE': 'Khuya'
        };

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối Tượng</th>
                            {timeSlots.map(slot => (
                                <th key={slot} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {timeSlotLabels[slot]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customerTypes.map(customer => (
                            <tr key={customer}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{customerLabels[customer]}</td>
                                {timeSlots.map(slot => {
                                    const line = priceLines.find(l =>
                                        l.customerType === customer &&
                                        l.dayType === dayType &&
                                        l.timeSlot === slot &&
                                        l.roomType === roomType
                                    );
                                    return (
                                        <td key={slot} className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="number"
                                                className="w-24 p-1 border rounded text-right"
                                                value={line?.price || 0}
                                                onChange={(e) => handlePriceCellChange(customer, dayType, slot, roomType, Number(e.target.value))}
                                                step="1000"
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

    const dayTypeLabels: Record<DayType, string> = {
        'WEEKDAY': 'Ngày thường (T2-T5)',
        'WEEKEND': 'Cuối tuần (T6-CN)',
        'HOLIDAY': 'Ngày lễ'
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Quản Lý Giá Vé</h1>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === 'rate-card' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('rate-card')}
                >
                    Bảng Giá
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'surcharge' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('surcharge')}
                >
                    Phụ Thu
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'seat-type' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('seat-type')}
                >
                    Loại Ghế
                </button>
            </div>

            {/* Content: Rate Cards */}
            {activeTab === 'rate-card' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <label className="font-medium text-gray-700">Chọn Bảng Giá:</label>
                            <select
                                className="p-2 border rounded-lg min-w-[300px]"
                                value={selectedHeaderId || ''}
                                onChange={(e) => setSelectedHeaderId(Number(e.target.value))}
                            >
                                {headers.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => setIsHeaderModalOpen(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            + Tạo Bảng Giá Mới
                        </button>
                    </div>

                    {selectedHeaderId && (
                        <div className="space-y-8">
                            {(['WEEKDAY', 'WEEKEND', 'HOLIDAY'] as DayType[]).map(dayType => (
                                <div key={dayType} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                                    <h3 className="font-bold text-lg mb-4 border-b pb-2">{dayTypeLabels[dayType]}</h3>
                                    <div className="space-y-6">
                                        {(['STANDARD_2D', 'STANDARD_3D', 'IMAX', 'IMAX_3D', 'VIP_4DX'] as RoomType[]).map(roomType => (
                                            <div key={roomType} className="bg-white p-4 rounded border hover:shadow-md transition-shadow">
                                                <h4 className="font-bold mb-3 text-gray-700 flex items-center gap-2">
                                                    {roomType}
                                                </h4>
                                                {renderMatrix(roomType, dayType)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Content: Surcharges */}
            {activeTab === 'surcharge' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setIsSurchargeModalOpen(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            + Tạo Phụ Thu Mới
                        </button>
                    </div>
                    <div className="overflow-hidden border rounded-lg shadow-sm">
                        <table className="w-full bg-white">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Tên Phụ Thu</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Loại</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Mã Đối Tượng</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Số Tiền</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {surcharges.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{s.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{s.type}</td>
                                        <td className="px-6 py-4 font-mono text-sm bg-gray-50 rounded px-2 py-1 mx-6 w-fit inline-block mt-3">{s.targetId}</td>
                                        <td className="px-6 py-4">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeleteSurcharge(s.id)}
                                                className="text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {surcharges.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu phụ thu</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Content: Seat Types */}
            {activeTab === 'seat-type' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setIsSeatTypeModalOpen(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            + Tạo Loại Ghế Mới
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {seatTypes.map(st => (
                            <div key={st.id} className="border rounded-xl p-6 relative overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45 border-b border-l shadow-sm"
                                    style={{ backgroundColor: st.seatColor }} />
                                <h3 className="text-lg font-bold text-gray-800">{st.name}</h3>
                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                    <p><span className="font-semibold">Mã ghế:</span> {st.code}</p>
                                    <p><span className="font-semibold">Phụ thu:</span> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(st.extraFee)}</p>
                                </div>
                                <button
                                    onClick={() => st.id && handleDeleteSeatType(st.id)}
                                    className="mt-4 text-red-600 text-sm hover:text-red-800 font-medium hover:underline"
                                >
                                    Xóa Loại Ghế
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            {isHeaderModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Tạo Bảng Giá Mới</h2>
                        <form onSubmit={handleHeaderSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Bảng Giá</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: Bảng Giá Tiêu Chuẩn 2024"
                                    value={headerForm.name}
                                    onChange={e => setHeaderForm({ ...headerForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            {/* Add date fields if needed, currently reusing logic */}
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsHeaderModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Tạo Mới</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSurchargeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Tạo Phụ Thu Mới</h2>
                        <form onSubmit={handleSurchargeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Phụ Thu</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: Phụ Thu Ghế VIP"
                                    value={surchargeForm.name}
                                    onChange={e => setSurchargeForm({ ...surchargeForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại Phụ Thu</label>
                                <select
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={surchargeForm.type}
                                    onChange={e => setSurchargeForm({ ...surchargeForm, type: e.target.value as SurchargeType })}
                                >
                                    <option value="SEAT_TYPE">Loại Ghế</option>
                                    <option value="FORMAT_3D">Định dạng 3D</option>
                                    <option value="DATE_TYPE">Loại Ngày</option>
                                    <option value="MOVIE_TYPE">Loại Phim</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã Đối Tượng</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: VIP, BLOCKBUSTER"
                                    value={surchargeForm.targetId}
                                    onChange={e => setSurchargeForm({ ...surchargeForm, targetId: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Nhập mã định danh của đối tượng áp dụng phụ thu.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số Tiền (VNĐ)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: 10000"
                                    value={surchargeForm.amount}
                                    onChange={e => setSurchargeForm({ ...surchargeForm, amount: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsSurchargeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Tạo Mới</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSeatTypeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Tạo Loại Ghế Mới</h2>
                        <form onSubmit={handleSeatTypeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã Ghế</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: VIP"
                                    value={seatTypeForm.code}
                                    onChange={e => setSeatTypeForm({ ...seatTypeForm, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Loại Ghế</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: Ghế VIP Sang Trọng"
                                    value={seatTypeForm.name}
                                    onChange={e => setSeatTypeForm({ ...seatTypeForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Màu Sắc</label>
                                <input
                                    type="color"
                                    className="w-full h-10 p-1 border rounded cursor-pointer"
                                    value={seatTypeForm.seatColor}
                                    onChange={e => setSeatTypeForm({ ...seatTypeForm, seatColor: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phụ Thu (VNĐ)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: 10000"
                                    value={seatTypeForm.extraFee}
                                    onChange={e => setSeatTypeForm({ ...seatTypeForm, extraFee: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsSeatTypeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Tạo Mới</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
