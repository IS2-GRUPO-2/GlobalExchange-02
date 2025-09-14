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
        {
            'nombre': 'Sol Peruano',
            'codigo': 'PEN',
            'simbolo': 'S',
            'is_active': True,
            'max_digitos': 15,
            'precision': 2
        }
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
    denominaciones_ars = [
        {'valor': 10, 'denominacion': 'Billete de $10'},
        {'valor': 20, 'denominacion': 'Billete de $20'},
        {'valor': 50, 'denominacion': 'Billete de $50'},
        {'valor': 100, 'denominacion': 'Billete de $100'},
        {'valor': 200, 'denominacion': 'Billete de $200'},
        {'valor': 500, 'denominacion': 'Billete de $500'},
        {'valor': 1000, 'denominacion': 'Billete de $1000'},
        {'valor': 2000, 'denominacion': 'Billete de $2000'},
        {'valor': 10000, 'denominacion': 'Billete de $10000'},
    ]
    
    for denom_data in denominaciones_ars:
        Denominacion.objects.get_or_create(
            divisa=ars,
            denominacion=denom_data['valor'],
            defaults={
                'is_active': True
            }
        )
    
    # Denominaciones para USD (Dólar)
    usd = Divisa.objects.get(codigo='USD')
    denominaciones_usd = [
        {'valor': 1, 'denominacion': 'Billete de $1'},
        {'valor': 5, 'denominacion': 'Billete de $5'},
        {'valor': 10, 'denominacion': 'Billete de $10'},
        {'valor': 20, 'denominacion': 'Billete de $20'},
        {'valor': 50, 'denominacion': 'Billete de $50'},
        {'valor': 100, 'denominacion': 'Billete de $100'},
    ]
    
    for denom_data in denominaciones_usd:
        Denominacion.objects.get_or_create(
            divisa=usd,
            denominacion=denom_data['valor'],
            defaults={
                'is_active': True
            }
        )
    
    # Denominaciones para EUR (Euro)
    eur = Divisa.objects.get(codigo='EUR')
    denominaciones_eur = [
        {'valor': 5, 'denominacion': 'Billete de €5'},
        {'valor': 10, 'denominacion': 'Billete de €10'},
        {'valor': 20, 'denominacion': 'Billete de €20'},
        {'valor': 50, 'denominacion': 'Billete de €50'},
        {'valor': 100, 'denominacion': 'Billete de €100'},
        {'valor': 200, 'denominacion': 'Billete de €200'},
        {'valor': 500, 'denominacion': 'Billete de €500'},
    ]
    
    for denom_data in denominaciones_eur:
        Denominacion.objects.get_or_create(
            divisa=eur,
            denominacion=denom_data['valor'],
            defaults={
                'is_active': True
            }
        )
    
    print(f"✅ Divisas: {Divisa.objects.count()} total")
    print(f"✅ Denominaciones: {Denominacion.objects.count()} total")
