from apps.operaciones.models import TarjetaLocalCatalogo

def run():
    """
    Seed para crear marcas de tarjetas locales iniciales
    """
    marcas_iniciales = [
        {
            "marca": "Visa", 
            "comision_compra": 3.2,
            "comision_venta": 2.8,
            "comision_personalizada_compra": True,
            "comision_personalizada_venta": True,
            "is_active": True
        },
        {
            "marca": "Mastercard", 
            "comision_compra": 3.1,
            "comision_venta": 2.7,
            "comision_personalizada_compra": True,
            "comision_personalizada_venta": False,
            "is_active": True
        },
        {
            "marca": "American Express", 
            "comision_compra": 4.5,
            "comision_venta": 4.0,
            "comision_personalizada_compra": False,
            "comision_personalizada_venta": True,
            "is_active": True
        },
        {
            "marca": "Cabal", 
            "comision_compra": 2.8,
            "comision_venta": 2.5,
            "comision_personalizada_compra": True,
            "comision_personalizada_venta": True,
            "is_active": True
        },
        {
            "marca": "Naranja", 
            "comision_compra": 3.5,
            "comision_venta": 3.2,
            "comision_personalizada_compra": False,
            "comision_personalizada_venta": False,
            "is_active": True
        },
        {
            "marca": "Nativa", 
            "comision_compra": 2.9,
            "comision_venta": 2.6,
            "comision_personalizada_compra": True,
            "comision_personalizada_venta": False,
            "is_active": True
        },
    ]
    
    for marca_data in marcas_iniciales:
        marca, created = TarjetaLocalCatalogo.objects.get_or_create(
            marca=marca_data["marca"],
            defaults={
                "comision_compra": marca_data["comision_compra"],
                "comision_venta": marca_data["comision_venta"],
                "comision_personalizada_compra": marca_data["comision_personalizada_compra"],
                "comision_personalizada_venta": marca_data["comision_personalizada_venta"],
                "is_active": marca_data["is_active"]
            }
        )
        
        if created:
            print(f"✓ Creada marca de tarjeta local: {marca.marca}")
        else:
            print(f"- Marca de tarjeta local ya existe: {marca.marca}")
    
    print(f"Proceso completado. Total de marcas: {TarjetaLocalCatalogo.objects.count()}")
