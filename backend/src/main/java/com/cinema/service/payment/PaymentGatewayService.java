package com.cinema.service.payment;

import com.cinema.dto.payment.IpnResult;
import com.cinema.dto.payment.PaymentGatewayRequest;
import com.cinema.dto.payment.PaymentGatewayResponse;

import java.util.Map;

/**
 * Strategy Interface cho các cổng thanh toán.
 * Mỗi cổng (VNPay, MoMo, ZaloPay) sẽ implement interface này.
 * 
 * Tuân thủ Open/Closed Principle: thêm cổng mới chỉ cần tạo class mới
 * implement interface này, không cần sửa code cũ.
 */
public interface PaymentGatewayService {

    /**
     * Tạo URL thanh toán để redirect người dùng đến cổng thanh toán.
     *
     * @param request thông tin đơn hàng cần thanh toán
     * @return response chứa paymentUrl và transactionId
     */
    PaymentGatewayResponse createPaymentUrl(PaymentGatewayRequest request);

    /**
     * Xác thực và xử lý IPN callback từ cổng thanh toán.
     * Bao gồm verify signature (HMAC_SHA256) để đảm bảo request hợp lệ.
     *
     * @param params tất cả query params hoặc body params từ cổng gọi về
     * @return kết quả xử lý IPN
     */
    IpnResult processIpn(Map<String, String> params);

    /**
     * Xác thực chữ ký bảo mật (signature) của request từ cổng thanh toán.
     * Phải kiểm tra HMAC_SHA256/SHA512 trước khi tin tưởng dữ liệu.
     *
     * @param params raw params từ cổng thanh toán gọi về
     * @return true nếu chữ ký hợp lệ
     */
    boolean verifySignature(Map<String, String> params);

    /**
     * Trả về PaymentMethod tương ứng mà gateway này xử lý.
     * Dùng bởi Factory để mapping.
     */
    com.cinema.model.Payment.PaymentMethod getPaymentMethod();
}
