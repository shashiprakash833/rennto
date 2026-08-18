from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

from django.http import JsonResponse

def home(request):
    return JsonResponse({
        "status": "success",
        "message": "Rennto Backend is running 🚀"
    })

urlpatterns = [
    path('', home),   # homepage
    path('admin/', admin.site.urls),
    path('api/', include('HAC.urls')),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
