from rest_framework import serializers
from .models import Tauser


class TauserSerializer(serializers.ModelSerializer):
    """
    Serializer principal para el modelo Tauser.

    Maneja la serialización y deserialización de terminales de autoservicio,
    proporcionando validación automática y soporte para operaciones CRUD.
    """
    class Meta:
        model = Tauser
        fields = "__all__"


class TauserPaginatedResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = TauserSerializer(many=True)
