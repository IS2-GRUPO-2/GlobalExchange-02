import pytest
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from globalexchange.serializers import UserSerializer

@pytest.mark.django_db
def test_user_serializer_creates_user():
    data = {
        "username": "testfer",
        "password": "fersecret",
        "email": "fer@example.com",
        "first_name": "Fer",
        "last_name": "Fleitas",
    }

    serializer = UserSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    user = serializer.save()

    assert User.objects.count() == 1
    assert user.username == "testfer"
    assert user.check_password("fersecret")
    assert user.email == "fer@example.com"
