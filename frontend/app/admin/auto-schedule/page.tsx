'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { useToast } from '@/components/ui/Toast';
import {
  autoScheduleService,
  AutoScheduleRequest,
  AutoSchedulePreviewResponse,
  AutoScheduleResult,
  MovieSelection,
  ScheduleTemplate,
} from '@/services/autoScheduleService';
import { Movie, Theater } from '@/types';
import { adminMovieService, adminTheaterService } from '@/services/adminService';
import StepSelectVenue from './StepSelectVenue';
import StepConfigureSchedule from './StepConfigureSchedule';
import StepPreviewConfirm from './StepPreviewConfirm';

type Step = 0 | 1 | 2;
const STEP_LABELS: Record<Step, string> = {
  0: 'Chọn Rạp & Ngày',
  1: 'Chọn Phim & Template',
  2: 'Xem trước & Xác nhận',
};

export default function AutoSchedulePage() {
  const { toast: showToast } = useToast();

  // Wizard state
  const [step, setStep] = useState<Step>(0);

  // Step 1 state
  const [selectedTheaterIds, setSelectedTheaterIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 6), 'yyyy-MM-dd'));
  const [holidayDates, setHolidayDates] = useState<string[]>([]);

  // Step 2 state
  const [movieSelections, setMovieSelections] = useState<MovieSelection[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [weekdayTemplateId, setWeekdayTemplateId] = useState<number | null>(null);
  const [weekendTemplateId, setWeekendTemplateId] = useState<number | null>(null);
  const [holidayTemplateId, setHolidayTemplateId] = useState<number | null>(null);
  const [maxConcurrentScreenings, setMaxConcurrentScreenings] = useState(2);

  // Step 3 state
  const [previewData, setPreviewData] = useState<AutoSchedulePreviewResponse | null>(null);

  // Shared data
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [theaterData, movieData, templateData] = await Promise.all([
          adminTheaterService.getAll(),
          adminMovieService.getAll({ status: 'NOW_SHOWING', page: 0, size: 200 }),
          autoScheduleService.getTemplates(),
        ]);
        setTheaters(Array.isArray(theaterData) ? theaterData : theaterData?.content || []);
        setMovies(Array.isArray(movieData) ? movieData : movieData?.content || []);
        setTemplates(Array.isArray(templateData) ? templateData : []);
      } catch (err) {
        console.error('Failed to load data:', err);
        showToast('Lỗi tải dữ liệu', 'error');
      }
    };
    loadData();
  }, []);

  const reloadTemplates = useCallback(async () => {
    try {
      const data = await autoScheduleService.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to reload templates:', err);
    }
  }, []);

  // Build request object from wizard state
  const buildRequest = useCallback((): AutoScheduleRequest => {
    return {
      theaterIds: selectedTheaterIds,
      startDate,
      endDate,
      templateId: templateId ?? undefined,
      weekdayTemplateId: weekdayTemplateId ?? undefined,
      weekendTemplateId: weekendTemplateId ?? undefined,
      holidayTemplateId: holidayTemplateId ?? undefined,
      movieSelections,
      maxConcurrentScreenings,
      holidayDates: holidayDates.length > 0 ? holidayDates : undefined,
    };
  }, [selectedTheaterIds, startDate, endDate, templateId, weekdayTemplateId,
    weekendTemplateId, holidayTemplateId, movieSelections, maxConcurrentScreenings, holidayDates]);

  // Navigate to preview step and fetch preview
  const handleGoToPreview = useCallback(async () => {
    setIsLoading(true);
    try {
      const request = buildRequest();
      const preview = await autoScheduleService.preview(request);
      setPreviewData(preview);
      setStep(2);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi khi tạo bản xem trước';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [buildRequest, showToast]);

  // Execute auto-schedule
  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    try {
      const request = buildRequest();
      const result: AutoScheduleResult = await autoScheduleService.execute(request);
      showToast(
        `Tạo thành công ${result.totalCreated} suất chiếu cho ${result.totalTheaters} rạp!`,
        'success'
      );
      // Reset wizard
      setStep(0);
      setPreviewData(null);
      setMovieSelections([]);
      setSelectedTheaterIds([]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi khi thực hiện lập lịch';
      showToast(msg, 'error');
    } finally {
      setIsExecuting(false);
    }
  }, [buildRequest, showToast]);

  // Validate each step before allowing navigation
  const canGoNext = (): boolean => {
    if (step === 0) {
      return selectedTheaterIds.length > 0 && !!startDate && !!endDate;
    }
    if (step === 1) {
      const hasTemplate = templateId || weekdayTemplateId || weekendTemplateId || holidayTemplateId;
      return movieSelections.length > 0 && !!hasTemplate;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Lập lịch tự động</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tạo lịch chiếu hàng loạt cho nhiều rạp, nhiều ngày với template giờ chiếu
        </p>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          {([0, 1, 2] as Step[]).map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : step > s
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s + 1
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium hidden sm:inline ${
                    step === s ? 'text-blue-600' : step > s ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {STEP_LABELS[s]}
                </span>
              </div>
              {s < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    step > s ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {step === 0 && (
          <StepSelectVenue
            theaters={theaters}
            selectedTheaterIds={selectedTheaterIds}
            setSelectedTheaterIds={setSelectedTheaterIds}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            holidayDates={holidayDates}
            setHolidayDates={setHolidayDates}
          />
        )}

        {step === 1 && (
          <StepConfigureSchedule
            movies={movies}
            movieSelections={movieSelections}
            setMovieSelections={setMovieSelections}
            templates={templates}
            templateId={templateId}
            setTemplateId={setTemplateId}
            weekdayTemplateId={weekdayTemplateId}
            setWeekdayTemplateId={setWeekdayTemplateId}
            weekendTemplateId={weekendTemplateId}
            setWeekendTemplateId={setWeekendTemplateId}
            holidayTemplateId={holidayTemplateId}
            setHolidayTemplateId={setHolidayTemplateId}
            maxConcurrentScreenings={maxConcurrentScreenings}
            setMaxConcurrentScreenings={setMaxConcurrentScreenings}
            reloadTemplates={reloadTemplates}
          />
        )}

        {step === 2 && (
          <StepPreviewConfirm
            previewData={previewData}
            isExecuting={isExecuting}
            onExecute={handleExecute}
          />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setStep((prev) => Math.max(0, prev - 1) as Step)}
            disabled={step === 0}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium
              hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Quay lại
          </button>

          <div className="text-sm text-gray-500">
            Bước {step + 1} / 3
          </div>

          {step < 2 ? (
            <button
              onClick={() => {
                if (step === 1) {
                  handleGoToPreview();
                } else {
                  setStep((prev) => Math.min(2, prev + 1) as Step);
                }
              }}
              disabled={!canGoNext() || isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium
                hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  Tiếp theo →
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleExecute}
              disabled={isExecuting || !previewData || previewData.totalShowtimes === 0}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium
                hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                <>
                  ✓ Xác nhận & Lưu lịch chiếu
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom spacing for fixed nav */}
      <div className="h-20" />
    </div>
  );
}
