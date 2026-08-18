from django.db.models import Q
from HAC.models import Owners, Tenent

class CommonService:
    @staticmethod
    def get_owner(phone):
        if not phone:
            return None
        # Try matching owner_id first (exact case/iexact)
        owner = Owners.objects.filter(owner_id=phone).first()
        if owner:
            return owner
        # If it is a 10-char alphanumeric string containing letters, it is definitely an owner_id. Do not fallback.
        if len(phone) == 10 and phone.isalnum() and not phone.isdigit():
            return None
        # Fallback to phone number
        return Owners.objects.filter(phone=phone).order_by('-created_at').first()
        
    @staticmethod
    def get_tenant(phone):
        if not phone:
            return None
        phone = phone.strip()
        phone_variants = [phone, phone.lstrip('+')]
        if not phone.startswith('+'):
            phone_variants.extend(['+' + phone, '+91' + phone, '91' + phone])
        elif phone.startswith('+91'):
            phone_variants.append(phone.replace('+91', ''))
        elif phone.startswith('91'):
            phone_variants.append(phone[2:])
        return Tenent.objects.filter(phone__in=phone_variants).first()
