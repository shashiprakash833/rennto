from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from HAC.models import Payment, Tenent, Owners, JoinRequest, TenantBeds, ApartmentTenantBeds, CommercialTenantBeds, Notification, StayHostelDetails, ApartmentStayDetails, CommericialDetails
from HAC.serializers import PaymentSerializer
from .common_service import CommonService
from .notification_service import NotificationService

class PaymentService:

    @staticmethod
    def get_tenant_payment_details(phone):
        # We try to get from any of the bed tables
        for table in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
            record = table.objects.filter(phone__iexact=phone).first()
            if record:
                return {
                    "owner_phone": record.owner_phone,
                    "rent": record.rent
                }
        return {"error": "No payment details found"}

    @staticmethod
    def create_payment(data):
        tenant_phone = data.get('tenant_phone', '').strip().lower()
        tenant_name = data.get('tenant_name')
        
        if not tenant_name:
            tenant_obj = CommonService.get_tenant(tenant_phone)
            tenant_name = tenant_obj.name if tenant_obj else (tenant_phone.split('@')[0] if tenant_phone else "Unknown")

        owner_identifier = data.get('owner_phone', '').strip()
        owner = CommonService.get_owner(owner_identifier)
        actual_owner_id = owner.owner_id if owner else owner_identifier

        property_id = None
        property_type = None
        total_rent = 0.0
        for table, p_type, model in [
            (TenantBeds, 'hostel', StayHostelDetails), 
            (ApartmentTenantBeds, 'apartment', ApartmentStayDetails), 
            (CommercialTenantBeds, 'commercial', CommericialDetails)
        ]:
            tenant_bed = table.objects.filter(phone__iexact=tenant_phone, owner=owner).order_by('-id').first()
            if not tenant_bed:
                tenant_bed = table.objects.filter(phone__icontains=tenant_phone[-10:]).order_by('-id').first()
            if tenant_bed:
                if tenant_bed.owner:
                    owner = tenant_bed.owner
                    actual_owner_id = owner.owner_id
                total_rent = float(tenant_bed.rent) if tenant_bed.rent else 0.0
                p = model.objects.filter(owner=owner).first()
                if p:
                    property_id = p.id
                    property_type = p_type
                break

        payment = Payment.objects.create(
            tenant_phone=tenant_phone,
            tenant_name=tenant_name,
            owner_phone=actual_owner_id,
            owner=owner,
            owner_name=data.get('owner_name'),
            property_name=data.get('property_name'),
            upi_id=data.get('upi_id'),
            total_rent=total_rent,
            amount=data.get('amount'),
            txn_ref=data.get('txn_ref') or f"PAY-{int(timezone.now().timestamp())}",
            status='PENDING',
            property_id=property_id,
            property_type=property_type
        )

        return {"message": "Payment recorded successfully", "txnRef": payment.txn_ref}

    @staticmethod
    def check_payment_status(txn_ref):
        try:
            payment = Payment.objects.get(txn_ref=txn_ref)
            return {"status": payment.status, "amount": payment.amount}
        except Payment.DoesNotExist:
            raise Exception("Payment not found")

    @staticmethod
    @transaction.atomic
    def update_payment_status(data):
        txn_ref = data.get('txn_ref')
        status_value = data.get('status')
        rejection_reason = data.get('rejection_reason')
        remaining_balance = data.get('remaining_balance', 0.0)
        next_due_date = data.get('next_due_date')

        try:
            payment = Payment.objects.get(txn_ref=txn_ref)
            payment.status = status_value
            if rejection_reason is not None:
                payment.rejection_reason = rejection_reason
            
            # Calculate dynamic remaining balance ALWAYS
            approved_sum = sum([p.amount for p in Payment.objects.filter(
                tenant_phone__iexact=payment.tenant_phone, 
                status='SUCCESS', 
                created_at__month=timezone.now().month,
                created_at__year=timezone.now().year
            ).exclude(id=payment.id)])
            
            if status_value == 'SUCCESS':
                approved_sum += (payment.amount if payment.amount else 0)
                
            calculated_remaining = float(payment.total_rent) - float(approved_sum)
            payment.remaining_balance = calculated_remaining if calculated_remaining >= 0 else 0.0
                
            if next_due_date is not None:
                try:
                    from dateutil.parser import parse
                    payment.next_due_date = parse(next_due_date).date()
                except Exception:
                    try:
                        import datetime
                        payment.next_due_date = datetime.datetime.strptime(next_due_date, "%d %b %Y").date()
                    except Exception:
                        payment.next_due_date = next_due_date
            # When rejected, clear the screenshot so the owner's verification queue
            # removes this entry and the tenant can re-upload a fresh proof.
            if status_value == 'FAILED':
                payment.payment_screenshot = None
            payment.save()
            # Also clear screenshot on tenant bed records so the tenant UI resets
            if status_value == 'FAILED' and payment.tenant_phone:
                for table in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
                    table.objects.filter(phone__iexact=payment.tenant_phone).update(payment_screenshot=None)
        except Payment.DoesNotExist:
            if txn_ref and txn_ref.startswith("PEND-"):
                try:
                    req_id = txn_ref.split("-")[1]
                    req = JoinRequest.objects.get(id=req_id)
                    
                    tenant_phone = (req.tenant.phone or "").strip()
                    owner_phone = req.owner.phone
                    rent_amount = 0
                    
                    for table in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
                        record = table.objects.filter(
                            phone__iexact=tenant_phone,
                            owner=req.owner
                        ).order_by('-id').first()
                        if record and record.rent:
                            rent_amount = record.rent
                            break
                    
                    owner = req.owner
                    property_id = None
                    property_type = None
                    for table, p_type, model in [
                        (TenantBeds, 'hostel', StayHostelDetails), 
                        (ApartmentTenantBeds, 'apartment', ApartmentStayDetails), 
                        (CommercialTenantBeds, 'commercial', CommericialDetails)
                    ]:
                        record = table.objects.filter(
                            phone__iexact=tenant_phone,
                            owner=req.owner
                        ).order_by('-id').first()
                        if record:
                            p = model.objects.filter(owner=owner).first()
                            if p:
                                property_id = p.id
                                property_type = p_type
                            break

                    payment = Payment.objects.create(
                        tenant_phone=tenant_phone,
                        tenant_name=req.tenant.name or tenant_phone.split('@')[0],
                        owner_phone=owner_phone,
                        owner=owner,
                        owner_name=req.owner.name,
                        property_name=req.property_name,
                        upi_id="",
                        amount=rent_amount,
                        txn_ref=txn_ref,
                        status=status_value,
                        property_id=property_id,
                        property_type=property_type,
                        rejection_reason=rejection_reason,
                        remaining_balance=float(remaining_balance) if remaining_balance else 0.0,
                        next_due_date=next_due_date
                    )
                except Exception as ex:
                    raise Exception(f"Could not create payment from virtual record: {str(ex)}")
            else:
                raise Exception("Payment not found")

        if status_value == 'SUCCESS':
            notification = Notification.objects.create(
                recipient_phone=payment.owner_phone,
                owner_account=payment.owner,
                title="Rent Payment Received",
                message=f"{payment.tenant_name} has paid rent ₹{payment.amount} successfully.",
                type="PAYMENT",
                related_id=payment.id
            )

            try:
                channel_layer = get_channel_layer()
                sanitized_phone = payment.owner_phone.replace("@", "_").replace(".", "_")
                for group in [f"owner_status_{sanitized_phone}", f"user_notifications_{sanitized_phone}"]:
                    async_to_sync(channel_layer.group_send)(
                        group,
                        {
                            "type": "status_update" if "owner_status" in group else "send_notification",
                            "content": {
                                "id": notification.id,
                                "type": "PAYMENT",
                                "title": notification.title,
                                "message": notification.message,
                                "is_read": notification.is_read,
                                "created_at": notification.created_at.isoformat(),
                                "related_id": payment.id,
                                "amount": payment.amount,
                                "tenant_name": payment.tenant_name
                            }
                        }
                    )
            except Exception:
                pass
                
        if status_value in ['SUCCESS', 'FAILED']:
            try:
                channel_layer = get_channel_layer()
                sanitized_tenant = payment.tenant_phone.replace("+", "").replace("@", "_").replace(".", "_")
                msg_text = f"Your payment of ₹{payment.amount} for {payment.property_name} has been verified." if status_value == 'SUCCESS' else f"Your payment of ₹{payment.amount} for {payment.property_name} was declined."
                if status_value == 'FAILED' and rejection_reason:
                    msg_text += f" Reason: {rejection_reason}"
                
                async_to_sync(channel_layer.group_send)(
                    f"user_notifications_{sanitized_tenant}",
                    {
                        "type": "send_notification",
                        "content": {
                            "type": "PAYMENT_VERIFIED" if status_value == 'SUCCESS' else "PAYMENT_REJECTED",
                            "message": msg_text,
                            "status": status_value,
                            "rejection_reason": rejection_reason
                        }
                    }
                )
            except Exception:
                pass

        return {"message": "Payment status updated"}

    @staticmethod
    def get_owner_payments(phone, request):
        owner = CommonService.get_owner(phone)
        if owner:
            from django.db.models import Q
            # Fetch by FK (preferred) OR by owner_phone matching owner_id (catches legacy records)
            payments = list(
                Payment.objects.filter(
                    Q(owner=owner) | Q(owner_phone=owner.owner_id)
                ).distinct().order_by('-created_at')
            )
        else:
            payments = list(Payment.objects.filter(owner_phone__iexact=phone).order_by('-created_at'))
        
        # Virtual payment generation has been removed as per user request

        for pay in payments:
            if not hasattr(pay, 'floor_number'):
                tenant_phone = getattr(pay, 'tenant_phone', None)
                if tenant_phone:
                    tenant_phone_lc = tenant_phone.lower()
                    record = None
                    for table in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
                        record = table.objects.filter(phone__iexact=tenant_phone_lc).order_by('-id').first()
                        if record:
                            break
                    if record:
                        if isinstance(record, TenantBeds):
                            pay.floor_number = record.floor
                            pay.room_number = record.roomno
                            pay.bed_number = record.bed
                        elif isinstance(record, ApartmentTenantBeds):
                            pay.floor_number = record.floor
                            pay.room_number = record.flatno
                            pay.bed_number = None
                        elif isinstance(record, CommercialTenantBeds):
                            pay.floor_number = record.floor
                            pay.room_number = record.sectionNo
                            pay.bed_number = None
                        
                        if getattr(pay, 'total_rent', 0) == 0 and getattr(record, 'rent', None):
                            pay.total_rent = float(record.rent)
                            pay.save(update_fields=['total_rent'])
                
                if not hasattr(pay, 'floor_number'): pay.floor_number = None
                if not hasattr(pay, 'room_number'): pay.room_number = None
                if not hasattr(pay, 'bed_number'): pay.bed_number = None

        serializer = PaymentSerializer(payments, many=True)
        response_data = [dict(item) for item in serializer.data]
        
        for i, p_data in enumerate(response_data):
            if i < len(payments):
                p_data['floor_number'] = getattr(payments[i], 'floor_number', None)
                p_data['room_number'] = getattr(payments[i], 'room_number', None)
                p_data['bed_number'] = getattr(payments[i], 'bed_number', None)
        
        for p_data in response_data:
            payment_obj = Payment.objects.filter(txn_ref=p_data.get('txn_ref')).first()
            if payment_obj and payment_obj.payment_screenshot:
                try:
                    p_data['payment_screenshot'] = request.build_absolute_uri(payment_obj.payment_screenshot.url)
                    continue
                except Exception:
                    p_data['payment_screenshot'] = None

            if p_data.get('txn_ref') and (p_data.get('txn_ref').startswith('CASH-') or p_data.get('txn_ref').startswith('PEND-')):
                p_data['payment_screenshot'] = None
                continue

            tenant_phone = p_data.get('tenant_phone')
            if not tenant_phone:
                continue
                
            screenshot_url = None
            for table in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
                record = table.objects.filter(phone__iexact=tenant_phone, owner=owner).order_by('-id').first()
                if record and record.payment_screenshot:
                    try:
                        screenshot_url = request.build_absolute_uri(record.payment_screenshot.url)
                        break
                    except Exception:
                        pass
            
            p_data['payment_screenshot'] = screenshot_url

        return response_data
    @staticmethod
    def _clear_tenant_reminders(phone):
        try:
            from HAC.models import TenantNotification
            phone_variants = [phone, phone.lstrip('+')]
            if not phone.startswith('+'):
                phone_variants.extend(['+' + phone, '+91' + phone, '91' + phone])
            elif phone.startswith('+91'):
                phone_variants.append(phone.replace('+91', ''))
            elif phone.startswith('91'):
                phone_variants.append(phone[2:])
            TenantNotification.objects.filter(tenant_phone__in=phone_variants, is_read=False).update(is_read=True)
        except Exception:
            pass

    @staticmethod
    @transaction.atomic
    def upload_payment_screenshot(data, files, request):
        phone = data.get('phone', '').strip().lower()
        screenshot = files.get('payment_screenshot')
        txn_ref = data.get('txn_ref')

        if not phone:
            raise ValueError("phone is required")
        if not screenshot:
            raise ValueError("Screenshot is required")

        payment = None
        if txn_ref:
            payment = Payment.objects.filter(txn_ref=txn_ref).first()
        
        if not payment:
            # Find the most recent PENDING or FAILED payment (FAILED = previously rejected, tenant re-uploading)
            payment = Payment.objects.filter(
                tenant_phone__iexact=phone, status__in=['PENDING', 'FAILED']
            ).exclude(txn_ref__startswith='CASH-').order_by('-created_at').first()

        # Resolve tenant's owner for backfilling and new payment creation
        _tenant_owner = None
        tenant_obj = CommonService.get_tenant(phone)
        if tenant_obj:
            # Prefer JoinRequest (most accurate)

            latest_req = JoinRequest.objects.filter(
                tenant=tenant_obj,
                status__in=['joined', 'completed']
            ).order_by('-created_at').first()
            if not latest_req:
                from HAC.models import ExistingTenantRequest
                latest_req = ExistingTenantRequest.objects.filter(
                    tenant=tenant_obj,
                    status__in=['joined', 'completed', 'active', 'occupied']
                ).order_by('-created_at').first()
            if latest_req:
                _tenant_owner = latest_req.owner
            elif tenant_obj.owner:
                _tenant_owner = tenant_obj.owner
            else:
                # Fallback: look up allotment bed record
                for BedTable in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
                    bed = BedTable.objects.filter(phone__iexact=phone).order_by('-id').first()
                    if bed and bed.owner:
                        _tenant_owner = bed.owner
                        break
                    elif bed and bed.owner_phone:
                        _tenant_owner = CommonService.get_owner(bed.owner_phone)
                        if _tenant_owner:
                            break

        if not payment:
            if tenant_obj and _tenant_owner:
                prop_name = None
                total_rent = 0.0
                for BedTable, p_type, PropModel in [
                    (TenantBeds, 'hostel', StayHostelDetails),
                    (ApartmentTenantBeds, 'apartment', ApartmentStayDetails),
                    (CommercialTenantBeds, 'commercial', CommericialDetails),
                ]:
                    bed = BedTable.objects.filter(phone__iexact=phone, owner=_tenant_owner).order_by('-id').first()
                    if bed:
                        total_rent = float(getattr(bed, 'rent', 0) or 0)
                        p = PropModel.objects.filter(owner=_tenant_owner).first()
                        if p:
                            prop_name = getattr(p, 'hostelName', None) or getattr(p, 'apartmentName', None) or getattr(p, 'commercialName', None)
                        break

                if total_rent == 0.0:
                    total_rent = float(data.get('amount', 0) or 0)

                latest_req = JoinRequest.objects.filter(
                    tenant=tenant_obj, status__in=['joined', 'completed']
                ).order_by('-created_at').first()
                prop_name = prop_name or (latest_req.property_name if latest_req else 'Property')

                payment = Payment.objects.create(
                    tenant_phone=phone,
                    tenant_name=tenant_obj.name,
                    owner_phone=_tenant_owner.owner_id,
                    owner=_tenant_owner,
                    owner_name=_tenant_owner.name,
                    property_name=prop_name or 'Property',
                    total_rent=total_rent,
                    amount=data.get('amount', 0),
                    txn_ref=txn_ref or f"PROOF-{int(timezone.now().timestamp())}",
                    status='PENDING'
                )

        # Backfill owner FK on existing payment if it's missing
        if payment and payment.owner_id is None and _tenant_owner:
            payment.owner = _tenant_owner
            payment.owner_phone = _tenant_owner.owner_id
            payment.save(update_fields=['owner', 'owner_phone'])

        if payment:
            payment.payment_screenshot = screenshot
            if data.get('amount'):
                payment.amount = data.get('amount')
            # If tenant is re-uploading after a rejection, reset to PENDING
            # so the payment re-enters the owner's verification queue.
            if payment.status == 'FAILED':
                payment.status = 'PENDING'
                payment.rejection_reason = None
            payment.save()
            
            for table in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
                table.objects.filter(phone__iexact=phone).update(payment_screenshot=screenshot)

            owner_phone = payment.owner_phone
            owner = CommonService.get_owner(owner_phone)
            
            notification = Notification.objects.create(
                recipient_phone=owner_phone,
                owner_account=owner,
                title="Payment Screenshot Uploaded",
                message=f"{payment.tenant_name} has uploaded a payment screenshot for ₹{payment.amount}.",
                type="PAYMENT",
                related_id=payment.id
            )

            tenant = CommonService.get_tenant(phone)

            if owner and owner.push_token:
                NotificationService.send_push_notification(owner.push_token, "Payment Uploaded 💰", f"{tenant.name if tenant else 'Tenant'} uploaded payment proof of ₹{payment.amount}")

            try:
                channel_layer = get_channel_layer()
                sanitized_phone = owner.owner_id if owner and owner.owner_id else owner_phone.replace("@", "_").replace(".", "_")
                for group in [f"owner_status_{sanitized_phone}", f"user_notifications_{sanitized_phone}"]:
                    async_to_sync(channel_layer.group_send)(
                        group,
                        {
                            "type": "status_update" if "owner_status" in group else "send_notification",
                            "content": {
                                "id": notification.id,
                                "type": "PAYMENT",
                                "title": notification.title,
                                "message": notification.message,
                                "is_read": notification.is_read,
                                "created_at": notification.created_at.isoformat(),
                                "related_id": payment.id
                            }
                        }
                    )
            except Exception:
                pass

            return {
                "message": "Screenshot uploaded and payment record updated",
                "image_url": request.build_absolute_uri(payment.payment_screenshot.url),
                "txn_ref": payment.txn_ref
            }
        
        raise ValueError("No active request found to attach payment to.")

    @staticmethod
    @transaction.atomic
    def cash_payment(data):
        phone = data.get('phone', '').strip().lower()
        amount = data.get('amount')
        property_name = data.get('propertyName')
        description = data.get('description', '')

        if not phone:
            raise ValueError("phone is required")

        # Try to find an existing PENDING CASH payment to reuse, to avoid spam.
        # But do NOT reuse a PENDING UPI payment (which would have a different txn_ref or a screenshot).
        payment = Payment.objects.filter(
            tenant_phone__iexact=phone, 
            status='PENDING',
            txn_ref__startswith='CASH-'
        ).order_by('-created_at').first()

        if not payment:
            tenant_obj = CommonService.get_tenant(phone)
            if not tenant_obj:
                raise Exception("Tenant not found")

            # Only allow cash payment for active (joined) tenants
            latest_req = JoinRequest.objects.filter(
                tenant__phone__iexact=phone,
                status__in=['joined', 'completed']
            ).order_by('-id').first()
            if not latest_req:
                 from HAC.models import ExistingTenantRequest
                 latest_req = ExistingTenantRequest.objects.filter(
                    tenant__phone__iexact=phone,
                    status__in=['joined', 'completed', 'active', 'occupied']
                ).order_by('-id').first()
                
            owner_obj = None
            prop_name = None
            total_rent = 0.0

            if latest_req:
                owner_obj = latest_req.owner
                prop_name = latest_req.property_name

            for BedTable, p_type, PropModel in [
                (TenantBeds, 'hostel', StayHostelDetails),
                (ApartmentTenantBeds, 'apartment', ApartmentStayDetails),
                (CommercialTenantBeds, 'commercial', CommericialDetails),
            ]:
                bed = BedTable.objects.filter(phone__iexact=phone).order_by('-id').first()
                if bed:
                    total_rent = float(getattr(bed, 'rent', 0) or 0)
                    if not owner_obj:
                        owner_obj = bed.owner
                        if not owner_obj and bed.owner_phone:
                            owner_obj = CommonService.get_owner(bed.owner_phone)
                    if owner_obj and not prop_name:
                        p = PropModel.objects.filter(owner=owner_obj).first()
                        if p:
                            prop_name = getattr(p, 'hostelName', None) or getattr(p, 'apartmentName', None) or getattr(p, 'commercialName', None)
                    break
            
            if total_rent == 0.0:
                total_rent = float(amount or 0)

            if not owner_obj:
                raise Exception("No active property found for this tenant. Please complete the joining process first.")

            payment = Payment.objects.create(
                tenant_phone=phone,
                tenant_name=tenant_obj.name or phone.split('@')[0],
                owner_phone=owner_obj.owner_id,
                owner=owner_obj,
                owner_name=owner_obj.name,
                property_name=prop_name or 'Property',
                total_rent=total_rent,
                amount=amount or 0,
                txn_ref=f"CASH-{int(timezone.now().timestamp())}",
                status='PENDING'
            )
        else:
            # Backfill owner FK if existing pending payment is missing it
            if payment.owner_id is None:
                latest_req = JoinRequest.objects.filter(
                    tenant__phone__iexact=phone,
                    status__in=['joined', 'completed']
                ).order_by('-id').first()
                if not latest_req:
                    from HAC.models import ExistingTenantRequest
                    latest_req = ExistingTenantRequest.objects.filter(
                        tenant__phone__iexact=phone,
                        status__in=['joined', 'completed', 'active', 'occupied']
                    ).order_by('-id').first()
                
                owner_obj = None
                if latest_req:
                    owner_obj = latest_req.owner
                else:
                    for BedTable in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
                        bed = BedTable.objects.filter(phone__iexact=phone).order_by('-id').first()
                        if bed:
                            owner_obj = bed.owner
                            if not owner_obj and bed.owner_phone:
                                owner_obj = CommonService.get_owner(bed.owner_phone)
                            break
                            
                if owner_obj:
                    payment.owner = owner_obj
                    payment.owner_phone = owner_obj.owner_id
                    payment.save(update_fields=['owner', 'owner_phone'])
        
        for table in [TenantBeds, ApartmentTenantBeds, CommercialTenantBeds]:
            table.objects.filter(phone__iexact=phone).update(payment_screenshot=None)

        if payment:
            payment.payment_screenshot = None
            if amount:
                payment.amount = amount
            if not payment.txn_ref or not payment.txn_ref.startswith('CASH-'):
                payment.txn_ref = f"CASH-{int(timezone.now().timestamp())}"
            payment.save()

            PaymentService._clear_tenant_reminders(phone)

            owner_phone = payment.owner_phone
            owner = CommonService.get_owner(owner_phone)
            
            notification = Notification.objects.create(
                recipient_phone=owner_phone,
                owner_account=owner,
                title="Cash Payment Requested",
                message=f"{payment.tenant_name} has requested to pay ₹{payment.amount} in cash.",
                type="PAYMENT",
                related_id=payment.id
            )

            tenant = CommonService.get_tenant(phone)

            if owner and owner.push_token:
                NotificationService.send_push_notification(owner.push_token, "Cash Payment Reported 💵", f"{tenant.name if tenant else 'Tenant'} reported cash payment of ₹{payment.amount}")

            try:
                channel_layer = get_channel_layer()
                sanitized_phone = owner.owner_id if owner and owner.owner_id else owner_phone.replace("@", "_").replace(".", "_")
                for group in [f"owner_status_{sanitized_phone}", f"user_notifications_{sanitized_phone}"]:
                    async_to_sync(channel_layer.group_send)(
                        group,
                        {
                            "type": "status_update" if "owner_status" in group else "send_notification",
                            "content": {
                                "id": notification.id,
                                "type": "PAYMENT",
                                "title": notification.title,
                                "message": notification.message,
                                "is_read": notification.is_read,
                                "created_at": notification.created_at.isoformat(),
                                "related_id": payment.id
                            }
                        }
                    )
            except Exception:
                pass

        return {"message": "Cash payment confirmation sent"}

    @staticmethod
    def get_tenant_payment_history(phone, request):
        payments = Payment.objects.filter(tenant_phone__iexact=phone).order_by('-created_at')
        serializer = PaymentSerializer(payments, many=True)
        response_data = serializer.data

        for p_data in response_data:
            payment_obj = Payment.objects.filter(txn_ref=p_data.get('txn_ref')).first()
            if payment_obj and payment_obj.payment_screenshot:
                try:
                    p_data['payment_screenshot'] = request.build_absolute_uri(payment_obj.payment_screenshot.url)
                except Exception:
                    p_data['payment_screenshot'] = None
            else:
                p_data['payment_screenshot'] = None

        return response_data
