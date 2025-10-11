from apps.stock.models import TipoMovimiento, EstadoMovimiento

def run():

    tipos_data = [
        {
            "codigo": "ENTCLT",
            "descripcion": "Depósito de cliente al tauser"
        },
        {
            "codigo": "ENTCS",
            "descripcion": "Depósito de la casa al tauser"
        },
        {
            "codigo": "SALCLT",
            "descripcion": "Salida de stock por pago a cliente"
        },
        {
            "codigo": "SALCS",
            "descripcion": "Salida de stock para bóvedas de la casa"
        }
    ]

    estados_data = [
        {
            "estado": "EN_PROCESO"
        },
        {
            "estado": "FINALIZADO"
        },
        {
            "estado": "CANCELADO"
        }
    ]

    print ("🔧 Creando tipos de movimientos de stock...")
    for tipo in tipos_data:
        TipoMovimiento.objects.get_or_create(codigo=tipo["codigo"], descripcion=tipo["descripcion"])

    print(f"✅ Tipos de movimiento de stock creados")   

    print ("🔧 Creando estados de movimientos de stock...")
    for estado in estados_data:
        EstadoMovimiento.objects.get_or_create(estado=estado["estado"])

    print(f"✅ Tipos de movimiento de stock creados")  