from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/(?P<user_phone>[^/]+)?/?$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/owner-status/(?P<phone>[^/]+)/$', consumers.OwnerStatusConsumer.as_asgi()),
    re_path(r'ws/tenant-notifications/(?P<phone>[^/]+)/$', consumers.TenantNotificationConsumer.as_asgi()),
]

