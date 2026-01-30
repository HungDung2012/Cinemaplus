'use client';

import { useState, useEffect } from 'react';

import { adminRoomService } from '@/services/adminService';

export interface SeatDTO {
    id: number;
    rowName: string;
    seatNumber: number;
    seatType: SeatType;
    priceMultiplier: number;
    active: boolean;
}

export interface RoomDTO {
    id: number;
    name: string;
    rowsCount: number;
    columnsCount: number;
    seats: SeatDTO[];
}

export type SeatType = 'STANDARD' | 'VIP' | 'COUPLE' | 'DISABLED' | 'NONE';

export interface SeatCell {
    id: string;
    row: number;
    col: number;
    type: SeatType;
    label: string;
    dbId?: number; // Store DB ID if exists
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

    useEffect(() => {
        if (roomId) {
            fetchRoomDetail(roomId);
        } else {
            initializeGrid(10, 10);
            setLoading(false);
        }
    }, [roomId]);

    const fetchRoomDetail = async (id: number) => {
        setLoading(true);
        try {
            const room: RoomDTO = await adminRoomService.getById(id);
            if (room) {
                setRowCount(room.rowsCount);
                setColCount(room.columnsCount);

                // Initialize empty grid first
                const newGrid = createEmptyGrid(room.rowsCount, room.columnsCount);

                // Map existing seats to grid
                if (room.seats && room.seats.length > 0) {
                    fillGridWithSeats(newGrid, room.seats);
                }
                setGrid(newGrid);
            }
        } catch (error) {
            console.error("Error fetching room details:", error);
            // Fallback to default empty grid
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
                    type: 'STANDARD',
                    label: `${rowLabel}${j + 1}`
                });
            }
            newGrid.push(row);
        }
        return newGrid;
    };

    const fillGridWithSeats = (grid: SeatCell[][], seats: SeatDTO[]) => {
        seats.forEach(seat => {
            // Calculate indices from rowName and seatNumber
            // Assuming rowName is A, B, C...
            const rowIndex = seat.rowName.charCodeAt(0) - 65;
            const colIndex = seat.seatNumber - 1; // 1-based to 0-based

            if (rowIndex >= 0 && rowIndex < grid.length && colIndex >= 0 && colIndex < grid[0].length) {
                grid[rowIndex][colIndex] = {
                    id: `${seat.rowName}${seat.seatNumber}`,
                    row: rowIndex,
                    col: colIndex,
                    type: seat.seatType,
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

            <div className="flex gap-2 p-2 bg-gray-100 rounded-lg">
                {(['STANDARD', 'VIP', 'COUPLE', 'DISABLED', 'NONE'] as SeatType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === type
                            ? 'bg-zinc-900 text-white shadow-sm'
                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                            }`}
                    >
                        {type}
                    </button>
                ))}
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
                  ${cell.type === 'STANDARD' ? 'bg-white border-2 border-zinc-300 text-zinc-900 hover:border-blue-500' : ''}
                  ${cell.type === 'VIP' ? 'bg-yellow-100 border-2 border-yellow-400 text-yellow-800' : ''}
                  ${cell.type === 'COUPLE' ? 'bg-pink-100 border-2 border-pink-400 text-pink-800 col-span-1' : ''}
                  ${cell.type === 'DISABLED' ? 'bg-blue-100 border-2 border-blue-400 text-blue-800' : ''}
                  ${cell.type === 'NONE' ? 'opacity-0 pointer-events-none' : ''}
                `}
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
