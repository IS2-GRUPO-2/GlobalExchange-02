from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

TEMPLATE_DIR = "backend/templates/"
class NotificationService:
    """
    Servicio centralizado de notificaciones.
    Actualmente soporta:
      - Email (HTML + texto plano)
    Futuro: SMS, WhatsApp, Push, etc.
    """

    def __init__(self, from_email=None):
        self.from_email = from_email or settings.DEFAULT_FROM_EMAIL

    def send_email(self, subject, template_name, context, recipient_list):
        """
        Envía un correo HTML usando plantillas de Django.
        """
        html_content = render_to_string(template_name, context)
        text_content = render_to_string(template_name, context)  # opcional como fallback

        msg = EmailMultiAlternatives(subject, text_content, self.from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")
        msg.send()

    def send_notification(self, channel, **kwargs):
        """
        Enrutador genérico para distintos canales.
        """
        if channel == "email":
            return self.send_email(
                subject=kwargs.get("subject"),
                template_name=kwargs.get("template_name"),
                context=kwargs.get("context", {}),
                recipient_list=kwargs.get("recipient_list", []),
            )
        # Para mas canales en el futuro:
        # elif channel == "sms": self.send_sms(...)
        # elif channel == "push": self.send_push(...)
        else:
            raise ValueError(f"Canal de notificación no soportado: {channel}")
