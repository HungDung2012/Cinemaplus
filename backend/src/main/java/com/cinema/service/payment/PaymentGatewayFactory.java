package com.cinema.service.payment;

import com.cinema.model.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Factory Pattern: tạo instance PaymentGatewayService dựa trên PaymentMethod.
 * 
 * Spring tự động inject tất cả bean implement PaymentGatewayService,
 * Factory build map {PaymentMethod -> Service} để lookup O(1).
 */
@Component
@Slf4j
public class PaymentGatewayFactory {

    private final Map<Payment.PaymentMethod, PaymentGatewayService> gatewayMap;

    /**
     * Constructor injection: Spring tự inject tất cả bean PaymentGatewayService.
     * Mỗi bean tự khai báo getPaymentMethod() → dùng để build lookup map.
     */
    public PaymentGatewayFactory(List<PaymentGatewayService> gateways) {
        this.gatewayMap = gateways.stream()
                .collect(Collectors.toMap(
                        PaymentGatewayService::getPaymentMethod,
                        Function.identity()
                ));
        log.info("Registered {} payment gateways: {}", gatewayMap.size(), gatewayMap.keySet());
    }

    /**
     * Lấy PaymentGatewayService tương ứng với payment method.
     *
     * @param method VNPAY, MOMO, ZALOPAY
     * @return service tương ứng
     * @throws IllegalArgumentException nếu method không được hỗ trợ
     */
    public PaymentGatewayService getGateway(Payment.PaymentMethod method) {
        PaymentGatewayService gateway = gatewayMap.get(method);
        if (gateway == null) {
            throw new IllegalArgumentException(
                    "Payment gateway not supported: " + method + 
                    ". Supported: " + gatewayMap.keySet());
        }
        return gateway;
    }

    /**
     * Kiểm tra xem payment method có phải online gateway (cần redirect) hay không.
     */
    public boolean isOnlineGateway(Payment.PaymentMethod method) {
        return gatewayMap.containsKey(method);
    }
}
