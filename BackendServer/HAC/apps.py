from django.apps import AppConfig


class HacConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = 'HAC'

    def ready(self):
        import HAC.signals
