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
from apps.notificaciones.notification_service import NotificationService
from apps.notificaciones.models import (
    NotificacionTasaUsuario,
    NotificacionTasaCliente,
    NotificacionCambioTasa,
)
from apps.divisas.models import Divisa
from apps.operaciones.models import Transaccion
from django.db.models import Q
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
    1. Obtiene usuarios con notificaciones de tasa activas y divisa suscrita
    2. Obtiene clientes con notificaciones de tasa activas y divisa suscrita
    3. Identifica usuarios con transacciones pendientes sobre la divisa
    4. Genera notificaciones visuales (toast) para los usuarios detectados
    5. Elimina correos duplicados y envía notificaciones por email
        """

        recipient_list = set()  # Usar set para evitar duplicados
        usuarios_eventos = {}
        usuarios_cache = {}

        def registrar_usuario(usuario, tipo_evento):
            if not usuario or not usuario.is_active:
                return
            evento_actual = usuarios_eventos.get(usuario.id)
            if evento_actual == NotificacionCambioTasa.TipoEvento.TRANSACCION_PENDIENTE:
                return
            if evento_actual is None or tipo_evento == NotificacionCambioTasa.TipoEvento.TRANSACCION_PENDIENTE:
                usuarios_eventos[usuario.id] = tipo_evento
                usuarios_cache[usuario.id] = usuario

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
            registrar_usuario(pref.usuario, NotificacionCambioTasa.TipoEvento.SUSCRIPCION)

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
            for usuario in pref.cliente.usuarios.filter(is_active=True, email_verified=True):
                registrar_usuario(usuario, NotificacionCambioTasa.TipoEvento.SUSCRIPCION)

        # ===================================================
        # 3. TRANSACCIONES PENDIENTES
        # ===================================================
        transacciones_pendientes = Transaccion.objects.filter(
            Q(divisa_origen=divisa) | Q(divisa_destino=divisa),
            estado='pendiente'
        ).select_related('id_user')

        for transaccion in transacciones_pendientes:
            usuario_transaccion = transaccion.id_user
            registrar_usuario(
                usuario_transaccion,
                NotificacionCambioTasa.TipoEvento.TRANSACCION_PENDIENTE
            )

            if (
                usuario_transaccion
                and usuario_transaccion.is_active
                and getattr(usuario_transaccion, "email_verified", False)
                and usuario_transaccion.email
            ):
                recipient_list.add(usuario_transaccion.email)

        # ===================================================
        # 4. CREAR NOTIFICACIONES TOAST
        # ===================================================
        tiene_toasts = bool(usuarios_eventos)
        if tiene_toasts:
            base_codigo = Divisa.objects.filter(es_base=True).values_list('codigo', flat=True).first() or 'BASE'

            def _format_decimal(value):
                return f"{value:.2f}".rstrip('0').rstrip('.') if value is not None else "0"

            compra_nueva_str = _format_decimal(new_tasa_compra)
            compra_anterior_str = _format_decimal(old_tasa_compra)
            venta_nueva_str = _format_decimal(new_tasa_venta)
            venta_anterior_str = _format_decimal(old_tasa_venta)
            par_divisa = f"{divisa.codigo}/{base_codigo}"

            notificaciones_bulk = []

            for usuario_id, tipo_evento in usuarios_eventos.items():
                usuario = usuarios_cache.get(usuario_id)
                if not usuario:
                    continue

                if tipo_evento == NotificacionCambioTasa.TipoEvento.TRANSACCION_PENDIENTE:
                    titulo = f"Transacción pendiente actualizada - {par_divisa}"
                    descripcion = (
                        "Tasa actualizada. "
                        f"Compra Gs {compra_anterior_str} -> Gs {compra_nueva_str} | "
                        f"Venta Gs {venta_anterior_str} -> Gs {venta_nueva_str}"
                    )
                else:
                    titulo = f"Cambio en tasa de {par_divisa}"
                    descripcion = (
                        f"Nueva tasa compra Gs {compra_nueva_str} (antes Gs {compra_anterior_str}). "
                        f"Venta Gs {venta_nueva_str} (antes Gs {venta_anterior_str})"
                    )

                notificaciones_bulk.append(
                    NotificacionCambioTasa(
                        usuario=usuario,
                        divisa=divisa,
                        tipo_evento=tipo_evento,
                        titulo=titulo,
                        descripcion=descripcion,
                        tasa_compra_anterior=old_tasa_compra,
                        tasa_compra_nueva=new_tasa_compra,
                        tasa_venta_anterior=old_tasa_venta,
                        tasa_venta_nueva=new_tasa_venta,
                    )
                )

            if notificaciones_bulk:
                NotificacionCambioTasa.objects.bulk_create(notificaciones_bulk)

        # ===================================================
        # 5. PREPARAR Y ENVIAR NOTIFICACIÓN POR EMAIL
        # ===================================================
        if not recipient_list and not tiene_toasts:
            return

        recipient_list = list(recipient_list)

        if not recipient_list:
            return

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
