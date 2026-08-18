import json


class FacilityService:

    FACILITY_FIELDS = [
        "wifi",
        "parking",
        "food",
        "lift",
        "power_backup",
        "security",
        "play_area",
        "mess",
        "laundry",
        "water",
        "ac",
        "non_ac",
    ]

    @classmethod
    def get_facilities(cls, request):

        facilities_raw = request.data.get("facilities")

        if facilities_raw:

            try:

                parsed = (
                    json.loads(facilities_raw)
                    if isinstance(facilities_raw, str)
                    else facilities_raw
                )

                return list({
                    str(f).lower().strip()
                    for f in parsed
                    if f
                })

            except Exception:
                return []

        return [
            field
            for field in cls.FACILITY_FIELDS
            if str(request.data.get(field)).lower() == "true"
        ]