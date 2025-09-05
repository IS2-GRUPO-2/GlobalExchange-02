from rest_framework import serializers
from django.contrib.auth.models import Permission

class PermissionMiniSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source="content_type.app_label", read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "codename", "name", "app_label"]