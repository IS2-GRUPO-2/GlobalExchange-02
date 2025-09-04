from django.db import migrations
import uuid
def crear_categorias(apps, schema_editor):
    CategoriaCliente = apps.get_model("clientes", "CategoriaCliente")

    categorias = [
        {"nombre": "MINORISTA", "descuento": 0.00},
        {"nombre": "MAYORISTA", "descuento": 5.00},
        {"nombre": "VIP", "descuento": 10.00},
    ]

    for cat in categorias:
        CategoriaCliente.objects.update_or_create(
            nombre=cat["nombre"], defaults={"descuento": cat["descuento"]}
        )


def eliminar_categorias(apps, schema_editor):
    CategoriaCliente = apps.get_model("clientes", "CategoriaCliente")
    CategoriaCliente.objects.filter(nombre__in=["MINORISTA", "MAYORISTA", "VIP"]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("clientes", "0002_categoriacliente_alter_cliente_categoria"),  
    ]

    operations = [
        migrations.RunPython(crear_categorias, eliminar_categorias),
    ]
