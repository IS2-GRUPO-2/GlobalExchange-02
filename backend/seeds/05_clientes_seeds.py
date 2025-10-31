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
        usuario_admin = User.objects.get(email='ejfr09@hotmail.com')
        usuario_cliente = User.objects.get(email='joseramirezdure03@gmail.com')
        usuario_ana = User.objects.get(email='eliasjfigueredo@outlook.com')
        usuario_carlos = User.objects.get(email='gotojavier9@gmail.com')
        usuario_sofia = User.objects.get(email='IIN_Cesars@hotmail.com')
        usuario_pedro = User.objects.get(email='marceloriveros3435@gmail.com')
        usuario_laura = User.objects.get(email='marceloriveros13@hotmail.com')
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
            'correo': 'ejfr09@hotmail.com',
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
            'correo': 'joseramirezdure03@gmail.com',
            'telefono': '+549412132434567',
            'direccion': 'Av. Tulipanes 1234, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
            'ruc': None
        },
        {
            'nombre': 'Fernando David Fleitas Cáceres',
            'is_persona_fisica': True,
            'id_categoria': categoria_minorista,
            'cedula': '6052031',
            'correo': 'lilfleitas27@gmail.com',
            'telefono': '+54911234567',
            'direccion': 'Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires, Argentina',
            'is_active': True,
            'ruc': '6052031-0'
        },
        {
            'nombre': 'Javier Toshifumi Goto Dominguez',
            'is_persona_fisica': True,
            'id_categoria': categoria_premium,
            'cedula': '23456789',
            'correo': 'gotojavier9@gmail.com',
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
            'correo': 'eliasjfigueredo@outlook.com',
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
            'correo': 'eliasriverosvera@hotmail.com',
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
            'correo': 'marceloriveros3435@gmail.com',
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
            'correo': 'marceloriveros13@hotmail.com',
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
        cliente_admin = Cliente.objects.get(correo='ejfr09@hotmail.com')
        cliente_jose = Cliente.objects.get(correo='joseramirezdure03@gmail.com')
        cliente_fernando = Cliente.objects.get(correo='lilfleitas27@gmail.com')
        cliente_javier = Cliente.objects.get(correo='gotojavier9@gmail.com')
        cliente_elias_f = Cliente.objects.get(correo='eliasjfigueredo@outlook.com')
        cliente_elias_r = Cliente.objects.get(correo='eliasriverosvera@hotmail.com')
        cliente_pedro = Cliente.objects.get(correo='marceloriveros3435@gmail.com')
        cliente_laura = Cliente.objects.get(correo='marceloriveros13@hotmail.com')
        
        # Asignar usuarios a clientes
        usuario_admin.clientes.add(cliente_admin)
        usuario_cliente.clientes.add(cliente_jose)
        usuario_ana.clientes.add(cliente_fernando)
        usuario_carlos.clientes.add(cliente_javier)
        usuario_sofia.clientes.add(cliente_elias_f)
        usuario_pedro.clientes.add(cliente_pedro)
        usuario_laura.clientes.add(cliente_laura)
        
        # El operador puede gestionar algunos clientes
        usuario_operador = User.objects.get(email='elias4845@gmail.com')
        usuario_operador.clientes.add(cliente_jose, cliente_fernando, cliente_javier)

        # Asignar los mismos clientes del operador al usuario gerente
        try:
            usuario_gerente = User.objects.get(email='fernanfleitas@gmail.com')
            # Copiar exactamente los mismos clientes que tiene el operador
            usuario_gerente.clientes.add(*usuario_operador.clientes.all())
        except User.DoesNotExist:
            # Si el usuario gerente no existe, se omite silenciosamente
            pass
        
        print("  → Relaciones usuario-cliente asignadas")
        
    except Exception as e:
        print(f"⚠️  Error asignando relaciones usuario-cliente: {e}")
    
    print(f"✅ Clientes: {Cliente.objects.count()} total")
