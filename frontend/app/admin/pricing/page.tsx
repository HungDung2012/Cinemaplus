'use client';

import { useState, useEffect } from 'react';
import { pricingService } from '@/services/pricingService';
import { PriceHeader, PriceLine, DayType, TimeSlot, RoomType, SeatTypeConfig } from '@/types';
import { toast } from 'react-hot-toast';
import {
    CalendarDays, PartyPopper, Gift,
    Ticket, CreditCard, Plus,
    Trash2, Save, X, Edit2, Calendar, LayoutGrid
} from 'lucide-react';

const roomTypes: RoomType[] = ['STANDARD_2D', 'STANDARD_3D', 'IMAX', 'IMAX_3D', 'VIP_4DX'];
const timeSlots: TimeSlot[] = ['MORNING', 'DAY', 'EVENING', 'LATE'];
const dayTypes: DayType[] = ['WEEKDAY', 'WEEKEND', 'HOLIDAY'];

const roomTypeLabels: Record<RoomType, string> = {
    'STANDARD_2D': '2D Thường',
    'STANDARD_3D': '3D Thường',
    'IMAX': 'IMAX',
    'IMAX_3D': 'IMAX 3D',
    'VIP_4DX': 'VIP 4DX',
};
const timeSlotLabels: Record<TimeSlot, string> = {
    'MORNING': 'Sáng (<10h)',
    'DAY': 'Ngày (10-17h)',
    'EVENING': 'Tối (17-22h)',
    'LATE': 'Khuya (>22h)',
};
const dayTypeLabels: Record<DayType, string> = {
    'WEEKDAY': 'Ngày thường',
    'WEEKEND': 'Cuối tuần',
    'HOLIDAY': 'Ngày lễ',
};
const dayTypeDescriptions: Record<DayType, string> = {
    'WEEKDAY': 'Thứ 2 – Thứ 5',
    'WEEKEND': 'Thứ 6 – Chủ nhật',
    'HOLIDAY': 'Lễ, Tết, ngày đặc biệt',
};
const dayTypeIcons: Record<DayType, React.ReactNode> = {
    'WEEKDAY': <CalendarDays className="w-5 h-5" />,
    'WEEKEND': <PartyPopper className="w-5 h-5" />,
    'HOLIDAY': <Gift className="w-5 h-5" />,
};

const formatVND = (value: number) =>
    new Intl.NumberFormat('vi-VN').format(value) + 'đ';

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState<'rate-card' | 'seat-type'>('rate-card');
    const [activeDayType, setActiveDayType] = useState<DayType>('WEEKDAY');

    // Data
    const [headers, setHeaders] = useState<PriceHeader[]>([]);
    const [seatTypes, setSeatTypes] = useState<SeatTypeConfig[]>([]);
    const [selectedHeaderId, setSelectedHeaderId] = useState<number | null>(null);
    const [priceLines, setPriceLines] = useState<PriceLine[]>([]);
    const [modifiedLines, setModifiedLines] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    // Modals
    const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
    const [headerForm, setHeaderForm] = useState<Partial<PriceHeader>>({
        name: '', startDate: '', endDate: '', priority: 0, active: true
    });
    const [isSeatTypeModalOpen, setIsSeatTypeModalOpen] = useState(false);
    const [seatTypeForm, setSeatTypeForm] = useState<Partial<SeatTypeConfig>>({
        name: '', code: '', extraFee: 0, seatColor: '#000000', active: true
    });

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { if (selectedHeaderId) fetchPriceLines(selectedHeaderId); }, [selectedHeaderId]);

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
        } catch {
            toast.error('Không thể tải dữ liệu giá');
        } finally {
            setLoading(false);
        }
    };

    const fetchPriceLines = async (headerId: number) => {
        try {
            const lines = await pricingService.getPriceLinesByHeader(headerId);
            setPriceLines(lines);
        } catch {
            toast.error('Không thể tải bảng giá chi tiết');
        }
    };

    // --- Handlers ---
    const handleDeletePriceHeader = async () => {
        if (!selectedHeaderId) return;
        if (confirm('Bạn có chắc chắn muốn xóa bảng giá này không? Mọi dữ liệu chi tiết sẽ bị mất.')) {
            try {
                await pricingService.deletePriceHeader(selectedHeaderId);
                const newHeaders = headers.filter(h => h.id !== selectedHeaderId);
                setHeaders(newHeaders);
                setSelectedHeaderId(newHeaders.length > 0 ? newHeaders[0].id : null);
                if (newHeaders.length === 0) setPriceLines([]);
                toast.success('Đã xóa bảng giá');
            } catch {
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
            if (!selectedHeaderId || headers.length === 0) {
                setSelectedHeaderId(newHeader.id);
            }
            toast.success('Đã tạo bảng giá mới');
        } catch {
            toast.error('Lỗi khi tạo bảng giá');
        }
    };

    const handlePriceCellChange = (dayType: DayType, timeSlot: TimeSlot, roomType: RoomType, newPrice: number) => {
        if (!selectedHeaderId) return;
        const key = `${dayType}-${timeSlot}-${roomType}`;
        setModifiedLines(prev => ({ ...prev, [key]: newPrice }));
    };

    const handleSavePriceLines = async () => {
        if (!selectedHeaderId || Object.keys(modifiedLines).length === 0) return;
        try {
            const linesToUpdate: PriceLine[] = [];
            Object.entries(modifiedLines).forEach(([key, price]) => {
                const [dayType, timeSlot, roomType] = key.split('-');
                const existingLine = priceLines.find(l =>
                    l.dayType === dayType && l.timeSlot === timeSlot && l.roomType === roomType
                );
                linesToUpdate.push({
                    ...existingLine,
                    priceHeaderId: selectedHeaderId,
                    dayType: dayType as DayType,
                    timeSlot: timeSlot as TimeSlot,
                    roomType: roomType as RoomType,
                    price: price
                });
            });
            await pricingService.updatePriceLinesBatch(selectedHeaderId, linesToUpdate);
            await fetchPriceLines(selectedHeaderId);
            setModifiedLines({});
            toast.success('Đã lưu bảng giá thành công');
        } catch {
            toast.error('Lỗi khi lưu bảng giá');
        }
    };

    const handleDiscardChanges = () => {
        setModifiedLines({});
    };

    const handleSeatTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...seatTypeForm,
                priceMultiplier: (seatTypeForm as any).priceMultiplier || 1
            };
            const saved = await pricingService.createSeatType(payload as SeatTypeConfig);
            if (!saved) { toast.error('Lỗi khi lưu dữ liệu'); return; }
            if (seatTypeForm.id) {
                setSeatTypes(seatTypes.map(s => s.id === saved.id ? saved : s));
                toast.success('Đã cập nhật loại ghế');
            } else {
                setSeatTypes([...seatTypes, saved]);
                toast.success('Đã tạo loại ghế mới');
            }
            setIsSeatTypeModalOpen(false);
        } catch {
            toast.error('Lỗi khi lưu loại ghế');
        }
    };

    const handleDeleteSeatType = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa loại ghế này?')) return;
        try {
            await pricingService.deleteSeatType(id);
            setSeatTypes(seatTypes.filter(s => s.id !== id));
            toast.success('Đã xóa loại ghế');
        } catch {
            toast.error('Lỗi khi xóa loại ghế');
        }
    };

    // --- Helpers ---
    const modifiedCount = Object.keys(modifiedLines).length;

    const getPrice = (dayType: DayType, timeSlot: TimeSlot, roomType: RoomType) => {
        const key = `${dayType}-${timeSlot}-${roomType}`;
        if (modifiedLines[key] !== undefined) return modifiedLines[key];
        const line = priceLines.find(l => l.dayType === dayType && l.timeSlot === timeSlot && l.roomType === roomType);
        return line?.price ?? 0;
    };

    const isModified = (dayType: DayType, timeSlot: TimeSlot, roomType: RoomType) => {
        return modifiedLines[`${dayType}-${timeSlot}-${roomType}`] !== undefined;
    };

    // --- Loading ---
    if (loading) return (
        <div className="min-h-[500px] flex flex-col items-center justify-center gap-4 text-gray-400">
            <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <span className="font-semibold text-sm tracking-wide">Đang tải cấu hình...</span>
        </div>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-transparent">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-red-600" />
                    Quản Lý Giá Vé
                </h1>
                <p className="text-sm text-gray-500 mt-2 pl-11">Thiết lập giá vé theo loại phòng, khung giờ và ngày chiếu một cách chi tiết.</p>
            </div>

            {/* Main Tabs Segmented Control */}
            <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl mb-8 shadow-inner">
                <button
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'rate-card' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    onClick={() => setActiveTab('rate-card')}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Bảng Giá Cơ Bản
                </button>
                <button
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'seat-type' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    onClick={() => setActiveTab('seat-type')}
                >
                    <Ticket className="w-4 h-4" />
                    Phụ Thu Loại Ghế
                </button>
            </div>

            {/* =================== RATE CARD TAB =================== */}
            {activeTab === 'rate-card' && (
                <div className="space-y-6">
                    {/* Header selector bar */}
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl shadow-inner">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-widest text-gray-400 font-black mb-0.5">Bảng giá đang chọn</label>
                                <select
                                    className="text-base font-bold text-gray-900 bg-transparent border-none outline-none cursor-pointer p-0 -ml-1 min-w-[280px] hover:text-red-700 transition-colors focus:ring-0"
                                    value={selectedHeaderId || ''}
                                    onChange={(e) => { setSelectedHeaderId(Number(e.target.value)); setModifiedLines({}); }}
                                >
                                    {headers.map(h => (
                                        <option key={h.id} value={h.id}>{h.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-100/50">
                            {selectedHeaderId && (
                                <button
                                    onClick={handleDeletePriceHeader}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Xóa bảng giá này"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                            <div className="w-px h-6 bg-gray-200"></div>
                            <button
                                onClick={() => {
                                    setHeaderForm({ name: '', startDate: '', endDate: '', priority: 0, active: true });
                                    setIsHeaderModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all text-sm font-medium shadow-sm active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Tạo Mới
                            </button>
                        </div>
                    </div>

                    {/* Day Type Sub-tabs */}
                    {selectedHeaderId && (
                        <>
                            <div className="flex gap-4">
                                {dayTypes.map(dt => (
                                    <button
                                        key={dt}
                                        onClick={() => setActiveDayType(dt)}
                                        className={`flex-1 p-5 rounded-3xl border transition-all duration-300 text-left relative overflow-hidden group ${activeDayType === dt
                                            ? 'border-red-500 bg-red-50/20 shadow-md ring-1 ring-red-500/10'
                                            : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-red-100/30 rounded-bl-[100px] -z-10 transition-opacity duration-300 ${activeDayType === dt ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-xl transition-colors duration-300 ${activeDayType === dt ? 'bg-red-100 text-red-600 shadow-inner' : 'bg-gray-50 text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100'}`}>
                                                {dayTypeIcons[dt]}
                                            </div>
                                            <span className={`font-bold text-[15px] tracking-tight ${activeDayType === dt ? 'text-red-700' : 'text-gray-700'}`}>
                                                {dayTypeLabels[dt]}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-[52px]">{dayTypeDescriptions[dt]}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Price Matrix Table */}
                            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                                <th className="text-left pl-6 pr-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">
                                                    Loại Phòng
                                                </th>
                                                {timeSlots.map(slot => (
                                                    <th key={slot} className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                        {timeSlotLabels[slot]}

                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 border-t-0">
                                            {roomTypes.map((rt, idx) => (
                                                <tr key={rt} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="pl-6 pr-4 py-5">
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold`}>
                                                            {roomTypeLabels[rt]}
                                                        </span>
                                                    </td>
                                                    {timeSlots.map(slot => {
                                                        const price = getPrice(activeDayType, slot, rt);
                                                        const modified = isModified(activeDayType, slot, rt);
                                                        return (
                                                            <td key={slot} className="px-6 py-4 text-right group/cell">
                                                                <div className="relative inline-flex flex-col items-end">
                                                                    <div className="relative inline-flex items-center">
                                                                        <span className="absolute left-3 text-gray-400 font-medium text-sm group-focus-within/cell:text-red-500 transition-colors pointer-events-none">₫</span>
                                                                        <input
                                                                            type="number"
                                                                            className={`w-36 pl-8 pr-3 py-2 text-right text-sm font-bold rounded-xl border-2 transition-all outline-none
                                                                                ${modified
                                                                                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm'
                                                                                    : 'border-gray-100 bg-transparent text-gray-900 hover:border-gray-200 focus:border-red-400 focus:bg-white focus:shadow-sm focus:ring-4 focus:ring-red-50'
                                                                                }`}
                                                                            value={price === 0 ? '' : price}
                                                                            onChange={(e) => handlePriceCellChange(activeDayType, slot, rt, Number(e.target.value))}
                                                                            step="1000"
                                                                        />
                                                                    </div>
                                                                    {price > 0 && (
                                                                        <span className={`absolute -bottom-[16px] right-2 text-[10px] font-bold uppercase tracking-wider transition-opacity opacity-100 ${modified ? 'text-amber-600' : 'text-gray-400'}`}>
                                                                            {formatVND(price)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {!selectedHeaderId && headers.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-gray-100">
                                <Calendar className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Chưa có bảng giá nào</h3>
                            <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">Tạo bảng giá đầu tiên để có thể bắt đầu thiết lập giá vé chi tiết cho từng loại phòng và loại ngày.</p>
                            <button
                                onClick={() => {
                                    setHeaderForm({ name: '', startDate: '', endDate: '', priority: 0, active: true });
                                    setIsHeaderModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all font-semibold shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Tạo Bảng Giá Ngay
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* =================== SEAT TYPE TAB =================== */}
            {activeTab === 'seat-type' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 pl-2">
                            <div className="bg-amber-50 p-3 rounded-xl shadow-inner text-amber-600">
                                <Ticket className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 tracking-tight mb-0.5">Phụ Thu Theo Ghế</h3>
                                <p className="text-xs text-gray-500 font-medium">Thiết lập các loại phụ thu đặc biệt áp dụng cho từng loại ghế.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSeatTypeForm({ id: undefined, name: '', code: '', extraFee: 0, seatColor: '#000000', active: true });
                                setIsSeatTypeModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all text-sm font-medium shadow-sm active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Tạo Loại Ghế
                        </button>
                    </div>

                    {seatTypes.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-gray-100">
                                <Ticket className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Chưa có cấu hình phụ thu</h3>
                            <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">Thiết lập phụ thu cho các loại ghế đặc biệt như VIP, Sweetbox để tính giá vé chính xác.</p>
                            <button
                                onClick={() => {
                                    setSeatTypeForm({ id: undefined, name: '', code: '', extraFee: 0, seatColor: '#000000', active: true });
                                    setIsSeatTypeModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all font-semibold shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Tạo Loại Ghế Mới
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {seatTypes.map(st => (
                                <div key={st.id} className="relative bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                    {/* Ticket Cutouts */}
                                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50/50 rounded-full border-r border-gray-200 -translate-y-1/2 z-10" />
                                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50/50 rounded-full border-l border-gray-200 -translate-y-1/2 z-10" />

                                    <div className="px-6 pt-6 pb-5 border-b-2 border-dashed border-gray-200 relative bg-white">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-12 h-12 rounded-2xl shadow-inner flex items-center justify-center text-white font-black text-sm relative overflow-hidden ring-4 ring-gray-50"
                                                    style={{ backgroundColor: st.seatColor }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                                                    <span className="relative z-10 drop-shadow-sm text-lg">{st.code?.substring(0, 2)}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-base leading-tight">{st.name}</h4>
                                                    <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-mono text-gray-500 font-bold tracking-widest uppercase">
                                                        {st.code}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5 -mt-1 -mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                <button
                                                    onClick={() => { setSeatTypeForm({ ...st }); setIsSeatTypeModalOpen(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => st.id && handleDeleteSeatType(st.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/80 px-6 py-5 flex items-end justify-between relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Phụ Thu</p>
                                            <p className="text-2xl font-black text-gray-900 tracking-tight">
                                                +{formatVND(st.extraFee)}
                                            </p>
                                        </div>
                                        <Ticket className="w-16 h-16 text-gray-200 absolute -right-4 -bottom-4 opacity-50 rotate-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* =================== FLOATING SAVE BAR =================== */}
            {modifiedCount > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-[slideUp_0.3s_ease-out]">
                    <div className="backdrop-blur-xl bg-gray-900/90 text-white rounded-full shadow-2xl px-3 py-3 flex items-center gap-3 border border-gray-700/50 ring-1 ring-white/10">
                        <div className="flex items-center gap-3 pl-4 pr-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 shadow-inner shadow-red-300/30 text-xs font-black text-white">{modifiedCount}</span>
                            <span className="text-sm font-medium text-gray-200 whitespace-nowrap">thay đổi chưa lưu</span>
                        </div>
                        <div className="w-px h-6 bg-gray-700/80 mx-1" />
                        <button
                            onClick={handleDiscardChanges}
                            className="text-sm font-medium text-gray-300 hover:text-white px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors active:scale-95"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSavePriceLines}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg shadow-red-500/20 transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            Xác Nhận Lưu
                        </button>
                    </div>
                </div>
            )}

            {/* =================== HEADER MODAL =================== */}
            {isHeaderModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center z-50" onClick={() => setIsHeaderModalOpen(false)}>
                    <div className="bg-white rounded-[28px] w-[460px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-7 pt-7 pb-5 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tạo Bảng Giá Mới</h2>
                                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">Thiết lập khoảng thời gian áp dụng cho bảng giá vé.</p>
                            </div>
                            <button onClick={() => setIsHeaderModalOpen(false)} className="p-2 -mr-2 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleHeaderSubmit} className="px-7 pb-7 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tên Bảng Giá <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all text-sm font-medium placeholder:font-normal"
                                    placeholder="VD: Bảng Giá Tiêu Chuẩn 2026"
                                    value={headerForm.name}
                                    onChange={e => setHeaderForm({ ...headerForm, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all text-sm font-medium"
                                        value={headerForm.startDate}
                                        onChange={e => setHeaderForm({ ...headerForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all text-sm font-medium"
                                        value={headerForm.endDate}
                                        onChange={e => setHeaderForm({ ...headerForm, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsHeaderModalOpen(false)} className="px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Hủy</button>
                                <button type="submit" className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-bold transition-colors shadow-sm active:scale-95">Xác nhận tạo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================== SEAT TYPE MODAL =================== */}
            {isSeatTypeModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center z-50" onClick={() => setIsSeatTypeModalOpen(false)}>
                    <div className="bg-white rounded-[28px] w-[460px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-7 pt-7 pb-5 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                                    {seatTypeForm.id ? 'Cập Nhật Loại Ghế' : 'Tạo Loại Ghế Mới'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">Cấu hình loại ghế và mức phụ thu tương ứng.</p>
                            </div>
                            <button onClick={() => setIsSeatTypeModalOpen(false)} className="p-2 -mr-2 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSeatTypeSubmit} className="px-7 pb-7 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mã Ghế <span className="text-red-500">*</span></label>
                                    <input
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all text-sm font-mono uppercase font-bold placeholder:font-sans placeholder:font-normal placeholder:normal-case"
                                        placeholder="Ví dụ: VIP"
                                        value={seatTypeForm.code}
                                        onChange={e => setSeatTypeForm({ ...seatTypeForm, code: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tên Hiển Thị <span className="text-red-500">*</span></label>
                                    <input
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all text-sm font-medium placeholder:font-normal"
                                        placeholder="Ghế VIP"
                                        value={seatTypeForm.name}
                                        onChange={e => setSeatTypeForm({ ...seatTypeForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Màu Sắc Nhận Diện</label>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            className="w-12 h-12 p-0 border-0 rounded-2xl cursor-pointer absolute opacity-0 inset-0 z-10"
                                            value={seatTypeForm.seatColor}
                                            onChange={e => setSeatTypeForm({ ...seatTypeForm, seatColor: e.target.value })}
                                        />
                                        <div
                                            className="w-12 h-12 rounded-xl ring-2 ring-gray-100 pointer-events-none shadow-inner"
                                            style={{ backgroundColor: seatTypeForm.seatColor || '#000000' }}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all text-sm font-mono uppercase font-bold text-gray-700"
                                        value={seatTypeForm.seatColor || ''}
                                        onChange={e => setSeatTypeForm({ ...seatTypeForm, seatColor: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phụ Thu (VNĐ) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₫</span>
                                    <input
                                        type="number"
                                        className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all text-sm font-bold placeholder:font-normal text-gray-900"
                                        placeholder="10000"
                                        value={seatTypeForm.extraFee || ''}
                                        onChange={e => setSeatTypeForm({ ...seatTypeForm, extraFee: Number(e.target.value) })}
                                        step="1000"
                                        required
                                    />
                                </div>
                                {seatTypeForm.extraFee ? (
                                    <p className="text-[11px] font-bold text-amber-600 mt-2 uppercase tracking-wide">Quy đổi: {formatVND(seatTypeForm.extraFee)}</p>
                                ) : null}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6 !mt-6">
                                <button type="button" onClick={() => setIsSeatTypeModalOpen(false)} className="px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Hủy</button>
                                <button type="submit" className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-bold transition-colors shadow-sm active:scale-95">
                                    {seatTypeForm.id ? 'Cập Nhật' : 'Xác Nhận Tạo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
