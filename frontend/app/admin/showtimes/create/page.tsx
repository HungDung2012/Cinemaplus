import CreateShowtimeForm from "@/components/admin/CreateShowtimeForm";
import React from 'react';

export default function CreateShowtimePage() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Thêm Lịch Chiếu Mới</h1>
            </div>
            <CreateShowtimeForm />
        </div>
    );
}
