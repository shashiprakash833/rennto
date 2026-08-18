import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BackendServer.settings')
django.setup()
from HAC.models import Payment
payments = Payment.objects.order_by('-id')[:5]
for p in payments:
    print(f'ID: {p.id}, Amount: {p.amount}, Paid Amount: {getattr(p, "paid_amount", "MISSING")}, Note: {getattr(p, "tenant_note", "MISSING")}')
