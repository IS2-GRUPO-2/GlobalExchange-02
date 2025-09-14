from apps.notificaciones.notification_service import NotificationService
from django.urls import reverse
from django.core import mail
import pytest

@pytest.fixture
def notification_service():
    return NotificationService(from_email="test@correo.com")

def test_send_email(notification_service):
    subject = "Test Subject"
    template_name = "emails/verification_code.html"
    context = {"code": "123456", "user": {"first_name": "Test User"}}
    recipient_list = ["test@correo.com"]

    notification_service.send_email(subject, template_name, context, recipient_list)

    assert len(mail.outbox) == 1
    assert mail.outbox[0].subject == subject
    assert mail.outbox[0].to == recipient_list