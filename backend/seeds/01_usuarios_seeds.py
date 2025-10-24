from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Group
from apps.usuarios.models import User

def run():
    """Crear usuarios base para desarrollo"""
    
    print("🔧 Creando usuarios base...")
    
    # Usuario super administrador
    admin, created = User.objects.get_or_create(
        email='admin@globalexchange.com',
        defaults={
            'username': 'admin',
            'first_name': 'Super',
            'last_name': 'Admin',
            'is_staff': False,  # Cambiado a False
            'is_superuser': False,  # Cambiado a False
            'is_active': True,
            'email_verified': True,
            'password': make_password('admin123'),
        }
    )
    if created:
        # Asignar grupo 'Administrador'
        admin_group = Group.objects.get(name='Administrador')
        admin.groups.add(admin_group)

        print("✔ Usuario 'admin' creado con grupo 'Administrador'.")
    
    # Usuario administrador
    operador, created = User.objects.get_or_create(
        email='operador@globalexchange.com',
        defaults={
            'username': 'operador',
            'first_name': 'Juan',
            'last_name': 'Operador',
            'is_staff': True,
            'is_superuser': False,
            'is_active': True,
            'email_verified': True,
            'password': make_password('operador123'),
        }
    )
    if created:
        print(f"  → Usuario creado: {operador.email}")
    
    # Usuario cliente
    cliente, created = User.objects.get_or_create(
        email='cliente@globalexchange.com',
        defaults={
            'username': 'cliente',
            'first_name': 'María',
            'last_name': 'Cliente',
            'is_staff': False,
            'is_superuser': False,
            'is_active': True,
            'email_verified': True,
            'password': make_password('cliente123'),
        }
    )
    if created:
        print(f"  → Usuario creado: {cliente.email}")
    
    # Usuario gerente
    gerente, created = User.objects.get_or_create(
        email='gerente@globalexchange.com',
        defaults={
            'username': 'gerente',
            'first_name': 'Gerente',
            'last_name': 'General',
            'is_staff': True,
            'is_superuser': False,
            'is_active': True,
            'email_verified': True,
            'password': make_password('gerente123'),
        }
    )
    if created:
        print(f"  �+' Usuario creado: {gerente.email}")
    
    # Usuarios adicionales para pruebas
    usuarios_prueba = [
        {
            'email': 'ana.garcia@email.com',
            'username': 'ana.garcia',
            'first_name': 'Ana',
            'last_name': 'García',
            'password': make_password('password123')
        },
        {
            'email': 'carlos.lopez@email.com',
            'username': 'carlos.lopez',
            'first_name': 'Carlos',
            'last_name': 'López',
            'password': make_password('password123')
        },
        {
            'email': 'sofia.martinez@email.com',
            'username': 'sofia.martinez',
            'first_name': 'Sofía',
            'last_name': 'Martínez',
            'password': make_password('password123')
        },
        {
            'email': 'pedro.gonzalez@email.com',
            'username': 'pedro.gonzalez',
            'first_name': 'Pedro',
            'last_name': 'González',
            'password': make_password('password123')
        },
        {
            'email': 'laura.rodriguez@email.com',
            'username': 'laura.rodriguez',
            'first_name': 'Laura',
            'last_name': 'Rodríguez',
            'password': make_password('password123')
        }
    ]
    
    for usuario_data in usuarios_prueba:
        usuario, created = User.objects.get_or_create(
            email=usuario_data['email'],
            defaults={
                **usuario_data,
                'is_staff': False,
                'is_superuser': False,
                'is_active': True,
                'email_verified': True,
            }
        )
        if created:
            print(f"  → Usuario creado: {usuario.email}")
    
    # Asignar roles a usuarios principales
    try:
        print("\n🔧 Asignando roles a usuarios...")
        
        # Obtener roles
        admin_role = Group.objects.get(name='Administrador')
        operador_role = Group.objects.get(name='Operador')
        gerente_role = Group.objects.get(name='Gerente')
        cliente_regular_role = Group.objects.get(name='Cliente Regular')
        cliente_premium_role = Group.objects.get(name='Cliente Premium')
        
        # Asignar roles
        admin.groups.add(admin_role)
        operador.groups.add(operador_role)
        gerente.groups.add(gerente_role)
        cliente.groups.add(cliente_regular_role)
        
        # Asignar roles a usuarios de prueba
        if User.objects.filter(email='ana.garcia@email.com').exists():
            usuario_ana = User.objects.get(email='ana.garcia@email.com')
            usuario_ana.groups.add(cliente_premium_role)
        if User.objects.filter(email='carlos.lopez@email.com').exists():
            usuario_carlos = User.objects.get(email='carlos.lopez@email.com')
            usuario_carlos.groups.add(cliente_premium_role)
        if User.objects.filter(email='sofia.martinez@email.com').exists():
            usuario_sofia = User.objects.get(email='sofia.martinez@email.com')
            usuario_sofia.groups.add(cliente_regular_role)
        if User.objects.filter(email='pedro.gonzalez@email.com').exists():
            usuario_pedro = User.objects.get(email='pedro.gonzalez@email.com')
            usuario_pedro.groups.add(cliente_regular_role)
        if User.objects.filter(email='laura.rodriguez@email.com').exists():
            usuario_laura = User.objects.get(email='laura.rodriguez@email.com')
            usuario_laura.groups.add(cliente_regular_role)
        
        print("  → Roles asignados correctamente")
        
    except Group.DoesNotExist:
        print("  ⚠️  Algunos roles no existen. Ejecutar primero 02_roles_seeds")
    except Exception as e:
        print(f"  ⚠️  Error asignando roles: {e}")
    
    print(f"✅ Usuarios: {User.objects.count()} total")
