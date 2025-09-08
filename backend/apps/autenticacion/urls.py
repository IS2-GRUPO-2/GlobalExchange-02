from django.urls import path
from .views import RegisterView, VerifyEmailView

urlpatterns = [
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("register/", RegisterView.as_view(), name="register"),
]
