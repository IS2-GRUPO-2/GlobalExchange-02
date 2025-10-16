"""
Módulo de serializers para la gestión de tasas.

Define el serializer principal para el modelo Tasa, incluyendo
validaciones personalizadas, cálculo dinámico de tasas de compra/venta,
y manejo automático del historial asociado.
"""
from decimal import Decimal
from rest_framework import serializers
from django.utils import timezone
from apps.cotizaciones.models import Tasa
from apps.cotizaciones.service import TasaService
from apps.clientes.models import Cliente
from apps.notificaciones.notification_service import NotificationService
from apps.notificaciones.models import (
    NotificacionTasaUsuario,
    NotificacionTasaCliente
)
import logging

notification_service = NotificationService()


class TasaSerializer(serializers.ModelSerializer):
    """
    Serializer principal para el modelo Tasa.

    Incluye campos calculados dinámicamente (`tasaCompra` y `tasaVenta`),
    validaciones de negocio y lógica extendida para crear o actualizar
    instancias junto con su historial.

    Campos adicionales:
        - tasaCompra (str): Valor de la tasa de compra, calculado por TasaService.
        - tasaVenta (str): Valor de la tasa de venta, calculado por TasaService.
    """
    tasaCompra = serializers.SerializerMethodField()
    tasaVenta = serializers.SerializerMethodField()

    class Meta:
        model = Tasa
        fields = (
            "id", "divisa",
            "precioBase", "comisionBaseCompra", "comisionBaseVenta", "activo",
            "tasaCompra", "tasaVenta",
            "fechaCreacion", "fechaActualizacion",
        )
        read_only_fields = ("id", "fechaCreacion", "fechaActualizacion")

    def get_tasaCompra(self, obj):
        """
        Calcula la tasa de compra de la divisa asociada.

        Args:
            obj (Tasa): Instancia de la tasa.

        Returns:
            str: Valor calculado de la tasa de compra.
        """
        valor = TasaService.calcular_tasa_compra(obj)
        return str(valor)

    def get_tasaVenta(self, obj):
        """
        Calcula la tasa de venta de la divisa asociada.

        Args:
            obj (Tasa): Instancia de la tasa.

        Returns:
            str: Valor calculado de la tasa de venta.
        """
        valor = TasaService.calcular_tasa_venta(obj)
        return str(valor)

    # ---- Validaciones ----

    def validate(self, attrs):
        """
        Aplica validaciones de negocio sobre la tasa.

        Reglas:
            - Una divisa no puede tener más de una tasa activa.
            - No se puede cambiar la divisa de una tasa ya creada.
            - No se puede activar la tasa si la divisa está inactiva.

        Args:
            attrs (dict): Datos validados del serializer.

        Returns:
            dict: Datos validados tras aplicar las reglas.

        Raises:
            serializers.ValidationError: Si se incumple alguna regla.
        """
        instance = getattr(self, "instance", None)
        divisa = attrs.get("divisa") or (instance.divisa if instance else None)
        activo = attrs.get("activo", instance.activo if instance else True)

        if instance is None:
            if divisa is None:
                raise serializers.ValidationError(
                    "Debe especificar una divisa.")
            if Tasa.objects.filter(divisa=divisa).exists():

                raise serializers.ValidationError(
                    "La divisa ya tiene una Cotización asociada.")

        if instance is not None and "divisa" in attrs and divisa != instance.divisa:
            raise serializers.ValidationError(
                "No se puede cambiar la divisa de una Cotización.")

        if activo and divisa and not divisa.is_active:
            raise serializers.ValidationError(
                "No se puede activar una Cotización si la divisa está inactiva.")

        return attrs

    # ---- Create/Update con historial ----
    def create(self, validated_data):
        """
        Crea una nueva tasa y su primer historial asociado.

        Args:
            validated_data (dict): Datos validados para crear la tasa.

        Returns:
            Tasa: Instancia creada.
        """
        tasa = Tasa.objects.create(**validated_data)
        TasaService.crear_historial(tasa)
        return tasa

    def update(self, instance, validated_data):
        """
        Actualiza los campos de una tasa y genera un nuevo historial
        si cambian los valores base o comisiones.

        Args:
            instance (Tasa): Instancia existente a actualizar.
            validated_data (dict): Datos validados.

        Returns:
            Tasa: Instancia actualizada.
        """
        old_precio = Decimal(instance.precioBase)
        old_comision_compra = Decimal(instance.comisionBaseCompra)
        old_comision_venta = Decimal(instance.comisionBaseVenta)
        old_tasa_venta = TasaService.calcular_tasa_venta(instance)
        old_tasa_compra = TasaService.calcular_tasa_compra(instance)
        divisa = instance.divisa

        instance.precioBase = validated_data.get(
            "precioBase", instance.precioBase)
        instance.comisionBaseCompra = validated_data.get(
            "comisionBaseCompra", instance.comisionBaseCompra)
        instance.comisionBaseVenta = validated_data.get(
            "comisionBaseVenta", instance.comisionBaseVenta)

        if "activo" in validated_data:
            instance.activo = validated_data["activo"]

        instance.save()

        if Decimal(instance.precioBase) != old_precio or Decimal(instance.comisionBaseCompra) != old_comision_compra or Decimal(instance.comisionBaseVenta) != old_comision_venta:
            TasaService.crear_historial(instance)
            try:
                new_tasa_venta = TasaService.calcular_tasa_venta(instance)
                new_tasa_compra = TasaService.calcular_tasa_compra(instance)

                self._notificar_cambio_tasa(
                    divisa=divisa,
                    new_tasa_venta=new_tasa_venta,
                    old_tasa_venta=old_tasa_venta,
                    new_tasa_compra=new_tasa_compra,
                    old_tasa_compra=old_tasa_compra
                )
            except Exception as e:
                logger = logging.getLogger(__name__)
                logger.error(
                    f"Error enviando notificación de tasa: {e}", exc_info=True)

        return instance

    def _notificar_cambio_tasa(self, divisa, new_tasa_venta, old_tasa_venta, new_tasa_compra, old_tasa_compra):
        """
        Envía notificaciones de cambio de tasa filtrando por preferencias.

        Lógica:
        1. Obtiene usuarios con notificaciones de tasa activas Y divisa suscrita
        2. Obtiene clientes con notificaciones de tasa activas Y divisa suscrita
        3. Recopila emails de usuarios de esos clientes
        4. Elimina duplicados y envía notificaciones
        """

        recipient_list = set()  # Usar set para evitar duplicados

        # ===================================================
        # 1. NOTIFICACIONES DE TASA DE USUARIO
        # ===================================================
        preferencias_usuario = NotificacionTasaUsuario.objects.filter(
            is_active=True,
            divisas_suscritas=divisa,
            usuario__is_active=True,
            usuario__email_verified=True
        ).select_related('usuario')

        for pref in preferencias_usuario:
            if pref.usuario.email:
                recipient_list.add(pref.usuario.email)

        # ===================================================
        # 2. NOTIFICACIONES DE TASA DE CLIENTE
        # ===================================================
        preferencias_cliente = NotificacionTasaCliente.objects.filter(
            is_active=True,
            divisas_suscritas=divisa,
            cliente__is_active=True
        ).select_related('cliente').prefetch_related('cliente__usuarios')

        for pref in preferencias_cliente:
            # Obtener todos los correos de clientes
            if pref.cliente.correo:
                recipient_list.add(pref.cliente.correo)

        # Convertir set a lista
        recipient_list = list(recipient_list)

        if not recipient_list:
            return

         # ===================================================
        # 3. PREPARAR Y ENVIAR NOTIFICACIÓN
        # ===================================================
        variacion_compra = new_tasa_compra - old_tasa_compra
        variacion_venta = new_tasa_venta - old_tasa_venta
        porcentaje_variacion_compra = (
            (variacion_compra / old_tasa_compra) * 100
            if old_tasa_compra > 0 else 0
        )
        porcentaje_variacion_venta = (
            (variacion_venta / old_tasa_venta) * 100
            if old_tasa_venta > 0 else 0
        )

        context = {
            'divisa': divisa.nombre,
            'codigo_divisa': divisa.codigo,
            'tasa_anterior_compra': f"{old_tasa_compra:.2f}",
            'tasa_nueva_compra': f"{new_tasa_compra:.2f}",
            'variacion_compra': f"{variacion_compra:+.2f}",
            'porcentaje_variacion_compra': f"{porcentaje_variacion_compra:+.2f}",
            'tasa_anterior_venta': f"{old_tasa_venta:.2f}",
            'tasa_nueva_venta': f"{new_tasa_venta:.2f}",
            'variacion_venta': f"{variacion_venta:+.2f}",
            'porcentaje_variacion_venta': f"{porcentaje_variacion_venta:+.2f}",
            'fecha_actualizacion': timezone.now().strftime("%d/%m/%Y %H:%M"),
        }

        try:
            notification_service.send_notification(
                channel="email",
                subject=f"Cambio en la tasa de {divisa.codigo}",
                template_name="emails/cambio_tasa.html",
                context=context,
                recipient_list=recipient_list,
            )

            import logging
            logger = logging.getLogger(__name__)
            logger.info(
                f"Notificaciones de cambio de tasa enviadas a "
                f"{len(recipient_list)} destinatarios para {divisa.codigo}"
            )

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(
                f"Error enviando notificación de cambio de tasa: {e}",
                exc_info=True
            )
