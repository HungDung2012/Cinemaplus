'use client';

import { useState, useEffect } from 'react';
import { pricingService } from '@/services/pricingService';
import { PriceHeader, PriceLine, Surcharge, CustomerType, DayType, TimeSlot, RoomType, SurchargeType, SeatTypeConfig } from '@/types';
import { toast } from 'react-hot-toast';

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState<'rate-card' | 'surcharge' | 'seat-type'>('rate-card');

    // Data States
    const [headers, setHeaders] = useState<PriceHeader[]>([]);
    const [seatTypes, setSeatTypes] = useState<SeatTypeConfig[]>([]);
    const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
    const [priceLines, setPriceLines] = useState<PriceLine[]>([]);
    const [modifiedLines, setModifiedLines] = useState<Record<string, number>>({}); // Key: "cust-day-time-room", Value: newPrice
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
    // Forms
    const [headerForm, setHeaderForm] = useState<Partial<PriceHeader>>({
        name: '',
        startDate: '',
        endDate: '',
        priority: 0,
        active: true
    });

    const [isSeatTypeModalOpen, setIsSeatTypeModalOpen] = useState(false);
    const [seatTypeForm, setSeatTypeForm] = useState<Partial<SeatTypeConfig>>({
        name: '',
        code: '',
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
            const [headersRes, seatTypesRes] = await Promise.all([
                pricingService.getAllPriceHeaders(),
                pricingService.getAllSeatTypes()
            ]);
            setHeaders(headersRes);
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
    const handleDeletePriceHeader = async () => {
        if (!selectedHeaderId) return;
        if (confirm('Bạn có chắc chắn muốn xóa bảng giá này không? Mọi dữ liệu chi tiết sẽ bị mất.')) {
            try {
                await pricingService.deletePriceHeader(selectedHeaderId);
                const newHeaders = headers.filter(h => h.id !== selectedHeaderId);
                setHeaders(newHeaders);
                if (newHeaders.length > 0) {
                    setSelectedHeaderId(newHeaders[0].id);
                } else {
                    setSelectedHeaderId(null);
                }
                toast.success('Đã xóa bảng giá');
            } catch (error) {
                toast.error('Lỗi khi xóa bảng giá');
            }
        }
    };

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

        const key = `${customerType}-${dayType}-${timeSlot}-${roomType}`;
        setModifiedLines(prev => ({
            ...prev,
            [key]: newPrice
        }));
    };

    const handleSavePriceLines = async () => {
        if (!selectedHeaderId || Object.keys(modifiedLines).length === 0) return;

        try {
            const linesToUpdate: PriceLine[] = [];

            // Convert modifiedLines map back to PriceLine objects
            Object.entries(modifiedLines).forEach(([key, price]) => {
                const [customerType, dayType, timeSlot, roomType] = key.split('-');
                const existingLine = priceLines.find(l =>
                    l.customerType === customerType &&
                    l.dayType === dayType &&
                    l.timeSlot === timeSlot &&
                    l.roomType === roomType
                );

                linesToUpdate.push({
                    ...existingLine,
                    priceHeaderId: selectedHeaderId,
                    customerType: customerType as CustomerType,
                    dayType: dayType as DayType,
                    timeSlot: timeSlot as TimeSlot,
                    roomType: roomType as RoomType,
                    price: price
                });
            });

            await pricingService.updatePriceLinesBatch(selectedHeaderId, linesToUpdate);

            // Refresh data and clear modified state
            await fetchPriceLines(selectedHeaderId);
            setModifiedLines({});
            toast.success('Đã lưu bảng giá thành công');
        } catch (error) {
            toast.error('Lỗi khi lưu bảng giá');
        }
    };

    // --- Seat Types Handling (Pricing Only) ---
    const handleSeatTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const saved = await pricingService.createSeatType(seatTypeForm as SeatTypeConfig);
            if (!saved) {
                toast.error('Lỗi khi lưu dữ liệu');
                return;
            }

            if (seatTypeForm.id) {
                setSeatTypes(seatTypes.map(s => s.id === saved.id ? saved : s));
                toast.success('Đã cập nhật loại ghế');
            } else {
                setSeatTypes([...seatTypes, saved]);
                toast.success('Đã tạo loại ghế mới');
            }
            setIsSeatTypeModalOpen(false);
        } catch (error) {
            toast.error('Lỗi khi lưu loại ghế');
        }
    };

    const handleDeleteSeatType = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa loại ghế này?')) return;
        try {
            await pricingService.deleteSeatType(id);
            setSeatTypes(seatTypes.filter(s => s.id !== id));
            toast.success('Đã xóa loại ghế');
        } catch (error) {
            toast.error('Lỗi khi xóa loại ghế');
        }
    };

    const handleSeatTypePriceChange = async (seatType: SeatTypeConfig, newAmount: number) => {
        try {
            // Update the surcharge amount (which effectively updates the seat type config's extraFee)
            // Since backend uses Surcharge entity for everything, we can use createSurcharge or createSeatType
            // But createSeatType in service maps to createSurcharge, so let's use that but preserve other fields
            const updated: SeatTypeConfig = {
                ...seatType,
                extraFee: newAmount
            };
            await pricingService.createSeatType(updated);

            // Update local state
            setSeatTypes(prev => prev.map(st => st.id === seatType.id ? updated : st));
            toast.success('Đã cập nhật phụ thu ghế');
        } catch (error) {
            toast.error('Lỗi khi cập nhật giá');
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
                                                className={`w-24 p-1 border rounded text-right ${modifiedLines[`${customer}-${dayType}-${slot}-${roomType}`] !== undefined ? 'bg-yellow-50 border-yellow-400' : ''}`}
                                                value={modifiedLines[`${customer}-${dayType}-${slot}-${roomType}`] ?? line?.price ?? 0}
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
                            {selectedHeaderId && (
                                <button
                                    onClick={handleDeletePriceHeader}
                                    className="p-2 text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Xóa bảng giá này"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            {/* Save Button for Rate Card */}
                            {selectedHeaderId && (
                                <button
                                    onClick={handleSavePriceLines}
                                    disabled={Object.keys(modifiedLines).length === 0}
                                    className={`px-6 py-2 font-bold rounded-md text-sm h-[38px] flex items-center gap-2 shadow-sm transition-all ${Object.keys(modifiedLines).length > 0
                                        ? 'bg-green-400 text-white hover:bg-green-500 shadow-md transform hover:-translate-y-0.5'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Lưu Thay Đổi
                                </button>
                            )}
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

            {/* Content: Seat Types */}
            {activeTab === 'seat-type' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-500 italic">

                        </div>
                        <button
                            onClick={() => {
                                setSeatTypeForm({
                                    id: undefined,
                                    name: '',
                                    code: '',
                                    extraFee: 0,
                                    seatColor: '#000000',
                                    active: true,
                                    priceMultiplier: 1
                                });
                                setIsSeatTypeModalOpen(true);
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            + Tạo Loại Ghế Mới
                        </button>
                    </div>
                    <div className="overflow-x-auto border rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Loại Ghế</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã (Code)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phụ Thu (VNĐ)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {seatTypes.map(st => (
                                    <tr key={st.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div
                                                className="w-6 h-6 rounded border shadow-sm"
                                                style={{ backgroundColor: st.seatColor }}
                                            ></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{st.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{st.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(st.extraFee)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSeatTypeForm({ ...st });
                                                    setIsSeatTypeModalOpen(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => st.id && handleDeleteSeatType(st.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {seatTypes.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Chưa có loại ghế nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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

            {/* Seat Type Modal */}
            {isSeatTypeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">
                            {seatTypeForm.id ? 'Cập Nhật Loại Ghế' : 'Tạo Loại Ghế Mới'}
                        </h2>
                        <form onSubmit={handleSeatTypeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã Ghế (Code)</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: VIP"
                                    value={seatTypeForm.code}
                                    onChange={e => setSeatTypeForm({ ...seatTypeForm, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Hiển Thị</label>
                                <input
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: Ghế VIP"
                                    value={seatTypeForm.name}
                                    onChange={e => setSeatTypeForm({ ...seatTypeForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Màu Sắc Hiển Thị</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-12 h-10 p-1 border rounded cursor-pointer"
                                        value={seatTypeForm.seatColor}
                                        onChange={e => setSeatTypeForm({ ...seatTypeForm, seatColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                                        value={seatTypeForm.seatColor}
                                        onChange={e => setSeatTypeForm({ ...seatTypeForm, seatColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phụ Thu (VNĐ)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="VD: 10000"
                                    value={seatTypeForm.extraFee}
                                    onChange={e => setSeatTypeForm({ ...seatTypeForm, extraFee: Number(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsSeatTypeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
