from django.db.models import Q
from HAC.models import Issue, BlockedTenant, Notification
from HAC.serializers import IssueSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .common_service import CommonService

class IssueService:

    @staticmethod
    def create_issue(data, files):
        tenant_id = data.get("tenant_id")
        phone = data.get("phone") or data.get("phone_number")
        
        tenant = None
        if tenant_id:
            from HAC.models import Tenent
            tenant = Tenent.objects.filter(id=tenant_id).first()
        elif phone:
            tenant = CommonService.get_tenant(phone)
            
        if not tenant:
            raise Exception("Tenant not found")
        if not tenant.owner:
            raise ValueError("Tenant not assigned to any owner")
            
        is_blocked = BlockedTenant.objects.filter(tenant=tenant, is_active=True).exists()
        if is_blocked:
            raise ValueError("You are currently blocked by an owner and cannot create new issues.")

        owner = tenant.owner
        image = files.get("image")

        from HAC.models import TenantBeds, ApartmentTenantBeds, CommercialTenantBeds, StayHostelDetails, ApartmentStayDetails, CommericialDetails
        property_id = None
        property_type = None
        for table, p_type, model in [
            (TenantBeds, 'hostel', StayHostelDetails), 
            (ApartmentTenantBeds, 'apartment', ApartmentStayDetails), 
            (CommercialTenantBeds, 'commercial', CommericialDetails)
        ]:
            tenant_bed = table.objects.filter(
                Q(phone__iexact=tenant.phone.lower()) &
                (Q(owner=owner) | Q(owner_phone=owner.owner_id) | Q(owner_phone=owner.phone))
            ).order_by('-id').first()
            if tenant_bed:
                p = model.objects.filter(owner=owner).first()
                if p:
                    property_id = p.id
                    property_type = p_type
                break
        
        title = data.get("title")
        description = data.get("description")
        
        # Prevent double submission (within 1 minute)
        from django.utils import timezone
        from datetime import timedelta
        recent_duplicate = Issue.objects.filter(
            tenant=tenant,
            owner=owner,
            title=title,
            created_at__gte=timezone.now() - timedelta(minutes=1)
        ).exists()
        
        if recent_duplicate:
            return {"message": "Issue created successfully"}
            
        issue = Issue.objects.create(
            tenant=tenant,
            owner=owner,
            title=title,
            description=description,
            severity=data.get("severity", "Medium"),
            status="Pending",
            image=image,
            property_id=property_id,
            property_type=property_type
        )

        notification = Notification.objects.create(
            recipient_phone=owner.owner_id,
            owner_account=owner,
            title="New Issue Raised",
            message=f"{tenant.name} has raised a new issue: {issue.title}",
            type="ISSUE",
            related_id=issue.id
        )

        try:
            channel_layer = get_channel_layer()
            sanitized_phone = owner.phone.replace("@", "_").replace(".", "_")
            for group in [f"owner_status_{sanitized_phone}", f"user_notifications_{sanitized_phone}"]:
                async_to_sync(channel_layer.group_send)(
                    group,
                    {
                        "type": "status_update" if "owner_status" in group else "send_notification",
                        "content": {
                            "id": notification.id,
                            "type": "ISSUE",
                            "title": notification.title,
                            "message": notification.message,
                            "is_read": notification.is_read,
                            "created_at": notification.created_at.isoformat(),
                            "related_id": issue.id
                        }
                    }
                )
        except Exception:
            pass

        return {"message": "Issue created successfully"}

    @staticmethod
    def _clean_old_completed_issues():
        try:
            from django.utils import timezone
            from datetime import timedelta
            from HAC.models import Issue, Notification
            
            cutoff_time = timezone.now() - timedelta(hours=24)
            old_issues = list(Issue.objects.filter(status='Completed', updated_at__lte=cutoff_time).values_list('id', flat=True))
            if old_issues:
                Issue.objects.filter(id__in=old_issues).delete()
                Notification.objects.filter(type__iexact='ISSUE', related_id__in=old_issues).delete()
        except Exception:
            pass

    @staticmethod
    def tenant_issues(identifier):
        IssueService._clean_old_completed_issues()
        tenant = CommonService.get_tenant(identifier)
        if not tenant:
            raise Exception("Tenant not found")

        issues = Issue.objects.filter(tenant=tenant).exclude(title__icontains='Reminder').order_by('-created_at')
        return IssueSerializer(issues, many=True).data

    @staticmethod
    def owner_issues(phone, search_query=None, request=None):
        IssueService._clean_old_completed_issues()
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Exception("Owner not found")

        issues = Issue.objects.filter(owner=owner).exclude(title__icontains='Reminder').order_by('-created_at')

        if search_query:
            search_query = search_query.strip()
            issues = issues.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(tenant__name__icontains=search_query) |
                Q(tenant__phone__icontains=search_query)
            )

        data = []
        for i in issues:
            img_url = None
            if i.image and request:
                try:
                    img_url = request.build_absolute_uri(i.image.url)
                except Exception:
                    pass

            alloc = i.get_allocation_details()

            data.append({
                "id": i.id,
                "title": i.title,
                "description": i.description,
                "severity": i.severity,
                "status": i.status,
                "tenant_name": i.tenant.name if i.tenant else "Unknown",
                "tenant_phone": i.tenant.phone if i.tenant else "N/A",
                "owner_comment": i.owner_comment,
                "image": img_url,
                "date": i.created_at,
                "floor_no": alloc["floor_no"],
                "room_no": alloc["room_no"],
                "bed_no": alloc["bed_no"],
                "property_name": "",
                "property_type": alloc["property_type"],
                "property_id": alloc["property_id"]
            })

        return data

    @staticmethod
    def update_issue_status(issue_id, status_value):
        try:
            issue = Issue.objects.get(id=issue_id)
        except Issue.DoesNotExist:
            raise Exception("Issue not found")

        if status_value not in ["Pending", "In Progress", "Completed"]:
            raise ValueError("Invalid status")

        issue.status = status_value
        issue.save()

        try:
            sanitized_phone = issue.tenant.phone.replace("+", "").replace("@", "_").replace(".", "_")
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_notifications_{sanitized_phone}",
                {
                    "type": "send_notification",
                    "content": {
                        "type": "ISSUE",
                        "message": f"Owner has updated your issue '{issue.title}' to {status_value}."
                    }
                }
            )
        except Exception:
            pass

        return {"message": "Status updated"}

    @staticmethod
    def update_issue_comment(issue_id, comment):
        try:
            issue = Issue.objects.get(id=issue_id)
        except Issue.DoesNotExist:
            raise Exception("Issue not found")

        if not comment:
            raise ValueError("Comment required")

        issue.owner_comment = comment
        issue.save()

        try:
            sanitized_phone = issue.tenant.phone.replace("+", "").replace("@", "_").replace(".", "_")
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_notifications_{sanitized_phone}",
                {
                    "type": "send_notification",
                    "content": {
                        "type": "ISSUE",
                        "message": f"Owner commented on your issue '{issue.title}': {comment}"
                    }
                }
            )
        except Exception:
            pass

        return {"message": "Comment updated successfully", "owner_comment": issue.owner_comment}

    @staticmethod
    def delete_issue(issue_id):
        try:
            issue = Issue.objects.get(id=issue_id)
            issue.delete()
            return {"message": "Issue deleted successfully"}
        except Issue.DoesNotExist:
            raise Exception("Issue not found")

    @staticmethod
    def update_issue(issue_id, data, files):
        try:
            issue = Issue.objects.get(id=issue_id)
        except Issue.DoesNotExist:
            raise Exception("Issue not found")

        if 'image' in files:
            issue.image = files['image']

        serializer = IssueSerializer(issue, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return {"message": "Issue updated successfully"}
        raise ValueError(serializer.errors)
