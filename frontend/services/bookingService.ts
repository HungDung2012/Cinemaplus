import { api } from '@/lib/axios';
import { ApiResponse, Booking, BookingRequest, Payment, PaymentRequest, CalculatePriceRequest, CalculatedPriceResponse } from '@/types';

export const bookingService = {
  async createBooking(data: BookingRequest): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>('/bookings', data);
    return response.data.data;
  },

  async getUserBookings(): Promise<Booking[]> {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings/my-bookings');
    return response.data.data;
  },

  async getBookingById(id: number): Promise<Booking> {
    const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return response.data.data;
  },

  async getBookingByCode(code: string): Promise<Booking> {
    const response = await api.get<ApiResponse<Booking>>(`/bookings/code/${code}`);
    return response.data.data;
  },

  async cancelBooking(id: number): Promise<Booking> {
    const response = await api.post<ApiResponse<Booking>>(`/bookings/${id}/cancel`);
    return response.data.data;
  },

  async calculatePrice(data: CalculatePriceRequest): Promise<CalculatedPriceResponse> {
    const response = await api.post<ApiResponse<CalculatedPriceResponse>>('/bookings/calculate-price', data);
    return response.data.data;
  }
};

export const paymentService = {
  async createPayment(data: PaymentRequest): Promise<Payment> {
    const response = await api.post<ApiResponse<Payment>>('/payments', data);
    return response.data.data;
  },

  async processPayment(id: number): Promise<Payment> {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/process`);
    return response.data.data;
  },

  async getPaymentByBookingId(bookingId: number): Promise<Payment> {
    const response = await api.get<ApiResponse<Payment>>(`/payments/booking/${bookingId}`);
    return response.data.data;
  }
};
