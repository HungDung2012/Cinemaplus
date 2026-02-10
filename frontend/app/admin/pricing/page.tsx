'use client';

import { useState, useEffect } from 'react';
import { pricingService, SeatTypeConfig } from '@/services/pricingService';
import { PriceHeader, PriceLine, Surcharge, CustomerType, DayType, TimeSlot, RoomType, SurchargeType } from '@/types';
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
        priceMultiplier: 1.0,
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
            console.error('Error fetching data:', error);
            toast.error('Failed to load pricing data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPriceLines = async (headerId: number) => {
        try {
            const lines = await pricingService.getPriceLinesByHeader(headerId);
            setPriceLines(lines);
        } catch (error) {
            console.error('Error fetching price lines:', error);
            toast.error('Failed to load price lines');
        }
    };

    // --- Headers Handling ---
    const handleHeaderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newHeader = await pricingService.createPriceHeader(headerForm as PriceHeader);
            setHeaders([...headers, newHeader]);
            setIsHeaderModalOpen(false);
            toast.success('Rate Card Created');
        } catch (error) {
            toast.error('Error creating rate card');
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

        // Optimistic update? Or direct API call?
        // Let's check if line exists
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
            // If price is 0 or empty, maybe delete? 
            // For now, always create/update
            const savedLine = await pricingService.createPriceLine(selectedHeaderId, lineData);

            // Update local state
            setPriceLines(prev => {
                const filtered = prev.filter(l =>
                    !(l.customerType === customerType &&
                        l.dayType === dayType &&
                        l.timeSlot === timeSlot &&
                        l.roomType === roomType)
                );
                return [...filtered, savedLine];
            });
            toast.success('Price updated');
        } catch (error) {
            toast.error('Failed to update price');
        }
    };

    // --- Surcharges Handling ---
    const handleSurchargeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newSurcharge = await pricingService.createSurcharge(surchargeForm as Surcharge);
            setSurcharges([...surcharges, newSurcharge]);
            setIsSurchargeModalOpen(false);
            toast.success('Surcharge Created');
        } catch (error) {
            toast.error('Error creating surcharge');
        }
    };

    const handleDeleteSurcharge = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await pricingService.deleteSurcharge(id);
            setSurcharges(surcharges.filter(s => s.id !== id));
            toast.success('Surcharge deleted');
        } catch (error) {
            toast.error('Error deleting surcharge');
        }
    };

    // --- Seat Types Handling ---
    const handleSeatTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newSeatType = await pricingService.createSeatType(seatTypeForm);
            setSeatTypes([...seatTypes, newSeatType]);
            setIsSeatTypeModalOpen(false);
            toast.success('Seat Type Created');
        } catch (error) {
            toast.error('Error creating seat type');
        }
    };

    const handleDeleteSeatType = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await pricingService.deleteSeatType(id);
            setSeatTypes(seatTypes.filter(s => s.id !== id));
            toast.success('Seat type deleted');
        } catch (error) {
            toast.error('Error deleting seat type');
        }
    };

    // --- Render Helpers ---
    const renderMatrix = (roomType: RoomType, dayType: DayType) => {
        // Rows: Customer Types, Cols: Time Slots
        const customerTypes: CustomerType[] = ['ADULT', 'STUDENT', 'MEMBER'];
        const timeSlots: TimeSlot[] = ['MORNING', 'DAY', 'EVENING', 'LATE'];

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            {timeSlots.map(slot => (
                                <th key={slot} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {slot}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customerTypes.map(customer => (
                            <tr key={customer}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{customer}</td>
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Pricing Management</h1>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === 'rate-card' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('rate-card')}
                >
                    Rate Cards
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'surcharge' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('surcharge')}
                >
                    Surcharges
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'seat-type' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('seat-type')}
                >
                    Seat Types
                </button>
            </div>

            {/* Content: Rate Cards */}
            {activeTab === 'rate-card' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <select
                            className="p-2 border rounded-lg min-w-[200px]"
                            value={selectedHeaderId || ''}
                            onChange={(e) => setSelectedHeaderId(Number(e.target.value))}
                        >
                            {headers.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setIsHeaderModalOpen(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            + New Rate Card
                        </button>
                    </div>

                    {selectedHeaderId && (
                        <div className="space-y-8">
                            {/* We need filters for Room Type and Day Type or show multiple tables */}
                            {/* Let's show tabs/sections for Day Types */}
                            {(['WEEKDAY', 'WEEKEND', 'HOLIDAY'] as DayType[]).map(dayType => (
                                <div key={dayType} className="border rounded-lg p-4 bg-gray-50">
                                    <h3 className="font-bold text-lg mb-4 text-gray-700">{dayType} Pricing</h3>
                                    <div className="space-y-4">
                                        {(['STANDARD_2D', 'STANDARD_3D', 'IMAX'] as RoomType[]).map(roomType => (
                                            <div key={roomType} className="bg-white p-4 rounded border">
                                                <h4 className="font-medium mb-2 text-gray-600">{roomType}</h4>
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
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            + New Surcharge
                        </button>
                    </div>
                    <table className="w-full bg-white border rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">Name</th>
                                <th className="px-6 py-3 text-left">Type</th>
                                <th className="px-6 py-3 text-left">Target ID</th>
                                <th className="px-6 py-3 text-left">Amount</th>
                                <th className="px-6 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {surcharges.map(s => (
                                <tr key={s.id} className="border-t">
                                    <td className="px-6 py-4">{s.name}</td>
                                    <td className="px-6 py-4">{s.type}</td>
                                    <td className="px-6 py-4">{s.targetId}</td>
                                    <td className="px-6 py-4 font-bold text-red-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDeleteSurcharge(s.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Content: Seat Types */}
            {activeTab === 'seat-type' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setIsSeatTypeModalOpen(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            + New Seat Type
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {seatTypes.map(st => (
                            <div key={st.id} className="border rounded-xl p-6 relative overflow-hidden bg-white shadow-sm">
                                <div className="absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45"
                                    style={{ backgroundColor: st.seatColor }} />
                                <h3 className="text-lg font-bold">{st.name}</h3>
                                <p className="text-gray-500">Code: {st.code}</p>
                                <div className="mt-4 text-sm text-gray-600">
                                    <p>Multiplier: x{st.priceMultiplier}</p>
                                    <p>Extra Fee: {st.extraFee}</p>
                                </div>
                                <button
                                    onClick={() => st.id && handleDeleteSeatType(st.id)}
                                    className="mt-4 text-red-600 text-sm hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            {isHeaderModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Rate Card</h2>
                        <form onSubmit={handleHeaderSubmit}>
                            <input
                                className="w-full mb-3 p-2 border rounded"
                                placeholder="Name (e.g. Standard 2024)"
                                value={headerForm.name}
                                onChange={e => setHeaderForm({ ...headerForm, name: e.target.value })}
                                required
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsHeaderModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSurchargeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Surcharge</h2>
                        <form onSubmit={handleSurchargeSubmit} className="space-y-3">
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="Name (e.g. VIP Seat)"
                                value={surchargeForm.name}
                                onChange={e => setSurchargeForm({ ...surchargeForm, name: e.target.value })}
                                required
                            />
                            <select
                                className="w-full p-2 border rounded"
                                value={surchargeForm.type}
                                onChange={e => setSurchargeForm({ ...surchargeForm, type: e.target.value as SurchargeType })}
                            >
                                <option value="SEAT_TYPE">Seat Type</option>
                                <option value="format_3d">3D Format</option>
                                <option value="DATE_TYPE">Date Type</option>
                            </select>
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="Target ID (e.g. VIP)"
                                value={surchargeForm.targetId}
                                onChange={e => setSurchargeForm({ ...surchargeForm, targetId: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                className="w-full p-2 border rounded"
                                placeholder="Amount"
                                value={surchargeForm.amount}
                                onChange={e => setSurchargeForm({ ...surchargeForm, amount: Number(e.target.value) })}
                                required
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsSurchargeModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSeatTypeModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Seat Type</h2>
                        <form onSubmit={handleSeatTypeSubmit} className="space-y-3">
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="Code (e.g. VIP)"
                                value={seatTypeForm.code}
                                onChange={e => setSeatTypeForm({ ...seatTypeForm, code: e.target.value })}
                                required
                            />
                            <input
                                className="w-full p-2 border rounded"
                                placeholder="Name"
                                value={seatTypeForm.name}
                                onChange={e => setSeatTypeForm({ ...seatTypeForm, name: e.target.value })}
                                required
                            />
                            <input
                                type="color"
                                className="w-full h-10 p-1 border rounded"
                                value={seatTypeForm.seatColor}
                                onChange={e => setSeatTypeForm({ ...seatTypeForm, seatColor: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsSeatTypeModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
