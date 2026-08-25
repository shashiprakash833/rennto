from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

urlpatterns = [

    # =====================================================
    # JWT AUTHENTICATION
    # =====================================================
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('save-push-token/', views.save_push_token, name='save_push_token'),

    # =====================================================
    # ADMIN MODULE
    # =====================================================
    path('send-admin-otp/', views.send_admin_otp),
    path('verify-admin-otp/', views.verify_admin_otp),
    path('admin-password/', views.admin_password_login),
    path('check-admin-password-status/', views.check_admin_password_status),
    path('admin-forgot-password/', views.forgot_admin_password),
    path('admin-login/', views.admin_login),
    path('admin_home/', views.admin_home),
    path("admin/system-settings/",views.admin_system_settings,name="admin_system_settings",),

    path('owner-admin/', views.owner_admin_list),
    path('all-owners-data/', views.get_all_steps_data),
    path('update_status/', views.update_status),
    path('suspension_reason/', views.suspension_reason),
    path('get_suspension_reason/<str:phone>/', views.get_suspension_reason),

    # =====================================================
    # OWNER AUTHENTICATION
    # =====================================================
    path('owner/', views.register_owner),
    path('verify/', views.owner_login),
    path('check-owner/<str:phone>/', views.check_owner),
    path('check-owner-status/<str:phone>/', views.check_owner_status),
    path('owner-status/<str:pk>/', views.update_owner_status),

    # =====================================================
    # TENANT AUTHENTICATION
    # =====================================================
    path('tenent/', views.register_tenent),
    path('login/', views.tenant_login),
    path('send-otp/', views.send_otp),
    path('verify-otp/', views.verify_otp),
    path('check-user/<str:phone>/', views.check_user),

    # =====================================================
    # OWNER PROPERTY SETUP
    # =====================================================
    path('details/<str:phone>/', views.get_hostel_step3),
    path('owner/property-images/', views.manage_property_images),
    path('update_building_layout/<str:phone>/', views.update_building_layout),

    # =====================================================
    # BUILDING LAYOUT
    # =====================================================
    path('building/add-floor/', views.add_floor),
    path('building/delete-floor/<str:owner_phone>/<int:floor_no>/', views.delete_floor),
    path('building/add-unit/', views.add_unit),
    path('building/update-beds/', views.update_beds),
    path('building/delete-unit/', views.delete_unit),
    path('building/save-layout/', views.save_layout),

    # =====================================================
    # PROPERTY LISTING
    # =====================================================
    path('owner_props/', views.get_properties_listing),
    path('get_all_property_basic_details/', views.get_all_property_basic_details),

    # =====================================================
    # BOOKING REQUESTS
    # =====================================================
    path('send_request/', views.send_join_request),
    path('existing_tenant_request/', views.existing_tenant_request),
    path('check_request_status/<str:tenant_phone>/<str:owner_phone>/<str:property_name>/', views.check_request_status),
    path('withdraw_request/', views.withdraw_request),
    path('owner_requests/<str:phone>/', views.owner_requests),
    path('update_request_status/', views.update_request_status),
    path('clear_owner_request/<int:request_id>/', views.clear_owner_request),

    # Hostel Change / Advance Booking Requests
    path('hostel-change/create/', views.create_hostel_change_request),
    path('hostel-change/check-status/<str:tenant_phone>/<int:target_hostel_id>/', views.check_hostel_booking_status),
    path('hostel-change/pending/<str:owner_id>/', views.get_pending_hostel_change_requests),
    path('hostel-change/all/<str:owner_id>/', views.get_all_owner_hostel_change_requests),
    path('hostel-change/approve/<int:request_id>/', views.approve_hostel_change_request),
    path('hostel-change/reject/<int:request_id>/', views.reject_hostel_change_request),
    path('hostel-change/cancel/<int:request_id>/', views.cancel_hostel_change_request),
    path('hostel-change/my-requests/<str:tenant_phone>/', views.get_tenant_hostel_change_requests),

    path('api/hostel-change/create/', views.create_hostel_change_request),
    path('api/hostel-change/check-status/<str:tenant_phone>/<int:target_hostel_id>/', views.check_hostel_booking_status),
    path('api/hostel-change/pending/<str:owner_id>/', views.get_pending_hostel_change_requests),
    path('api/hostel-change/all/<str:owner_id>/', views.get_all_owner_hostel_change_requests),
    path('api/hostel-change/approve/<int:request_id>/', views.approve_hostel_change_request),
    path('api/hostel-change/reject/<int:request_id>/', views.reject_hostel_change_request),
    path('api/hostel-change/cancel/<int:request_id>/', views.cancel_hostel_change_request),
    path('api/hostel-change/my-requests/<str:tenant_phone>/', views.get_tenant_hostel_change_requests),


    # =====================================================
    # VACATE REQUESTS
    # =====================================================
    path('vacate/request/', views.vacate_request_create),
    path('vacate/requests/', views.vacate_request_list),
    path('vacate/request/<int:pk>/', views.vacate_request_detail),
    path('vacate/request/<int:pk>/approve/', views.vacate_request_approve),
    path('vacate/request/<int:pk>/decline/', views.vacate_request_decline),

    path('api/vacate/request/', views.vacate_request_create),
    path('api/vacate/requests/', views.vacate_request_list),
    path('api/vacate/request/<int:pk>/', views.vacate_request_detail),
    path('api/vacate/request/<int:pk>/approve/', views.vacate_request_approve),
    path('api/vacate/request/<int:pk>/decline/', views.vacate_request_decline),

    path('tenant/join_booking/', views.tenant_join_booking),
    path('tenant/pending_allotment/<str:phone>/', views.get_pending_allotment),
    path('delete_tenent_request/<str:phone>/', views.delete_tenent_request),

    # =====================================================
    # ROOM / BED MANAGEMENT
    # =====================================================
    path('tenentbeds/', views.registerbeds),
    path('apartmentbeds/', views.registerapartmentbeds),
    path('commercialbeds/', views.registercommercialbeds),

    path('getbeds/<str:phone>/', views.get_tenantsbeds),
    path('getapartmentbeds/<str:phone>/', views.get_apartmentbeds),
    path('getcommercialbeds/<str:phone>/', views.get_commercialbeds),

    path('updatehostel/<int:id>/', views.update_hostel_tenant),
    path('updateapartment/<int:id>/', views.update_apartment_tenant),
    path('updatecommercial/<int:id>/', views.update_commercial_tenant),

    path('deletehostel/<int:id>/', views.delete_hostel_tenant),
    path('deleteapartment/<int:id>/', views.delete_apartment_tenant),
    path('deletecommercial/<int:id>/', views.delete_commercial_tenant),

    # =====================================================
    # TENANT DASHBOARD
    # =====================================================
    path('tenantdetails/<str:phone>/', views.tenantdetails),
    path('payment-details/<str:phone>/', views.get_tenant_payment_details),
    path('tenant-payment-history/<str:phone>/', views.get_tenant_payment_history),

    # =====================================================
    # OWNER DASHBOARD
    # =====================================================
    path('owner_data/<str:pk>/', views.get_owner_full_details),
    path('owner_accounts/<str:phone>/', views.get_owner_accounts),
    path('owner-tenants/<str:phone>/', views.get_owner_tenants),

    # =====================================================
    # ISSUES
    # =====================================================
    path('create-issue/', views.create_issue),
    path('owner-issues/<str:phone>/', views.owner_issues),
    path('tenant-issues/<str:identifier>/', views.tenant_issues),
    path('update-issue/<int:id>/', views.update_issue),
    path('update-issue-status/<int:issue_id>/', views.update_issue_status),
    path('update-issue-comment/<int:issue_id>/', views.update_issue_comment),
    path('delete-issue/<int:issue_id>/', views.delete_issue),
    path('test-create-issue/', views.test_create_issue),

    # =====================================================
    # PAYMENTS
    # =====================================================
    path('create-payment/', views.create_payment),
    path('upload-payment-screenshot/', views.upload_payment_screenshot),
    path('cash-payment/', views.cash_payment),
    path('payment-status/<str:txn_ref>/', views.check_payment_status),
    path('update-payment/', views.update_payment_status),
    path('owner-payments/<str:phone>/', views.get_owner_payments),

    # =====================================================
    # NOTIFICATIONS
    # =====================================================
    path('send-owner-notification/', views.send_owner_notification),
    path('send-tenant-notification/', views.send_tenant_notification),
    path('notifications/unread-count/', views.get_unread_notification_count),
    path('notifications/<str:phone>/', views.get_notifications),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read),
    path('notifications/<str:phone>/mark-all-read/', views.mark_all_notifications_read),
    path('tenant_notifications/<str:identifier>/', views.tenant_notifications),

    # =====================================================
    # OWNER EXPENSES
    # =====================================================
    path('add-expense/', views.add_expense),
    path('owner-expenses/<str:owner_id>/', views.get_owner_expenses),
     path('update-expense/<int:expense_id>/', views.update_expense),
    path('delete-expense/<int:expense_id>/', views.delete_expense),

    # =====================================================
    # TENANT VERIFICATION
    # =====================================================
    path('tenant/submit_verification/', views.tenant_submit_verification),
    path('tenant/co_residents/<str:phone>/', views.get_co_residents),

    # =====================================================
    # BLOCK / UNBLOCK TENANTS
    # =====================================================
    path('block_tenant/', views.block_tenant),
    path('unblock_tenant/', views.unblock_tenant),

    # =====================================================
    # PROFILE
    # =====================================================
    path('owner_profile_update/<str:phone>/', views.owner_profile_update),
    path('tenant_profile_update/<str:phone>/', views.tenant_profile_update),

    # =====================================================
    # OWNER MULTI-ACCOUNT
    # =====================================================
    path('owner/accounts/', views.get_owner_accounts_list),
    path('owner/accounts/add/', views.add_owner_account),
    path('owner/accounts/switch/', views.switch_owner_account),
    path('owner/current-account/', views.get_current_owner_account),
    path("account-deletion-request/", views.submit_account_deletion, name="submit_account_deletion"),


    path("system/status/", views.system_status, name="system_status"),
    path('admin_tenants/', views.admin_tenants),
 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)