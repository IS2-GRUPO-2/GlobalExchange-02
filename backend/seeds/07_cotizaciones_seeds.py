from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from apps.cotizaciones.models import Tasa, HistorialTasa
from apps.divisas.models import Divisa

def run():
    """Crear tasas base para las divisas del sistema"""
    
    print("🔧 Creando tasas de cotización...")
    
    # Tasas base aproximadas (valores referenciales)
    # PYG es la divisa base, todas las tasas se expresan en relación a PYG
    tasas_data = [
        {
            'codigo_divisa': 'USD',
            'precio_base': Decimal('7300.0000000000'),  # 1 USD = 7,300 PYG aproximadamente
            'comision_base_compra': Decimal('50.0000000000'),  # 50 PYG de comisión base
            'comision_base_venta': Decimal('50.0000000000'),
            'activo': True
        },
        {
            'codigo_divisa': 'ARS',
            'precio_base': Decimal('8.5000000000'),  # 1 ARS = 8.5 PYG aproximadamente
            'comision_base_compra': Decimal('0.5000000000'),
            'comision_base_venta': Decimal('0.5000000000'),
            'activo': True
        },
        {
            'codigo_divisa': 'EUR',
            'precio_base': Decimal('8000.0000000000'),  # 1 EUR = 8,000 PYG aproximadamente
            'comision_base_compra': Decimal('60.0000000000'),
            'comision_base_venta': Decimal('60.0000000000'),
            'activo': True
        },
        {
            'codigo_divisa': 'BRL',
            'precio_base': Decimal('1350.0000000000'),  # 1 BRL = 1,350 PYG aproximadamente
            'comision_base_compra': Decimal('10.0000000000'),
            'comision_base_venta': Decimal('10.0000000000'),
            'activo': True
        },
        {
            'codigo_divisa': 'CLP',
            'precio_base': Decimal('8.2000000000'),  # 1 CLP = 8.2 PYG aproximadamente
            'comision_base_compra': Decimal('0.3000000000'),
            'comision_base_venta': Decimal('0.3000000000'),
            'activo': True
        },
        {
            'codigo_divisa': 'UYU',
            'precio_base': Decimal('180.0000000000'),  # 1 UYU = 180 PYG aproximadamente
            'comision_base_compra': Decimal('5.0000000000'),
            'comision_base_venta': Decimal('5.0000000000'),
            'activo': True
        },
    ]
    
    for tasa_data in tasas_data:
        try:
            divisa = Divisa.objects.get(codigo=tasa_data['codigo_divisa'])
            
            tasa, created = Tasa.objects.get_or_create(
                divisa=divisa,
                defaults={
                    'precioBase': tasa_data['precio_base'],
                    'comisionBaseCompra': tasa_data['comision_base_compra'],
                    'comisionBaseVenta': tasa_data['comision_base_venta'],
                    'activo': tasa_data['activo']
                }
            )
            
            if created:
                print(f"  → Tasa creada: {divisa.codigo} - {tasa.precioBase} PYG")
            else:
                print(f"  → Tasa ya existe: {divisa.codigo}")
            
            # Eliminar historial existente para esta tasa (para regenerarlo)
            historial_existente = HistorialTasa.objects.filter(tasa=tasa).count()
            if historial_existente > 0:
                HistorialTasa.objects.filter(tasa=tasa).delete()
                print(f"    → Eliminados {historial_existente} registros de historial previos")
            
            # Crear historial desde el 1 de enero de 2025 hasta hoy
            # Simulando fluctuaciones realistas del tipo de cambio
            fecha_actual = timezone.now()
            fecha_inicio = timezone.make_aware(datetime(2025, 1, 1, 0, 0, 0))
            
            # Calcular días desde inicio del año
            dias_totales = (fecha_actual - fecha_inicio).days + 1
            
            # Crear registros en lote para mejorar el rendimiento
            registros_historial = []
            for dia_index in range(dias_totales):
                fecha = fecha_inicio + timedelta(days=dia_index)
                
                # Generar variación del precio base (±3% pseudo-aleatoria)
                # Usamos un patrón basado en días para reproducibilidad
                variacion = Decimal(str((dia_index % 7 - 3) / 100.0))  # -3% a +3%
                precio_con_variacion = tasa_data['precio_base'] * (Decimal('1.0') + variacion)
                
                registro = HistorialTasa(
                    tasa=tasa,
                    tasaCompra=precio_con_variacion + tasa_data['comision_base_compra'],
                    tasaVenta=precio_con_variacion - tasa_data['comision_base_venta']
                )
                registros_historial.append((registro, fecha))
            
            # Crear todos los registros en bulk
            objetos_creados = [reg for reg, _ in registros_historial]
            HistorialTasa.objects.bulk_create(objetos_creados)
            
            # Actualizar las fechas después de la creación (necesario porque auto_now_add=True)
            # Obtener los IDs de los registros recién creados
            ids_creados = list(HistorialTasa.objects.filter(tasa=tasa).order_by('-id')[:dias_totales].values_list('id', flat=True))
            ids_creados.reverse()  # Ordenar del más antiguo al más reciente
            
            # Actualizar cada registro con su fecha correspondiente
            for i, registro_id in enumerate(ids_creados):
                _, fecha = registros_historial[i]
                HistorialTasa.objects.filter(id=registro_id).update(fechaCreacion=fecha)
            
            print(f"    → Historial de {dias_totales} días creado para {divisa.codigo} (desde 01/01/2025)")
                
        except Divisa.DoesNotExist:
            print(f"  ⚠️  Divisa no encontrada: {tasa_data['codigo_divisa']}")
    
    print(f"✅ Tasas: {Tasa.objects.count()} total")
    print(f"✅ Historial de tasas: {HistorialTasa.objects.count()} total")
