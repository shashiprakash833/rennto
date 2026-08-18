import jwt
import datetime
from django.conf import settings
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .models import Owners, Tenent

def generate_jwt_token(user_id, role, phone=None):
    """
    Generates a JWT token for the given user ID and role.
    Role can be 'tenant', 'owner', or 'admin'.
    """
    payload = {
        'user_id': user_id,
        'role': role,
        'phone': phone,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7), # Token valid for 7 days
        'iat': datetime.datetime.utcnow()
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token

def decode_jwt_token(token):
    """
    Decodes the JWT token and returns the payload.
    Raises exceptions for expired or invalid tokens.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")

def jwt_required(allowed_roles=None):
    """
    Decorator to protect API views with JWT authentication.
    allowed_roles: List of roles allowed to access the endpoint (e.g., ['tenant', 'owner', 'admin'])
    If allowed_roles is None, any valid token is accepted.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            auth_header = request.headers.get('Authorization')
            
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response(
                    {'error': 'Authentication credentials were not provided or invalid format.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
            token = auth_header.split(' ')[1]
            
            try:
                payload = decode_jwt_token(token)
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
            # Role authorization check
            user_role = payload.get('role')
            if allowed_roles and user_role not in allowed_roles:
                return Response(
                    {'error': 'You do not have permission to perform this action.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Attach the user payload to the request for easy access in the view
            request.jwt_payload = payload
            
            # Optionally fetch the actual user object and attach it to request.custom_user
            user_id = payload.get('user_id')
            if user_role == 'owner':
                request.custom_user = Owners.objects.filter(pk=user_id).first()
            elif user_role == 'tenant':
                request.custom_user = Tenent.objects.filter(pk=user_id).first()
            elif user_role == 'admin':
                request.custom_user = {'id': user_id, 'role': 'admin'}
                
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
