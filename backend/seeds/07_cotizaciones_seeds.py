from decimal import Decimal
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
                
                # Crear entrada en historial de tasa
                HistorialTasa.objects.create(
                    tasa=tasa,
                    tasaCompra=tasa_data['precio_base'] + tasa_data['comision_base_compra'],
                    tasaVenta=tasa_data['precio_base'] - tasa_data['comision_base_venta']
                )
                print(f"    → Historial inicial creado para {divisa.codigo}")
            else:
                print(f"  → Tasa ya existe: {divisa.codigo}")
                
        except Divisa.DoesNotExist:
            print(f"  ⚠️  Divisa no encontrada: {tasa_data['codigo_divisa']}")
    
    print(f"✅ Tasas: {Tasa.objects.count()} total")
    print(f"✅ Historial de tasas: {HistorialTasa.objects.count()} total")
