from rest_framework import serializers
from django.contrib.auth.models import Group, Permission

class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all()
    )

    class Meta:
        model = Group
        fields = ["id", "name", "permissions"]