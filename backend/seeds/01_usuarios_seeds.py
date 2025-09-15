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
    
    print(f"✅ Usuarios: {User.objects.count()} total")