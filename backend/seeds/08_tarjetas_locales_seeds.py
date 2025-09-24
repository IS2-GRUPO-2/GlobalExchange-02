from apps.operaciones.models import TarjetaLocalCatalogo

def run():
    """
    Seed para crear marcas de tarjetas locales iniciales
    """
    marcas_iniciales = [
        {"marca": "Visa", "is_active": True},
        {"marca": "Mastercard", "is_active": True},
        {"marca": "American Express", "is_active": True},
        {"marca": "Cabal", "is_active": True},
        {"marca": "Naranja", "is_active": True},
        {"marca": "Nativa", "is_active": True},
    ]
    
    for marca_data in marcas_iniciales:
        marca, created = TarjetaLocalCatalogo.objects.get_or_create(
            marca=marca_data["marca"],
            defaults={"is_active": marca_data["is_active"]}
        )
        
        if created:
            print(f"✓ Creada marca de tarjeta local: {marca.marca}")
        else:
            print(f"- Marca de tarjeta local ya existe: {marca.marca}")
    
    print(f"Proceso completado. Total de marcas: {TarjetaLocalCatalogo.objects.count()}")
