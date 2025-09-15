from apps.clientes.models import Cliente, CategoriaCliente
from apps.usuarios.models import User

def run():
    """Crear clientes base para el sistema"""
    
    print("🔧 Creando clientes base...")
    
    # Verificar que existan las categorías
    try:
        categoria_minorista = CategoriaCliente.objects.get(nombre='MINORISTA')
        categoria_mayorista = CategoriaCliente.objects.get(nombre='MAYORISTA')
        categoria_vip = CategoriaCliente.objects.get(nombre='VIP')
        categoria_premium = CategoriaCliente.objects.get(nombre='PREMIUM')
        categoria_corporativo = CategoriaCliente.objects.get(nombre='CORPORATIVO')
    except CategoriaCliente.DoesNotExist as e:
        print(f"❌ Error: Categorías no encontradas: {e}")
        print("   Ejecutar primero 04_categorias_clientes_seeds")
        return
    
    # Obtener usuarios existentes
    try:
        usuario_cliente = User.objects.get(email='cliente@globalexchange.com')
        usuario_ana = User.objects.get(email='ana.garcia@email.com')
        usuario_carlos = User.objects.get(email='carlos.lopez@email.com')
        usuario_sofia = User.objects.get(email='sofia.martinez@email.com')
        usuario_pedro = User.objects.get(email='pedro.gonzalez@email.com')
        usuario_laura = User.objects.get(email='laura.rodriguez@email.com')
    except User.DoesNotExist:
        print("❌ Error: Usuarios no encontrados. Ejecutar primero 01_usuarios_seeds")
        return
    
    # Datos de clientes
    clientes_data = [
        {
            'nombre': 'María Elena Cliente González',
            'isPersonaFisica': True,
            'idCategoria': categoria_minorista,
            'cedula': '12345678',
            'correo': 'cliente@globalexchange.com',
            'telefono': '+54911234567',
            'direccion': 'Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires, Argentina',
            'isActive': True,
            'ruc': None
        },
        {
            'nombre': 'Ana García Fernández',
            'isPersonaFisica': True,
            'idCategoria': categoria_premium,
            'cedula': '23456789',
            'correo': 'ana.garcia@email.com',
            'telefono': '+54911234568',
            'direccion': 'Av. Santa Fe 5678, Ciudad Autónoma de Buenos Aires, Argentina',
            'isActive': True,
            'ruc': None
        },
        {
            'nombre': 'Carlos López Martínez',
            'isPersonaFisica': True,
            'idCategoria': categoria_vip,
            'cedula': '34567890',
            'correo': 'carlos.lopez@email.com',
            'telefono': '+54911234569',
            'direccion': 'Av. Rivadavia 9012, Ciudad Autónoma de Buenos Aires, Argentina',
            'isActive': True,
            'ruc': None
        },
        {
            'nombre': 'Sofía Martínez Silva',
            'isPersonaFisica': True,
            'idCategoria': categoria_mayorista,
            'cedula': '45678901',
            'correo': 'sofia.martinez@email.com',
            'telefono': '+54911234570',
            'direccion': 'Av. Callao 3456, Ciudad Autónoma de Buenos Aires, Argentina',
            'isActive': True,
            'ruc': None
        },
        {
            'nombre': 'Pedro González & Asociados S.A.',
            'isPersonaFisica': False,
            'idCategoria': categoria_corporativo,
            'cedula': None,
            'correo': 'pedro.gonzalez@email.com',
            'telefono': '+54911234571',
            'direccion': 'Av. Pueyrredón 7890, Ciudad Autónoma de Buenos Aires, Argentina',
            'isActive': True,
            'ruc': '20-12345678-9'
        },
        {
            'nombre': 'Laura Rodríguez Importaciones SRL',
            'isPersonaFisica': False,
            'idCategoria': categoria_mayorista,
            'cedula': None,
            'correo': 'laura.rodriguez@email.com',
            'telefono': '+54911234572',
            'direccion': 'Av. Las Heras 2345, Ciudad Autónoma de Buenos Aires, Argentina',
            'isActive': True,
            'ruc': '30-87654321-7'
        }
    ]
    
    # Crear clientes
    for cliente_data in clientes_data:
        cliente, created = Cliente.objects.get_or_create(
            correo=cliente_data['correo'],
            defaults=cliente_data
        )
        if created:
            print(f"  → Cliente creado: {cliente.nombre} ({cliente.correo}) - {cliente.idCategoria.nombre}")
    
    # Asignar usuarios a clientes (relación ManyToMany)
    try:
        cliente_maria = Cliente.objects.get(correo='cliente@globalexchange.com')
        cliente_ana = Cliente.objects.get(correo='ana.garcia@email.com')
        cliente_carlos = Cliente.objects.get(correo='carlos.lopez@email.com')
        cliente_sofia = Cliente.objects.get(correo='sofia.martinez@email.com')
        cliente_pedro = Cliente.objects.get(correo='pedro.gonzalez@email.com')
        cliente_laura = Cliente.objects.get(correo='laura.rodriguez@email.com')
        
        # Asignar usuarios a clientes
        usuario_cliente.clientes.add(cliente_maria)
        usuario_ana.clientes.add(cliente_ana)
        usuario_carlos.clientes.add(cliente_carlos)
        usuario_sofia.clientes.add(cliente_sofia)
        usuario_pedro.clientes.add(cliente_pedro)
        usuario_laura.clientes.add(cliente_laura)
        
        # El operador puede gestionar algunos clientes
        usuario_operador = User.objects.get(email='operador@globalexchange.com')
        usuario_operador.clientes.add(cliente_maria, cliente_ana, cliente_carlos)
        
        print("  → Relaciones usuario-cliente asignadas")
        
    except Exception as e:
        print(f"⚠️  Error asignando relaciones usuario-cliente: {e}")
    
    print(f"✅ Clientes: {Cliente.objects.count()} total")
