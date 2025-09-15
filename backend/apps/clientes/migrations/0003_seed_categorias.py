from django.db import migrations

# Esta migración anteriormente insertaba datos de categorías directamente.
# Los datos han sido movidos a seeds para mejor separación de responsabilidades.

class Migration(migrations.Migration):

    dependencies = [
        ("clientes", "0002_categoriacliente_alter_cliente_categoria"),  
    ]

    operations = [
        # Migración vacía - los datos de categorías ahora se manejan via seeds
    ]
