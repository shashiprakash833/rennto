import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BMS.settings')
django.setup()

from HAC.services.request_service import RequestService

try:
    data = RequestService.owner_requests('6305394330')
    pass
except Exception as e:
    import traceback
    traceback.print_exc()
