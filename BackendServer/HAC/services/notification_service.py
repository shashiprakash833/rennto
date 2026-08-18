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
        return {"message": "Notification sent to owner"}

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
    def get_notifications(phone):
        owner = CommonService.get_owner(phone)
        if owner:
            notifications = Notification.objects.filter(owner_account=owner).order_by('-created_at')
        else:
            notifications = Notification.objects.filter(recipient_phone__iexact=phone).order_by('-created_at')
        
        data = []
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

    @staticmethod
    def mark_notification_read(notification_id):
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.is_read = True
            notification.save()
            return {"message": "Notification marked as read"}
        except Notification.DoesNotExist:
            raise Exception("Notification not found")

    @staticmethod
    def mark_all_notifications_read(phone):
        owner = CommonService.get_owner(phone)
        if owner:
            notifications = Notification.objects.filter(owner_account=owner, is_read=False)
        else:
            notifications = Notification.objects.filter(recipient_phone__iexact=phone, is_read=False)
        notifications.update(is_read=True)
        return {"message": "All notifications marked as read"}
