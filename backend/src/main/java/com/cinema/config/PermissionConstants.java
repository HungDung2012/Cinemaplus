package com.cinema.config;

import com.cinema.model.User;

import java.util.*;

/**
 * Định nghĩa hệ thống phân quyền RBAC cho rạp chiếu phim.
 * Mỗi Role được map tới một tập Permission cố định.
 * UserPrincipal sẽ dùng mapping này để tạo Spring Security authorities.
 */
public final class PermissionConstants {

    private PermissionConstants() {
    }

    // ===== PERMISSION NAMES =====
    // Quản lý nội dung
    public static final String MANAGE_MOVIES = "MANAGE_MOVIES";
    public static final String MANAGE_SHOWTIMES = "MANAGE_SHOWTIMES";
    public static final String MANAGE_PRICING = "MANAGE_PRICING";

    // Vận hành
    public static final String MANAGE_THEATERS = "MANAGE_THEATERS";
    public static final String MANAGE_ROOMS = "MANAGE_ROOMS";
    public static final String MANAGE_BOOKINGS = "MANAGE_BOOKINGS";
    public static final String MANAGE_FOODS = "MANAGE_FOODS";
    public static final String CREATE_BOOKING = "CREATE_BOOKING";
    public static final String CHECK_IN_TICKET = "CHECK_IN_TICKET";

    // Khách hàng
    public static final String MANAGE_USERS = "MANAGE_USERS";
    public static final String MANAGE_REVIEWS = "MANAGE_REVIEWS";

    // Ưu đãi
    public static final String MANAGE_PROMOTIONS = "MANAGE_PROMOTIONS";
    public static final String MANAGE_VOUCHERS = "MANAGE_VOUCHERS";
    public static final String MANAGE_COUPONS = "MANAGE_COUPONS";

    // Báo cáo & Hệ thống
    public static final String VIEW_ANALYTICS = "VIEW_ANALYTICS";
    public static final String VIEW_REPORTS = "VIEW_REPORTS";
    public static final String VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS";
    public static final String VIEW_DASHBOARD = "VIEW_DASHBOARD";

    // ===== ROLE → PERMISSIONS MAPPING =====
    private static final Map<User.Role, Set<String>> ROLE_PERMISSIONS = new EnumMap<>(User.Role.class);

    static {
        // ADMIN: toàn quyền
        ROLE_PERMISSIONS.put(User.Role.ADMIN, Set.of(
                MANAGE_MOVIES, MANAGE_SHOWTIMES, MANAGE_PRICING,
                MANAGE_THEATERS, MANAGE_ROOMS, MANAGE_BOOKINGS, MANAGE_FOODS,
                CREATE_BOOKING, CHECK_IN_TICKET,
                MANAGE_USERS, MANAGE_REVIEWS,
                MANAGE_PROMOTIONS, MANAGE_VOUCHERS, MANAGE_COUPONS,
                VIEW_ANALYTICS, VIEW_REPORTS, VIEW_AUDIT_LOGS, VIEW_DASHBOARD));

        // MANAGER: quản lý lịch chiếu, rạp, phòng, kho F&B, booking, khuyến mãi, báo
        // cáo chi nhánh
        ROLE_PERMISSIONS.put(User.Role.MANAGER, Set.of(
                MANAGE_MOVIES, MANAGE_SHOWTIMES,
                MANAGE_THEATERS, MANAGE_ROOMS,
                MANAGE_BOOKINGS, MANAGE_FOODS,
                CREATE_BOOKING, CHECK_IN_TICKET,
                MANAGE_PROMOTIONS,
                VIEW_ANALYTICS, VIEW_REPORTS, VIEW_DASHBOARD));

        // USER: không có quyền admin
        ROLE_PERMISSIONS.put(User.Role.USER, Collections.emptySet());
    }

    /**
     * Trả về danh sách permissions cho một role.
     */
    public static Set<String> getPermissions(User.Role role) {
        return ROLE_PERMISSIONS.getOrDefault(role, Collections.emptySet());
    }

    /**
     * Kiểm tra role có permission hay không.
     */
    public static boolean hasPermission(User.Role role, String permission) {
        return getPermissions(role).contains(permission);
    }

    /**
     * Trả về tất cả roles có quyền truy cập admin panel.
     */
    public static Set<User.Role> getAdminRoles() {
        return Set.of(User.Role.ADMIN, User.Role.MANAGER);
    }
}
