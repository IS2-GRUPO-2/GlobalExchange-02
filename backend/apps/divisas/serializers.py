from rest_framework import serializers
from .models import Divisa, Denominacion, LimiteConfig

class DivisaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Divisa
        fields = '__all__'

class DivisaPaginatedResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = DivisaSerializer(many=True)


class DenominacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Denominacion
        fields = '__all__'

class LimiteConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = LimiteConfig        
        fields = '__all__'