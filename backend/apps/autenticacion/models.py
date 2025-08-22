from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

# Get the custom user model
User = get_user_model()

class EmailVerificationCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_codes")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)
