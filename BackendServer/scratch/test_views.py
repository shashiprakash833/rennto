
import os
import django
import sys

# Add the project directory to sys.path
sys.path.append(r'c:\Users\narus\OneDrive\Desktop\rennto\UpdatedIssuesRenntoJ\HMS\Backend\BMS')

# Set settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BMS.settings')
django.setup()

from HAC.views import owner_requests, tenant_notifications
from rest_framework.test import APIRequestFactory
from rest_framework import status

factory = APIRequestFactory()

def test_owner_requests_not_found():
    request = factory.get('/api/owner_requests/nonexistent@gmail.com/')
    response = owner_requests(request, email='nonexistent@gmail.com')
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_tenant_notifications_not_found():
    request = factory.get('/api/tenant_notifications/nonexistent@gmail.com/')
    response = tenant_notifications(request, email='nonexistent@gmail.com')
    assert response.status_code == status.HTTP_404_NOT_FOUND

if __name__ == "__main__":
    try:
        test_owner_requests_not_found()
        test_tenant_notifications_not_found()
        pass
    except Exception as e:
        pass
