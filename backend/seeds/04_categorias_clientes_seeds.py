from apps.clientes.models import CategoriaCliente

def run():
    """Crear todas las categorías de clientes del sistema"""
    
    print("🔧 Creando categorías de clientes...")
    
    # Todas las categorías del sistema con sus campos completos
    categorias_data = [
        {
            'nombre': 'MINORISTA',
            'descripcion': 'Cliente minorista con beneficios básicos',
            'descuento': 0.00,
            'is_active': True 
        },
        {
            'nombre': 'MAYORISTA',
            'descripcion': 'Cliente mayorista con descuentos intermedios',
            'descuento': 5.00,
            'is_active': True
        },
        {
            'nombre': 'VIP',
            'descripcion': 'Cliente VIP con beneficios preferenciales',
            'descuento': 10.00,
            'is_active': True
        },
        {
            'nombre': 'PREMIUM',
            'descripcion': 'Cliente premium con beneficios especiales y servicios exclusivos',
            'descuento': 15.00,
            'is_active': True
        },
        {
            'nombre': 'CORPORATIVO',
            'descripcion': 'Cliente corporativo con límites especiales y gestión personalizada',
            'descuento': 20.00,
            'is_active': True
        }
    ]
    
    for categoria_data in categorias_data:
        categoria, created = CategoriaCliente.objects.get_or_create(
            nombre=categoria_data['nombre'],
            defaults={
                'descripcion': categoria_data['descripcion'],
                'descuento': categoria_data['descuento']
            }
        )
        if created:
            print(f"  → Categoría creada: {categoria.nombre} ({categoria.descuento}% descuento)")
        else:
            print(f"  → Categoría ya existe: {categoria.nombre}")
    
    print(f"✅ Categorías: {CategoriaCliente.objects.count()} total")
