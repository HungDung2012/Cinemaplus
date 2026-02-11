'use client';

import { useState, useEffect } from 'react';
import { adminRoomService } from '@/services/adminService';
import { pricingService } from '@/services/pricingService';
import { SeatTypeConfig } from '@/types';

export interface SeatDTO {
    id: number;
    rowName: string;
    seatNumber: number;
    seatType: string; // Changed from enum to string
    priceMultiplier: number;
    active: boolean;
    // We might need color here if provided by backend, 
    // but usually backend RoomDTO -> SeatDTO doesn't have color details directly unless mapped.
    // We will rely on fetching seat types config to know colors.
}

export interface RoomDTO {
    id: number;
    name: string;
    rowsCount: number;
    columnsCount: number;
    seats: SeatDTO[];
}

export type SeatType = string;

export interface SeatCell {
    id: string;
    row: number;
    col: number;
    type: SeatType;
    label: string;
    dbId?: number;
}

interface SeatGridEditorProps {
    roomId?: number;
    onSave: (layoutJson: string) => void;
}

export default function SeatGridEditor({ roomId, onSave }: SeatGridEditorProps) {
    const [grid, setGrid] = useState<SeatCell[][]>([]);
    const [selectedType, setSelectedType] = useState<SeatType>('STANDARD');
    const [rowCount, setRowCount] = useState(10);
    const [colCount, setColCount] = useState(10);
    const [loading, setLoading] = useState(true);
    const [seatTypes, setSeatTypes] = useState<SeatTypeConfig[]>([]);

    useEffect(() => {
        fetchSeatTypes();
    }, []);

    useEffect(() => {
        if (roomId) {
            fetchRoomDetail(roomId);
        } else {
            initializeGrid(10, 10);
            if (seatTypes.length > 0) setLoading(false);
        }
    }, [roomId, seatTypes.length]); // Wait for seat types to be loaded

    const fetchSeatTypes = async () => {
        try {
            const types = await pricingService.getAllSeatTypes();
            setSeatTypes(types);
            // Ensure STANDARD exists or pick first
            if (types.length > 0 && !types.find((t: SeatTypeConfig) => t.code === 'STANDARD')) {
                // If standard not in DB, we rely on what is there
            }
        } catch (error) {
            console.error("Error fetching seat types:", error);
        }
    };

    const fetchRoomDetail = async (id: number) => {
        setLoading(true);
        try {
            const room: RoomDTO = await adminRoomService.getById(id);
            if (room) {
                setRowCount(room.rowsCount);
                setColCount(room.columnsCount);

                const newGrid = createEmptyGrid(room.rowsCount, room.columnsCount);

                if (room.seats && room.seats.length > 0) {
                    fillGridWithSeats(newGrid, room.seats);
                }
                setGrid(newGrid);
            }
        } catch (error) {
            console.error("Error fetching room details:", error);
            initializeGrid(10, 10);
        } finally {
            setLoading(false);
        }
    };

    const createEmptyGrid = (r: number, c: number): SeatCell[][] => {
        const newGrid: SeatCell[][] = [];
        for (let i = 0; i < r; i++) {
            const row: SeatCell[] = [];
            const rowLabel = String.fromCharCode(65 + i);
            for (let j = 0; j < c; j++) {
                row.push({
                    id: `${rowLabel}${j + 1}`,
                    row: i,
                    col: j,
                    type: 'STANDARD', // Default to STANDARD, assume exists
                    label: `${rowLabel}${j + 1}`
                });
            }
            newGrid.push(row);
        }
        return newGrid;
    };

    const fillGridWithSeats = (grid: SeatCell[][], seats: SeatDTO[]) => {
        seats.forEach(seat => {
            const rowIndex = seat.rowName.charCodeAt(0) - 65;
            const colIndex = seat.seatNumber - 1;

            if (rowIndex >= 0 && rowIndex < grid.length && colIndex >= 0 && colIndex < grid[0].length) {
                grid[rowIndex][colIndex] = {
                    id: `${seat.rowName}${seat.seatNumber}`,
                    row: rowIndex,
                    col: colIndex,
                    type: seat.seatType, // This is the code string
                    label: `${seat.rowName}${seat.seatNumber}`,
                    dbId: seat.id
                };
            }
        });
    };

    const initializeGrid = (r: number, c: number) => {
        setGrid(createEmptyGrid(r, c));
    };

    const handleCellClick = (r: number, c: number) => {
        const newGrid = [...grid];
        newGrid[r][c].type = selectedType;
        if (selectedType === 'NONE') {
            newGrid[r][c].label = '';
        } else {
            const rowLabel = String.fromCharCode(65 + r);
            newGrid[r][c].label = `${rowLabel}${c + 1}`;
        }
        setGrid(newGrid);
    };

    const handleSave = () => {
        const layout = {
            rows: rowCount,
            cols: colCount,
            grid: grid
        };
        onSave(JSON.stringify(layout));
    };

    const resetGrid = () => {
        initializeGrid(rowCount, colCount);
    };

    const getSeatColor = (typeCode: string) => {
        if (typeCode === 'NONE') return 'transparent';
        const type = seatTypes.find(t => t.code === typeCode);
        return type ? type.seatColor : '#ccc'; // Default gray
    };

    if (loading) return <div>Loading seat map...</div>;

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                    <label>Rows:</label>
                    <input
                        type="number"
                        min="1"
                        value={rowCount}
                        onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setRowCount(val);
                        }}
                        className="border rounded p-1 w-16"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label>Cols:</label>
                    <input
                        type="number"
                        min="1"
                        value={colCount}
                        onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setColCount(val);
                        }}
                        className="border rounded p-1 w-16"
                    />
                </div>
                <button onClick={resetGrid} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Reset Grid</button>
            </div>

            <div className="flex gap-2 p-2 bg-gray-100 rounded-lg flex-wrap">
                {seatTypes.map(type => (
                    <button
                        key={type.code}
                        onClick={() => setSelectedType(type.code)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors border flex items-center gap-2 ${selectedType === type.code
                            ? 'bg-zinc-900 text-white shadow-sm'
                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                            }`}
                    >
                        <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: type.seatColor }}></div>
                        {type.name}
                    </button>
                ))}
                <button
                    onClick={() => setSelectedType('NONE')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors border ${selectedType === 'NONE'
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                >
                    Trống (None)
                </button>
            </div>

            <div className="overflow-auto border rounded-xl p-8 bg-zinc-50">
                <div className="text-center mb-8 p-4 bg-zinc-200 rounded w-full text-zinc-500 font-bold tracking-widest uppercase">
                    Màn hình (Screen)
                </div>
                <div
                    className="grid gap-1 mx-auto w-fit"
                    style={{
                        gridTemplateColumns: `repeat(${colCount}, minmax(40px, 1fr))`
                    }}
                >
                    {grid.map((row, i) => (
                        row.map((cell, j) => (
                            <button
                                key={`${i}-${j}`}
                                onClick={() => handleCellClick(i, j)}
                                className={`
                  w-10 h-10 rounded flex items-center justify-center text-xs font-bold transition-all
                  ${cell.type === 'NONE' ? 'opacity-0 pointer-events-none' : 'shadow-sm border border-gray-200'}
                `}
                                style={{
                                    backgroundColor: cell.type !== 'NONE' ? getSeatColor(cell.type) : 'transparent',
                                    color: cell.type !== 'NONE' ? '#fff' : 'inherit', // Should ideally contrast text
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                }}
                                title={`${cell.label} (${cell.type})`}
                            >
                                {cell.type !== 'NONE' && cell.label}
                            </button>
                        ))
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                    Lưu Sơ Đồ
                </button>
            </div>
        </div>
    );
}
