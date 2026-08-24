from django.db.models import Q
from HAC.models import Owners, Tenent

class CommonService:
    @staticmethod
    def _clean_phone(phone_val):
        if not phone_val:
            return ""
        s = str(phone_val).strip().replace(" ", "").replace("-", "")
        if s.startswith("+91"):
            s = s[3:]
        elif s.startswith("+"):
            s = s[1:]
        elif len(s) > 10 and s.startswith("91"):
            s = s[2:]
        return s

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
        cleaned = CommonService._clean_phone(phone)
        phone_variants = [phone, cleaned, f"+91{cleaned}", f"91{cleaned}"]
        return Owners.objects.filter(Q(phone__in=phone_variants) | Q(owner_master__phone_number__in=phone_variants)).order_by('-created_at').first()

    @staticmethod
    def is_same_or_authorized_owner(acting_owner, target_owner):
        """
        Check if acting_owner is authorized to act on behalf of target_owner.
        Owners match if:
        1. Exact match (same object or same primary key/owner_id).
        2. Same phone number or normalized phone number.
        3. Belong to the same OwnerMaster.
        4. If acting_owner is passed as string identifier (owner_id or phone), it matches target_owner's id, phone, or owner_master phone.
        """
        if not acting_owner or not target_owner:
            return False

        acting_pk = getattr(acting_owner, 'owner_id', getattr(acting_owner, 'pk', None))
        target_pk = getattr(target_owner, 'owner_id', getattr(target_owner, 'pk', None))

        if acting_pk and target_pk and str(acting_pk).strip() == str(target_pk).strip():
            return True

        acting_phone = getattr(acting_owner, 'phone', None)
        target_phone = getattr(target_owner, 'phone', None)

        if acting_phone and target_phone:
            clean_acting = CommonService._clean_phone(acting_phone)
            clean_target = CommonService._clean_phone(target_phone)
            if clean_acting and clean_target and clean_acting == clean_target:
                return True

        acting_master_id = getattr(acting_owner, 'owner_master_id', None)
        target_master_id = getattr(target_owner, 'owner_master_id', None)
        if acting_master_id and target_master_id and acting_master_id == target_master_id:
            return True

        # Check owner_master phone matching
        if hasattr(target_owner, 'owner_master') and target_owner.owner_master:
            master_phone = getattr(target_owner.owner_master, 'phone_number', '')
            if master_phone and acting_phone:
                if CommonService._clean_phone(acting_phone) == CommonService._clean_phone(master_phone):
                    return True

        # If acting_owner is a string/identifier
        if isinstance(acting_owner, str):
            identifier = acting_owner.strip()
            if target_pk and identifier == str(target_pk).strip():
                return True
            clean_ident = CommonService._clean_phone(identifier)
            if target_phone and clean_ident and clean_ident == CommonService._clean_phone(target_phone):
                return True
            if hasattr(target_owner, 'owner_master') and target_owner.owner_master:
                master_phone = getattr(target_owner.owner_master, 'phone_number', '')
                if master_phone and clean_ident and clean_ident == CommonService._clean_phone(master_phone):
                    return True
            resolved = CommonService.get_owner(identifier)
            if resolved:
                return CommonService.is_same_or_authorized_owner(resolved, target_owner)

        return False
        
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
