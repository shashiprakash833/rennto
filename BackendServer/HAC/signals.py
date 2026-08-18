from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification, Owners, OwnerMaster
from .push_notifications import send_push_notification
import threading

@receiver(post_save, sender=Notification)
def send_expo_push_on_notification(sender, instance, created, **kwargs):
    if created:
        # Run it in a separate thread so we don't block the HTTP request
        threading.Thread(
            target=send_push_notification,
            args=(instance.recipient_phone, instance.title, instance.message, {"type": instance.type, "related_id": instance.related_id})
        ).start()

@receiver(post_save, sender=Owners)
def ensure_owner_master(sender, instance, created, **kwargs):
    if instance.phone:
        owner_master, _ = OwnerMaster.objects.get_or_create(phone_number=instance.phone)
        if instance.owner_master != owner_master:
            # Using update_fields and disable signals or simple check to avoid recursion
            instance.owner_master = owner_master
            # Note: We save only owner_master to prevent trigger recursion
            Owners.objects.filter(pk=instance.pk).update(owner_master=owner_master)

