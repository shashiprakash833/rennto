import json
from django.db import transaction
from HAC.models import (
    HostelFloorRoom,
    ApartmentFloorUnit,
    CommercialFloor,
    StayHostelDetails,
    ApartmentStayDetails,
    CommericialDetails
)
from .common_service import CommonService

class LayoutService:

    @staticmethod
    def create_layout(request, owner, property_obj, stay_type):
        building_layout = request.data.get("building_layout")
        if not building_layout:
            return

        layout = json.loads(building_layout)

        if stay_type == "hostel":
            room_objects = []
            for floor_data in layout:
                floor_no = floor_data["floorNo"]
                for room in floor_data.get("rooms", []):
                    room_objects.append(
                        HostelFloorRoom(
                            owner=owner,
                            hostel=property_obj,
                            floor=floor_no,
                            roomNo=room["roomNo"],
                            sharing=room["beds"]
                        )
                    )
            HostelFloorRoom.objects.bulk_create(room_objects)

        elif stay_type == "apartment":
            flat_objects = []
            for floor_data in layout:
                floor_no = floor_data["floorNo"]
                for flat in floor_data.get("flats", []):
                    flat_objects.append(
                        ApartmentFloorUnit(
                            owner=owner,
                            apartment=property_obj,
                            floor=floor_no,
                            flatNo=flat["flatNo"],
                            bhk=flat["bhk"]
                        )
                    )
            ApartmentFloorUnit.objects.bulk_create(flat_objects)

        else:
            section_objects = []
            for floor_data in layout:
                floor_no = floor_data["floorNo"]
                for section in floor_data.get("sections", []):
                    section_objects.append(
                        CommercialFloor(
                            owner=owner,
                            commercial_property=property_obj,
                            floorNo=floor_no,
                            sectionNo=section["sectionNo"],
                            area_sqft=section.get("area", section.get("area_sqft"))
                        )
                    )
            CommercialFloor.objects.bulk_create(section_objects)

    @staticmethod
    @transaction.atomic
    def update_building_layout(phone, data):
        owner = CommonService.get_owner(phone)
        if not owner:
            raise Exception("Owner not found")

        building_layout = data.get("building_layout")
        stay_type = data.get("stay_type")

        if not building_layout or not stay_type:
            raise ValueError("Missing building_layout or stay_type")

        if isinstance(building_layout, str):
            layout = json.loads(building_layout)
        else:
            layout = building_layout

        if stay_type == "hostel":
            property_obj = StayHostelDetails.objects.filter(owner=owner).first()
            if not property_obj:
                raise Exception("Property not found")
            
            HostelFloorRoom.objects.filter(owner=owner).delete()
            
            for floor_data in layout:
                floor_no = floor_data.get("floorNo")
                for room in floor_data.get("rooms", []):
                    HostelFloorRoom.objects.create(
                        owner=owner,
                        hostel=property_obj,
                        floor=floor_no,
                        roomNo=room.get("roomNo"),
                        sharing=room.get("beds")
                    )

        elif stay_type == "apartment":
            property_obj = ApartmentStayDetails.objects.filter(owner=owner).first()
            if not property_obj:
                raise Exception("Property not found")
            
            ApartmentFloorUnit.objects.filter(owner=owner).delete()
            
            for floor_data in layout:
                floor_no = floor_data.get("floorNo")
                for flat in floor_data.get("flats", []):
                    ApartmentFloorUnit.objects.create(
                        owner=owner,
                        apartment=property_obj,
                        floor=floor_no,
                        flatNo=flat.get("flatNo"),
                        bhk=flat.get("bhk")
                    )

        elif stay_type == "commercial":
            property_obj = CommericialDetails.objects.filter(owner=owner).first()
            if not property_obj:
                raise Exception("Property not found")
            
            CommercialFloor.objects.filter(owner=owner).delete()
            
            for floor_data in layout:
                floor_no = floor_data.get("floorNo")
                for section in floor_data.get("sections", []):
                    CommercialFloor.objects.create(
                        owner=owner,
                        commercial_property=property_obj,
                        floorNo=floor_no,
                        sectionNo=section.get("sectionNo"),
                        area_sqft=section.get("area_sqft")
                    )
        else:
            raise ValueError("Invalid stay_type")

        return {"message": "Building layout updated successfully"}