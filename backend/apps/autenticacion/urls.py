from django.urls import path
from .views import (
    RegisterView, 
    VerifyEmailView,
    MFAStatusView,
    MFASetupView,
    MFAEnableView,
    MFADisableView,
    CustomLoginView,
    MFAVerifyLoginView
)

urlpatterns = [
    # Authentication
    path("login/", CustomLoginView.as_view(), name="custom-login"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("register/", RegisterView.as_view(), name="register"),
    
    # MFA Management endpoints
    path("mfa/status/", MFAStatusView.as_view(), name="mfa-status"),
    path("mfa/setup/", MFASetupView.as_view(), name="mfa-setup"),
    path("mfa/enable/", MFAEnableView.as_view(), name="mfa-enable"),
    path("mfa/disable/", MFADisableView.as_view(), name="mfa-disable"),
    
    # MFA Login verification
    path("mfa/verify-login/", MFAVerifyLoginView.as_view(), name="mfa-verify-login"),
]
