from decimal import Decimal
from apps.tauser.models import Tauser

def run():
    """Crear Tausers base en ciudades principales de Paraguay"""
    print("🔧 Creando Tausers...")
    tausers_data = [
        {
            'codigo': 'TAU-ASU-001',
            'nombre': 'Tauser Asunción',
            'direccion': 'Av. Mcal. López 1234',
            'ciudad': 'Asunción',
            'departamento': 'Central',
            'latitud': Decimal('-25.263739'),
            'longitud': Decimal('-57.575926'),
            'isActive': True
        },
        {
            'codigo': 'TAU-CDE-001',
            'nombre': 'Tauser Ciudad del Este',
            'direccion': 'Av. San Blas 5678',
            'ciudad': 'Ciudad del Este',
            'departamento': 'Alto Paraná',
            'latitud': Decimal('-25.516336'),
            'longitud': Decimal('-54.611389'),
            'isActive': True
        },
        {
            'codigo': 'TAU-ITA-001',
            'nombre': 'Tauser Itá',
            'direccion': 'Ruta 1 km 35',
            'ciudad': 'Itá',
            'departamento': 'Central',
            'latitud': Decimal('-25.484722'),
            'longitud': Decimal('-57.367222'),
            'isActive': True
        },
        {
            'codigo': 'TAU-ENC-001',
            'nombre': 'Tauser Encarnación',
            'direccion': 'Av. Irrazábal 4321',
            'ciudad': 'Encarnación',
            'departamento': 'Itapúa',
            'latitud': Decimal('-27.330556'),
            'longitud': Decimal('-55.866667'),
            'isActive': True
        },
    ]

    for tauser_data in tausers_data:
        tauser, created = Tauser.objects.get_or_create(
            codigo=tauser_data['codigo'],
            defaults=tauser_data
        )
        if created:
            print(f"  → Tauser creado: {tauser.codigo} - {tauser.ciudad}")
        else:
            print(f"  → Tauser ya existe: {tauser.codigo}")
    print(f"✅ Tausers: {Tauser.objects.count()} total")
