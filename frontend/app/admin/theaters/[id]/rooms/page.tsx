'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminTheaterService, adminRoomService } from '@/services/adminService';

interface Room {
  id: number;
  name: string;
  capacity: number;
  roomType: string;
  status: string;
}

interface Theater {
  id: number;
  name: string;
}

const ROOM_TYPES = [
  { value: 'STANDARD', label: '2D' },
  { value: 'IMAX', label: 'IMAX' },
  { value: '3D', label: '3D' },
  { value: '4DX', label: '4DX' },
  { value: 'VIP', label: 'VIP' },
  { value: 'SWEETBOX', label: 'Sweetbox' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
];

export default function TheaterRoomsPage() {
  const params = useParams();
  const theaterId = params.id as string;

  const [theater, setTheater] = useState<Theater | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    roomType: 'STANDARD',
    status: 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [theaterId]);

  const fetchData = async () => {
    try {
      const [theaterRes, roomsRes] = await Promise.all([
        adminTheaterService.getById(Number(theaterId)),
        adminRoomService.getByTheater(Number(theaterId)),
      ]);
      setTheater(theaterRes);
      setRooms(roomsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({ name: '', capacity: '', roomType: 'STANDARD', status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity.toString(),
      roomType: room.roomType,
      status: room.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        capacity: parseInt(formData.capacity),
        theaterId: parseInt(theaterId),
      };

      if (editingRoom) {
        await adminRoomService.update(editingRoom.id, data);
      } else {
        await adminRoomService.create(data);
      }

      await fetchData();
      setModalOpen(false);
    } catch (error: any) {
      console.error('Error saving room:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.room) return;

    try {
      await adminRoomService.delete(deleteModal.room.id);
      setRooms(rooms.filter(r => r.id !== deleteModal.room?.id));
      setDeleteModal({ open: false, room: null });
    } catch (error: any) {
      console.error('Error deleting room:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa phòng chiếu');
    }
  };

  const getRoomTypeLabel = (type: string) => {
    return ROOM_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-700';
      case 'INACTIVE': return 'bg-red-100 text-red-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/theaters"
          className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900">Phòng chiếu - {theater?.name}</h1>
          <p className="text-zinc-500 mt-1">Quản lý các phòng chiếu của rạp</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm phòng
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-zinc-900 text-lg">{room.name}</h3>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(room.status)}`}>
                  {getStatusLabel(room.status)}
                </span>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {getRoomTypeLabel(room.roomType)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-zinc-600 mb-4">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{room.capacity} ghế</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(room)}
                className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => setDeleteModal({ open: true, room })}
                className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
          <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p className="text-zinc-500">Chưa có phòng chiếu nào</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thêm phòng chiếu đầu tiên
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              {editingRoom ? 'Chỉnh sửa phòng chiếu' : 'Thêm phòng chiếu mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Tên phòng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Phòng 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Sức chứa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Loại phòng
                </label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {ROOM_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  {editingRoom ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Xác nhận xóa</h3>
            <p className="text-zinc-600 mb-6">
              Bạn có chắc chắn muốn xóa phòng <span className="font-medium">{deleteModal.room?.name}</span>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ open: false, room: null })}
                className="px-4 py-2 text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
