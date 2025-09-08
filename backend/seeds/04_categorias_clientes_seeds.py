from apps.clientes.models import CategoriaCliente

def run():
    """Crear categorías de clientes adicionales (las básicas ya existen por migración)"""
    
    print("🔧 Verificando categorías de clientes existentes...")
    
    # Verificar categorías existentes de la migración
    categorias_existentes = list(CategoriaCliente.objects.values_list('nombre', flat=True))
    print(f"  → Categorías existentes: {categorias_existentes}")
    
    # Agregar categorías adicionales si no existen
    categorias_adicionales = [
        {
            'nombre': 'PREMIUM',
            'descripcion': 'Cliente premium con beneficios especiales',
            'descuento': 15.00,
        },
        {
            'nombre': 'CORPORATIVO',
            'descripcion': 'Cliente corporativo con límites especiales',
            'descuento': 20.00,
        }
    ]
    
    for categoria_data in categorias_adicionales:
        categoria, created = CategoriaCliente.objects.get_or_create(
            nombre=categoria_data['nombre'],
            defaults=categoria_data
        )
        if created:
            print(f"  → Categoría creada: {categoria.nombre} ({categoria.descuento}% descuento)")
        else:
            print(f"  → Categoría ya existe: {categoria.nombre}")
    
    print(f"✅ Categorías: {CategoriaCliente.objects.count()} total")
