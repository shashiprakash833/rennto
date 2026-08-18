from django.core.mail import send_mail
from django.conf import settings
 
def send_account_deletion_email(data):
    """
    Sends an account deletion request email to the admin/support email.
    """
    user_type = data.get('userType', 'Unknown')
    name = data.get('name', 'Unknown')
    number = data.get('number', 'Unknown')
    property_name = data.get('propertyName', '')
    description = data.get('description', '')
 
    subject = f"Account Deletion Request - {name} ({user_type.capitalize()})"
   
    body = (
      f"An account deletion request has been submitted with the following details:\n\n"
      f"User Type: {user_type.capitalize()}\n"
      f"Name: {name}\n"
      f"Phone Number: {number}\n"
    )
   
    if user_type == 'owner' and property_name:
        body += f"Property Name: {property_name}\n"
 
    if description:
        body += f"Description/Reason: {description}\n"
 
    body += "\nPlease process this deletion request accordingly.\n"
 
    # Send the email to the specified recipient
    recipient = 'srinivasareddynaru76@gmail.com'
 
    send_mail(
        subject,
        body,
        settings.EMAIL_HOST_USER,  # From email
        [recipient],               # To email
        fail_silently=False,
    )
 
 