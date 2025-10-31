from django.apps import AppConfig


class OperacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.operaciones'

    def ready(self):
        import apps.operaciones.signals