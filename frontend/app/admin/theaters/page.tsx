"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  MapPin,
  Phone,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Armchair,
  Filter,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { adminTheaterService } from "@/services/adminService";

interface Theater {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  imageUrl: string;
  active: boolean;
  totalRooms: number;
  cityName: string;
  regionName: string;
}

export default function TheatersPage() {
  const router = useRouter();
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [theaterToDelete, setTheaterToDelete] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchTheaters();
  }, []);

  const fetchTheaters = async () => {
    try {
      const data = await adminTheaterService.getAll();
      setTheaters(data);
    } catch (error) {
      console.error("Error fetching theaters:", error);
      toast.error("Không thể tải danh sách rạp");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!theaterToDelete) return;

    try {
      await adminTheaterService.delete(theaterToDelete);
      toast.success("Xóa rạp thành công");
      fetchTheaters();
      setShowDeleteModal(false);
      setTheaterToDelete(null);
    } catch (error) {
      console.error("Error deleting theater:", error);
      toast.error("Không thể xóa rạp");
    }
  };

  // Extract unique cities for filter
  const cities = ["All", ...Array.from(new Set(theaters.map(t => t.cityName).filter(Boolean)))];

  const filteredTheaters = theaters.filter((theater) => {
    const matchesSearch =
      theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      theater.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === "All" || theater.cityName === cityFilter;

    return matchesSearch && matchesCity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Rạp chiếu</h1>
          <p className="text-gray-500 mt-1">Danh sách các rạp chiếu phim trong hệ thống</p>
        </div>
        <Link
          href="/admin/theaters/create"
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm rạp mới</span>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên rạp, địa chỉ..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            {cities.map(city => (
              <option key={city} value={city}>{city === "All" ? "Tất cả thành phố" : city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Theaters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên rạp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành phố</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng chiếu</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTheaters.length > 0 ? (
                filteredTheaters.map((theater) => (
                  <tr key={theater.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">{theater.name}</div>
                          <div className="text-xs text-gray-500 md:hidden">{theater.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {theater.cityName}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={theater.address}>
                      {theater.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {theater.totalRooms}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${theater.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {theater.active ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTheater(theater);
                            setShowDetailModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <Link
                          href={`/admin/theaters/${theater.id}/rooms`}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Quản lý phòng chiếu"
                        >
                          <Armchair className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/admin/theaters/${theater.id}/edit`}
                          className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => {
                            setTheaterToDelete(theater.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>Không tìm thấy rạp chiếu nào phù hợp</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {mounted && showDetailModal && selectedTheater && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="relative h-48 bg-gray-200">
              {selectedTheater.imageUrl ? (
                <img
                  src={selectedTheater.imageUrl}
                  alt={selectedTheater.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <Building2 className="w-16 h-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-2xl font-bold">{selectedTheater.name}</h3>
                <p className="text-white/90 flex items-center text-sm mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {selectedTheater.cityName}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Địa chỉ</label>
                  <p className="text-gray-900 mt-1">{selectedTheater.address}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Số điện thoại</label>
                  <p className="text-gray-900 mt-1 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {selectedTheater.phone}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Trạng thái</label>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedTheater.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {selectedTheater.active ? 'Đang hoạt động' : 'Tạm ngưng'}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tổng số phòng</label>
                  <p className="text-gray-900 mt-1">{selectedTheater.totalRooms}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Khu vực</label>
                  <p className="text-gray-900 mt-1">{selectedTheater.regionName}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Mô tả</label>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {selectedTheater.description || "Chưa có mô tả"}
                </p>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                <Link
                  href={`/admin/theaters/${selectedTheater.id}/rooms`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Quản lý phòng chiếu
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal */}
      {mounted && showDeleteModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-500 mb-6">
              Bạn có chắc chắn muốn xóa rạp chiếu này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
