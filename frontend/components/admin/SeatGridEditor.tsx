'use client';

import { useState, useEffect } from 'react';

export type SeatType = 'STANDARD' | 'VIP' | 'COUPLE' | 'DISABLED' | 'NONE';

export interface SeatCell {
    id: string; // e.g., "A1"
    row: number;
    col: number;
    type: SeatType;
    label: string;
}

interface SeatGridEditorProps {
    initialLayout?: string; // JSON string
    rows?: number;
    cols?: number;
    onSave: (layoutJson: string) => void;
}

export default function SeatGridEditor({ initialLayout, rows = 10, cols = 12, onSave }: SeatGridEditorProps) {
    const [grid, setGrid] = useState<SeatCell[][]>([]);
    const [selectedType, setSelectedType] = useState<SeatType>('STANDARD');
    const [rowCount, setRowCount] = useState(rows);
    const [colCount, setColCount] = useState(cols);

    useEffect(() => {
        if (initialLayout) {
            try {
                const parsed = JSON.parse(initialLayout);
                if (parsed.grid) {
                    setGrid(parsed.grid);
                    setRowCount(parsed.rows);
                    setColCount(parsed.cols);
                    return;
                }
            } catch (e) {
                console.error("Invalid layout JSON", e);
            }
        }
        initializeGrid(rows, cols);
    }, [initialLayout]);

    const initializeGrid = (r: number, c: number) => {
        const newGrid: SeatCell[][] = [];
        for (let i = 0; i < r; i++) {
            const row: SeatCell[] = [];
            const rowLabel = String.fromCharCode(65 + i); // A, B, C...
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
        setGrid(newGrid);
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

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                    <label>Rows:</label>
                    <input
                        type="number"
                        value={rowCount}
                        onChange={(e) => setRowCount(Number(e.target.value))}
                        className="border rounded p-1 w-16"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label>Cols:</label>
                    <input
                        type="number"
                        value={colCount}
                        onChange={(e) => setColCount(Number(e.target.value))}
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

                <div className="text-center mt-8 p-4 bg-zinc-200 rounded w-full text-zinc-500 font-bold tracking-widest uppercase">
                    Màn hình (Screen)
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
