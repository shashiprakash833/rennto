from django.db.models import Q
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from HAC.models import Notification, Owners, Tenent
from .common_service import CommonService

class NotificationService:

    @staticmethod
    def send_push_notification(push_token, title, body):
        try:
            from HAC.push_notifications import send_expo_push_notification
            send_expo_push_notification(push_token, title, body)
        except Exception as e:
            pass

    @staticmethod
    def send_owner_notification(data):
        owner_phone = data.get('ownerPhone') or data.get('owner_phone') or data.get('phone')
        owner_id = data.get('owner_id') or data.get('ownerId')
        title = data.get('title', 'Notification')
        message = data.get('message') or data.get('body', '')
        n_type = data.get('type', 'ISSUE')
        related_id = data.get('related_id') or data.get('relatedId')

        owner = None
        if owner_id:
            owner = CommonService.get_owner(owner_id)
        if not owner and owner_phone:
            owner = CommonService.get_owner(owner_phone)

        recipient_phone = owner_phone or (owner.phone if owner else "")

        notification = Notification.objects.create(
            owner_account=owner,
            recipient_phone=recipient_phone,
            title=title,
            message=message,
            type=n_type,
            is_read=False,
            related_id=related_id
        )

        print(f"BACKEND: CREATE NOTIFICATION: Owner ({recipient_phone}) => '{title}'")

        try:
            channel_layer = get_channel_layer()
            phone_to_sanitize = owner.owner_id if owner else recipient_phone
            sanitized_phone = phone_to_sanitize.replace("+", "").replace("@", "_").replace(".", "_") if phone_to_sanitize else ""
            if channel_layer and sanitized_phone:
                ws_content = {
                    "id": notification.id,
                    "type": notification.type,
                    "title": title,
                    "message": message,
                    "created_at": notification.created_at.isoformat(),
                    "is_read": False,
                }
                for group_name in [
                    f"notifications_{sanitized_phone}",
                    f"user_notifications_{sanitized_phone}",
                ]:
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            "type": "send_notification",
                            "content": ws_content,
                        },
                    )
        except Exception as ws_err:
            pass

        return {"message": "Notification sent to owner successfully", "id": notification.id}

    @staticmethod
    def send_tenant_notification(data):
        tenant_phone = data.get('tenantPhone')
        title = data.get('title')
        message = data.get('message') or data.get('body')
        n_type = data.get('type', 'REMINDER')
        
        notification = Notification.objects.create(
            recipient_phone=tenant_phone,
            title=title,
            message=message,
            type=n_type
        )
        
        tenant = CommonService.get_tenant(tenant_phone)
        if tenant and tenant.push_token:
            NotificationService.send_push_notification(tenant.push_token, title, message)

        try:
            channel_layer = get_channel_layer()
            sanitized_phone = tenant_phone.replace("+", "").replace(" ", "")
            async_to_sync(channel_layer.group_send)(
                f"user_notifications_{sanitized_phone}",
                {
                    "type": "send_notification",
                    "content": {
                        "id": notification.id,
                        "title": notification.title,
                        "message": notification.message,
                        "type": notification.type,
                        "created_at": notification.created_at.isoformat(),
                    }
                }
            )
        except Exception:
            pass
            
        return {"message": "Notification sent successfully", "id": notification.id}

    @staticmethod
    def get_unread_count(phone, role=None):
        if not phone:
            return {"unread_count": 0}
        
        clean_phone = str(phone).strip()
        
        if role == 'owner':
            owner = CommonService.get_owner(clean_phone)
            if owner:
                owner_phone_variants = [owner.phone, owner.phone.lstrip('+')] if owner.phone else []
                if owner.owner_id and owner.owner_id not in owner_phone_variants:
                    owner_phone_variants.append(owner.owner_id)
                if owner.phone:
                    if not owner.phone.startswith('+'):
                        owner_phone_variants.extend(['+' + owner.phone, '+91' + owner.phone, '91' + owner.phone])
                    elif owner.phone.startswith('+91'):
                        owner_phone_variants.append(owner.phone.replace('+91', ''))
                    elif owner.phone.startswith('91'):
                        owner_phone_variants.append(owner.phone[2:])

                n_count = Notification.objects.filter(
                    Q(owner_account=owner) | Q(recipient_phone__in=owner_phone_variants),
                    is_read=False
                ).count()

                from HAC.models import JoinRequest, ExistingTenantRequest, VacateRequest
                jr_count = JoinRequest.objects.filter(owner=owner, status='pending').count()
                ex_count = ExistingTenantRequest.objects.filter(owner=owner, status='pending').count()
                vr_count = VacateRequest.objects.filter(owner=owner, status__iexact='pending').count()
                count = n_count + jr_count + ex_count + vr_count
            else:
                count = Notification.objects.filter(recipient_phone__iexact=clean_phone, is_read=False).count()
            print(f"BACKEND: UNREAD COUNT: Owner ({clean_phone}) => {count}")
            return {"unread_count": count}
        else:
            # Tenant or general user
            from HAC.models import TenantNotification, Tenent, JoinRequest
            phone_variants = [clean_phone, clean_phone.lstrip('+')]
            if not clean_phone.startswith('+'):
                phone_variants.extend(['+' + clean_phone, '+91' + clean_phone, '91' + clean_phone])
            elif clean_phone.startswith('+91'):
                phone_variants.append(clean_phone.replace('+91', ''))
            elif clean_phone.startswith('91'):
                phone_variants.append(clean_phone[2:])
            
            t_count = TenantNotification.objects.filter(tenant_phone__in=phone_variants, is_read=False).count()
            n_count = Notification.objects.filter(recipient_phone__in=phone_variants, is_read=False).count()

            tenant = Tenent.objects.filter(phone__in=phone_variants).first()
            jr_count = 0
            if tenant:
                jr_count = JoinRequest.objects.filter(
                    tenant=tenant,
                    status__in=['accepted', 'allotted', 'pending_confirmation']
                ).count()

            total_unread = t_count + n_count + jr_count
            print(f"BACKEND: UNREAD COUNT: Tenant ({clean_phone}) => {total_unread}")
            return {"unread_count": total_unread}

    @staticmethod
    def get_notifications(phone, role=None):
        if not phone:
            return {"notifications": [], "unread_count": 0}
            
        clean_phone = str(phone).strip()
        data = []

        if role == 'owner':
            owner = CommonService.get_owner(clean_phone)
            if owner:
                notifications = Notification.objects.filter(
                    Q(owner_account=owner) | Q(recipient_phone__iexact=clean_phone)
                ).order_by('-created_at')
            else:
                notifications = Notification.objects.filter(recipient_phone__iexact=clean_phone).order_by('-created_at')
            
            for n in notifications:
                data.append({
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "type": n.type,
                    "is_read": n.is_read,
                    "created_at": n.created_at,
                    "related_id": n.related_id
                })
            unread_count = notifications.filter(is_read=False).count()
            return {"notifications": data, "unread_count": unread_count}
        else:
            # Tenant notifications
            from HAC.models import TenantNotification
            phone_variants = [clean_phone, clean_phone.lstrip('+')]
            if not clean_phone.startswith('+'):
                phone_variants.extend(['+' + clean_phone, '+91' + clean_phone, '91' + clean_phone])
            elif clean_phone.startswith('+91'):
                phone_variants.append(clean_phone.replace('+91', ''))
            elif clean_phone.startswith('91'):
                phone_variants.append(clean_phone[2:])

            t_notifications = TenantNotification.objects.filter(tenant_phone__in=phone_variants).order_by('-created_at')
            for n in t_notifications:
                data.append({
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "type": "MESSAGE",
                    "is_read": n.is_read,
                    "created_at": n.created_at,
                })

            n_notifications = Notification.objects.filter(recipient_phone__in=phone_variants).order_by('-created_at')
            for n in n_notifications:
                data.append({
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "type": n.type,
                    "is_read": n.is_read,
                    "created_at": n.created_at,
                    "related_id": n.related_id
                })

            data.sort(key=lambda x: x['created_at'], reverse=True)
            unread_count = sum(1 for item in data if not item.get('is_read', False))
            return {"notifications": data, "unread_count": unread_count}

    @staticmethod
    def mark_notification_read(notification_id):
        from HAC.models import TenantNotification
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.is_read = True
            notification.save()
            print(f"BACKEND: MARK READ: Notification id={notification_id}")
            return {"message": "Notification marked as read", "success": True}
        except Notification.DoesNotExist:
            try:
                t_notification = TenantNotification.objects.get(id=notification_id)
                t_notification.is_read = True
                t_notification.save()
                print(f"BACKEND: MARK READ: TenantNotification id={notification_id}")
                return {"message": "Notification marked as read", "success": True}
            except TenantNotification.DoesNotExist:
                raise Exception("Notification not found")

    @staticmethod
    def mark_all_notifications_read(phone, role=None):
        if not phone:
            return {"message": "Phone number required", "unread_count": 0}

        clean_phone = str(phone).strip()
        from HAC.models import TenantNotification

        if role == 'owner':
            owner = CommonService.get_owner(clean_phone)
            if owner:
                Notification.objects.filter(owner_account=owner, is_read=False).update(is_read=True)
            Notification.objects.filter(recipient_phone__iexact=clean_phone, is_read=False).update(is_read=True)
        else:
            phone_variants = [clean_phone, clean_phone.lstrip('+')]
            if not clean_phone.startswith('+'):
                phone_variants.extend(['+' + clean_phone, '+91' + clean_phone, '91' + clean_phone])
            elif clean_phone.startswith('+91'):
                phone_variants.append(clean_phone.replace('+91', ''))
            elif clean_phone.startswith('91'):
                phone_variants.append(clean_phone[2:])
            
            TenantNotification.objects.filter(tenant_phone__in=phone_variants, is_read=False).update(is_read=True)
            Notification.objects.filter(recipient_phone__in=phone_variants, is_read=False).update(is_read=True)

        print(f"BACKEND: MARK ALL READ: phone={clean_phone}, role={role}")
        return {"message": "All notifications marked as read", "unread_count": 0}
