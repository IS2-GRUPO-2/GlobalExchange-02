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
        usuario_admin = User.objects.get(email='admin@globalexchange.com')
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
            'nombre': 'Super Admin',
            'is_persona_fisica': True,
            'id_categoria': categoria_premium,
            'cedula': '11111111',
            'correo': 'admin@globalexchange.com',
            'telefono': '+595981000000',
            'direccion': 'Av. España 1000, Asunción, Paraguay',
            'is_active': True,
            'ruc': None
        },
        {
            'nombre': 'Jose Gabriel Ramirez Dure',
            'is_persona_fisica': True,
            'id_categoria': categoria_minorista,
            'cedula': '12324578',
            'correo': 'joseramirezdure03@fpuna.edu.py',
            'telefono': '+549412132434567',
            'direccion': 'Av. Tulipanes 1234, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
            'ruc': None
        },
        {
            'nombre': 'Fernando David Fleitas Cáceres',
            'is_persona_fisica': True,
            'id_categoria': categoria_minorista,
            'cedula': '12345678',
            'correo': 'fernanfleitas@fpuna.edu.py',
            'telefono': '+54911234567',
            'direccion': 'Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
            'ruc': None
        },
        {
            'nombre': 'Javier Toshifumi Goto Dominguez',
            'is_persona_fisica': True,
            'id_categoria': categoria_premium,
            'cedula': '23456789',
            'correo': 'gotojavier9@fpuna.edu.py',
            'telefono': '+54911234568',
            'direccion': 'Av. Santa Fe 5678, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
            'ruc': None
        },
        {
            'nombre': 'Elias Jesus Figueredo Rosa',
            'is_persona_fisica': True,
            'id_categoria': categoria_vip,
            'cedula': '34567890',
            'correo': 'ejfr09@fpuna.edu.py',
            'telefono': '+54911234569',
            'direccion': 'Av. Rivadavia 9012, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
            'ruc': None
        },
        {
            'nombre': 'Elias Marcelo Riveros Vera',
            'is_persona_fisica': True,
            'id_categoria': categoria_mayorista,
            'cedula': '45678901',
            'correo': 'elias4845@fpuna.edu.py',
            'telefono': '+54911234570',
            'direccion': 'Av. Callao 3456, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
            'ruc': None
        },
        {
            'nombre': 'Pedro González & Asociados S.A.',
            'is_persona_fisica': False,
            'id_categoria': categoria_corporativo,
            'cedula': None,
            'correo': 'pedro.gonzalez@email.com',
            'telefono': '+54911234571',
            'direccion': 'Av. Pueyrredón 7890, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
            'ruc': '20-12345678-9'
        },
        {
            'nombre': 'Laura Rodríguez Importaciones SRL',
            'is_persona_fisica': False,
            'id_categoria': categoria_mayorista,
            'cedula': None,
            'correo': 'laura.rodriguez@email.com',
            'telefono': '+54911234572',
            'direccion': 'Av. Las Heras 2345, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
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
            print(f"  → Cliente creado: {cliente.nombre} ({cliente.correo}) - {cliente.id_categoria.nombre}")
    
    # Asignar usuarios a clientes (relación ManyToMany)
    try:
        cliente_admin = Cliente.objects.get(correo='admin@globalexchange.com')
        cliente_jose = Cliente.objects.get(correo='joseramirezdure03@fpuna.edu.py')
        cliente_fernando = Cliente.objects.get(correo='fernanfleitas@fpuna.edu.py')
        cliente_javier = Cliente.objects.get(correo='gotojavier9@fpuna.edu.py')
        cliente_elias_f = Cliente.objects.get(correo='ejfr09@fpuna.edu.py')
        cliente_elias_r = Cliente.objects.get(correo='elias4845@fpuna.edu.py')
        cliente_pedro = Cliente.objects.get(correo='pedro.gonzalez@email.com')
        cliente_laura = Cliente.objects.get(correo='laura.rodriguez@email.com')
        
        # Asignar usuarios a clientes
        usuario_admin.clientes.add(cliente_admin)
        usuario_cliente.clientes.add(cliente_jose)
        usuario_ana.clientes.add(cliente_fernando)
        usuario_carlos.clientes.add(cliente_javier)
        usuario_sofia.clientes.add(cliente_elias_f)
        usuario_pedro.clientes.add(cliente_pedro)
        usuario_laura.clientes.add(cliente_laura)
        
        # El operador puede gestionar algunos clientes
        usuario_operador = User.objects.get(email='operador@globalexchange.com')
        usuario_operador.clientes.add(cliente_jose, cliente_fernando, cliente_javier)

        # Asignar los mismos clientes del operador al usuario gerente
        try:
            usuario_gerente = User.objects.get(email='gerente@globalexchange.com')
            # Copiar exactamente los mismos clientes que tiene el operador
            usuario_gerente.clientes.add(*usuario_operador.clientes.all())
        except User.DoesNotExist:
            # Si el usuario gerente no existe, se omite silenciosamente
            pass
        
        print("  → Relaciones usuario-cliente asignadas")
        
    except Exception as e:
        print(f"⚠️  Error asignando relaciones usuario-cliente: {e}")
    
    print(f"✅ Clientes: {Cliente.objects.count()} total")
