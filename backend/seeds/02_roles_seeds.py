from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def run():
    """Crear roles (Groups) base para el sistema"""
    
    print("🔧 Creando roles base usando Groups de Django...")
    
    # Obtener todos los permisos disponibles para el administrador
    all_permissions = list(Permission.objects.all().values_list('content_type__app_label', 'codename'))
    admin_permissions = [f"{app_label}.{codename}" for app_label, codename in all_permissions]
    
    print(f"  → Se encontraron {len(admin_permissions)} permisos en total para el administrador")
    
    # Roles básicos del sistema
    roles_data = [
        {
            'name': 'Administrador',
            'permissions': admin_permissions  # TODOS los permisos disponibles en el sistema
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
                'operaciones.view_metodofinanciero',
                
                # Cotizaciones
                'cotizaciones.view_tasa',
                'cotizaciones.view_historialtasa',
                'cotizaciones.change_tasa',  # Para actualizar precios
                
                # Divisas solo lectura
                'divisas.view_divisa',
                'divisas.view_denominacion',
                
                # Conversiones
                'conversiones.can_use_simulacion',
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
                'operaciones.view_metodofinanciero',
                
                # Cotizaciones
                'cotizaciones.view_tasa',
                'cotizaciones.view_historialtasa',
                
                # Divisas solo lectura
                'divisas.view_divisa',
                'divisas.view_denominacion',
                
                # Conversiones
                'conversiones.can_use_simulacion',
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
                'cotizaciones.view_tasa',
                'cotizaciones.view_historialtasa',
                'conversiones.can_use_simulacion',
            ]
        },
        {
            'name': 'Cliente Regular',
            'permissions': [
                # Permisos básicos para clientes
                'operaciones.view_metodofinancierodetalle',
                'conversiones.can_use_simulacion',
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
                'operaciones.view_metodofinanciero',
                'cotizaciones.view_tasa',
                'cotizaciones.view_historialtasa',
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
