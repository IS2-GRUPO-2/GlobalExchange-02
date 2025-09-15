from apps.divisas.models import Divisa, Denominacion

def run():
    """Crear divisas base para el sistema"""
    
    print("🔧 Creando divisas y denominaciones...")
    
    # Divisas principales
    divisas_data = [
        {
            'nombre': 'Peso Argentino',
            'codigo': 'ARS',
            'simbolo': '$',
            'is_active': True,
            'max_digitos': 15,
            'precision': 2
        },
        {
            'nombre': 'Dólar Estadounidense',
            'codigo': 'USD',
            'simbolo': '$',
            'is_active': True,
            'max_digitos': 15,
            'precision': 2
        },
        {
            'nombre': 'Euro',
            'codigo': 'EUR',
            'simbolo': '€',
            'is_active': True,
            'max_digitos': 15,
            'precision': 2
        },
        {
            'nombre': 'Real Brasileño',
            'codigo': 'BRL',
            'simbolo': 'R',
            'is_active': True,
            'max_digitos': 15,
            'precision': 2
        },
        {
            'nombre': 'Peso Chileno',
            'codigo': 'CLP',
            'simbolo': '$',
            'is_active': True,
            'max_digitos': 15,
            'precision': 0
        },
        {
            'nombre': 'Peso Uruguayo',
            'codigo': 'UYU',
            'simbolo': '$',
            'is_active': True,
            'max_digitos': 15,
            'precision': 2
        },
        {
            'nombre': 'Guaraní Paraguayo',
            'codigo': 'PYG',
            'simbolo': '₲',
            'is_active': True,
            'max_digitos': 15,
            'precision': 0,
            'es_base': True
        },
    ]
    
    divisas_creadas = []
    for divisa_data in divisas_data:
        divisa, created = Divisa.objects.get_or_create(
            codigo=divisa_data['codigo'],
            defaults=divisa_data
        )
        divisas_creadas.append(divisa)
        if created:
            print(f"  → Divisa creada: {divisa.nombre} ({divisa.codigo})")
    
    # Denominaciones para ARS (Peso Argentino)
    ars = Divisa.objects.get(codigo='ARS')
    denominaciones_ars = [10, 20, 50, 100, 200, 500, 1000, 2000, 10000]
    
    for valor in denominaciones_ars:
        Denominacion.objects.get_or_create(
            divisa=ars,
            denominacion=valor,
            defaults={
                'is_active': True
            }
        )
    
    # Denominaciones para USD (Dólar)
    usd = Divisa.objects.get(codigo='USD')
    denominaciones_usd = [1, 5, 10, 20, 50, 100]
    
    for valor in denominaciones_usd:
        Denominacion.objects.get_or_create(
            divisa=usd,
            denominacion=valor,
            defaults={
                'is_active': True
            }
        )
    
    # Denominaciones para EUR (Euro)
    eur = Divisa.objects.get(codigo='EUR')
    denominaciones_eur = [5, 10, 20, 50, 100, 200, 500]
    
    for valor in denominaciones_eur:
        Denominacion.objects.get_or_create(
            divisa=eur,
            denominacion=valor,
            defaults={
                'is_active': True
            }
        )
    
    print(f"✅ Divisas: {Divisa.objects.count()} total")
    print(f"✅ Denominaciones: {Denominacion.objects.count()} total")
