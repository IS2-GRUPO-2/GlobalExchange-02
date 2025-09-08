from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def run():
    """Crear roles (Groups) base para el sistema"""
    
    print("🔧 Creando roles base usando Groups de Django...")
    
    # Roles básicos del sistema
    roles_data = [
        {
            'name': 'Administrador',
            'permissions': [
                # Permisos de usuarios
                'usuarios.add_user',
                'usuarios.change_user',
                'usuarios.delete_user',
                'usuarios.view_user',
                'usuarios.can_assign_clients',
                'usuarios.can_assign_roles',
                
                # Permisos de clientes
                'clientes.add_cliente',
                'clientes.change_cliente',
                'clientes.delete_cliente',
                'clientes.view_cliente',
                'clientes.add_categoriacliente',
                'clientes.change_categoriacliente',
                'clientes.delete_categoriacliente',
                'clientes.view_categoriacliente',
                
                # Permisos de divisas
                'divisas.add_divisa',
                'divisas.change_divisa',
                'divisas.delete_divisa',
                'divisas.view_divisa',
                'divisas.add_denominacion',
                'divisas.change_denominacion',
                'divisas.delete_denominacion',
                'divisas.view_denominacion',
                
                # Permisos de operaciones
                'operaciones.add_banco',
                'operaciones.change_banco',
                'operaciones.delete_banco',
                'operaciones.view_banco',
                'operaciones.add_billeteradigitalcatalogo',
                'operaciones.change_billeteradigitalcatalogo',
                'operaciones.delete_billeteradigitalcatalogo',
                'operaciones.view_billeteradigitalcatalogo',
                'operaciones.add_metodofinancierodetalle',
                'operaciones.change_metodofinancierodetalle',
                'operaciones.delete_metodofinancierodetalle',
                'operaciones.view_metodofinancierodetalle',
                
                # Permisos de grupos y permisos
                'auth.add_group',
                'auth.change_group',
                'auth.delete_group',
                'auth.view_group',
                'auth.add_permission',
                'auth.change_permission',
                'auth.delete_permission',
                'auth.view_permission',
            ]
        },
        {
            'name': 'Operador',
            'permissions': [
                # Ver usuarios y clientes
                'usuarios.view_user',
                'clientes.view_cliente',
                'clientes.add_cliente',
                'clientes.change_cliente',
                
                # Operaciones completas
                'operaciones.add_metodofinancierodetalle',
                'operaciones.change_metodofinancierodetalle',
                'operaciones.view_metodofinancierodetalle',
                'operaciones.view_banco',
                'operaciones.view_billeteradigitalcatalogo',
                
                # Divisas solo lectura
                'divisas.view_divisa',
                'divisas.view_denominacion',
            ]
        },
        {
            'name': 'Supervisor',
            'permissions': [
                # Usuarios y clientes
                'usuarios.view_user',
                'usuarios.can_assign_clients',
                'clientes.view_cliente',
                'clientes.add_cliente',
                'clientes.change_cliente',
                'clientes.view_categoriacliente',
                
                # Operaciones y reportes
                'operaciones.view_metodofinancierodetalle',
                'operaciones.change_metodofinancierodetalle',
                'operaciones.view_banco',
                'operaciones.view_billeteradigitalcatalogo',
                
                # Divisas solo lectura
                'divisas.view_divisa',
                'divisas.view_denominacion',
            ]
        },
        {
            'name': 'Cliente Premium',
            'permissions': [
                # Solo ver sus propios datos
                'clientes.view_cliente',
                'operaciones.view_metodofinancierodetalle',
                'operaciones.add_metodofinancierodetalle',
                'divisas.view_divisa',
            ]
        },
        {
            'name': 'Cliente Regular',
            'permissions': [
                # Permisos básicos para clientes
                'clientes.view_cliente',
                'operaciones.view_metodofinancierodetalle',
                'divisas.view_divisa',
            ]
        },
        {
            'name': 'Auditor',
            'permissions': [
                # Solo lectura para auditorías
                'usuarios.view_user',
                'clientes.view_cliente',
                'clientes.view_categoriacliente',
                'operaciones.view_metodofinancierodetalle',
                'operaciones.view_banco',
                'operaciones.view_billeteradigitalcatalogo',
                'divisas.view_divisa',
                'divisas.view_denominacion',
            ]
        }
    ]
    
    for rol_data in roles_data:
        # Crear o obtener el Group (Rol)
        group, created = Group.objects.get_or_create(name=rol_data['name'])
        
        if created:
            print(f"  → Rol creado: {group.name}")
        else:
            print(f"  → Rol ya existe: {group.name}")
        
        # Asignar permisos al rol
        permissions_to_add = []
        for perm_codename in rol_data['permissions']:
            try:
                app_label, codename = perm_codename.split('.')
                permission = Permission.objects.get(
                    content_type__app_label=app_label,
                    codename=codename
                )
                permissions_to_add.append(permission)
            except Permission.DoesNotExist:
                print(f"    ⚠️  Permiso no encontrado: {perm_codename}")
            except ValueError:
                print(f"    ⚠️  Formato de permiso inválido: {perm_codename}")
        
        # Asignar todos los permisos encontrados
        group.permissions.set(permissions_to_add)
        print(f"    → {len(permissions_to_add)} permisos asignados a {group.name}")
    
    print(f"✅ Roles (Groups): {Group.objects.count()} total")
    print(f"✅ Permisos disponibles: {Permission.objects.count()} total")
