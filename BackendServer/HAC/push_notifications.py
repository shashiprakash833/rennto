import requests
import json
from .models import Tenent, Owners

def send_push_notification(phone, title, body, data=None):
    if data is None:
        data = {}

    user = None
    try:
        user = Tenent.objects.get(phone=phone)
    except Tenent.DoesNotExist:
        try:
            user = Owners.objects.filter(phone=phone).order_by('-created_at').first()
            if not user:
                raise Owners.DoesNotExist
        except Owners.DoesNotExist:
            return False

    if not user or not user.push_token:
        return False

    message = {
        "to": user.push_token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data,
    }

    try:

        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            json=message,
        )

        response.raise_for_status()

        return True

    except Exception as e:
        return False

def send_expo_push_notification(push_token, title, body, data=None):
    if not push_token:
        return False

    if data is None:
        data = {}

    message = {
        "to": push_token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data,
    }

    try:
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            json=message,
        )

        response.raise_for_status()

        return True

    except Exception as e:
        return False
