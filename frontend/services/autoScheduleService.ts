import api from '@/lib/axios';

// ===================== TYPES =====================

export type DayType = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';

export interface ScheduleTemplateSlot {
  id?: number;
  startTime: string; // HH:mm
  label?: string;
  priority: number;
}

export interface ScheduleTemplate {
  id: number;
  name: string;
  dayType: DayType;
  cleaningMinutes: number;
  bufferMinutes: number;
  adsMinutes: number;
  active: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  slots: ScheduleTemplateSlot[];
}

export interface ScheduleTemplateRequest {
  name: string;
  dayType: DayType;
  cleaningMinutes: number;
  bufferMinutes: number;
  adsMinutes: number;
  active?: boolean;
  slots: {
    startTime: string;
    label?: string;
    priority?: number;
  }[];
}

export interface MovieSelection {
  movieId: number;
  priority: number; // 1-5
  preferredRoomTypes?: string[];
  excludeRoomIds?: number[];
}

export interface AutoScheduleRequest {
  theaterIds: number[];
  startDate: string; // yyyy-MM-dd
  endDate: string;
  templateId?: number;
  weekdayTemplateId?: number;
  weekendTemplateId?: number;
  holidayTemplateId?: number;
  movieSelections: MovieSelection[];
  maxConcurrentScreenings: number;
  holidayDates?: string[];
}

export interface SlotPreview {
  roomId: number;
  roomName: string;
  roomType: string;
  movieId: number;
  movieTitle: string;
  movieDuration: number;
  startTime: string;
  endTime: string;
  format: string;
}

export interface DateSchedulePreview {
  date: string;
  dayType: DayType;
  showtimeCount: number;
  slots: SlotPreview[];
}

export interface TheaterSchedulePreview {
  theaterId: number;
  theaterName: string;
  showtimeCount: number;
  byDate: DateSchedulePreview[];
}

export interface ConflictDetail {
  theaterId: number;
  theaterName: string;
  roomId: number;
  roomName: string;
  date: string;
  slotTime: string;
  movieTitle: string;
  reason: string;
}

export interface AutoSchedulePreviewResponse {
  totalShowtimes: number;
  totalConflictsSkipped: number;
  totalWarnings: number;
  byTheater: TheaterSchedulePreview[];
  conflicts: ConflictDetail[];
  warnings: string[];
}

export interface AutoScheduleResult {
  totalCreated: number;
  totalSkipped: number;
  totalTheaters: number;
  totalDays: number;
  message: string;
  conflicts: ConflictDetail[];
}

// ===================== API SERVICE =====================

export const autoScheduleService = {
  // Auto-schedule
  preview: async (request: AutoScheduleRequest): Promise<AutoSchedulePreviewResponse> => {
    const response = await api.post('/admin/auto-schedule/preview', request);
    return response.data?.data;
  },

  execute: async (request: AutoScheduleRequest): Promise<AutoScheduleResult> => {
    const response = await api.post('/admin/auto-schedule/execute', request);
    return response.data?.data;
  },

  // Templates
  getTemplates: async (dayType?: DayType): Promise<ScheduleTemplate[]> => {
    const params = dayType ? { dayType } : {};
    const response = await api.get('/admin/auto-schedule/templates', { params });
    return response.data?.data;
  },

  getTemplateById: async (id: number): Promise<ScheduleTemplate> => {
    const response = await api.get(`/admin/auto-schedule/templates/${id}`);
    return response.data?.data;
  },

  createTemplate: async (request: ScheduleTemplateRequest): Promise<ScheduleTemplate> => {
    const response = await api.post('/admin/auto-schedule/templates', request);
    return response.data?.data;
  },

  updateTemplate: async (id: number, request: ScheduleTemplateRequest): Promise<ScheduleTemplate> => {
    const response = await api.put(`/admin/auto-schedule/templates/${id}`, request);
    return response.data?.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/admin/auto-schedule/templates/${id}`);
  },
};
