import os
import sys
import django

# Crear el directorio raíz al PYTHONPATH
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.insert(0, project_root)

def run():
    """Cargar todas las seeds en orden"""
    
    seeds_order = [
        '02_roles_seeds',
        '01_usuarios_seeds',
        '03_divisas_seeds',
        '04_categorias_clientes_seeds',
        '05_clientes_seeds',
        '06_operaciones_seeds',
        '07_cotizaciones_seeds'
    ]
    
    print("🌱 Iniciando carga de seeds...")
    
    for seed in seeds_order:
        try:
            print(f"\n📦 Ejecutando {seed}...")
            module = __import__(f'seeds.{seed}', fromlist=['run'])
            module.run()
        except Exception as e:
            print(f"❌ Error en {seed}: {e}")
            continue
    
    print("\n🎉 Seeds cargadas completamente!")

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'globalexchange.settings')
    django.setup()
    run()
