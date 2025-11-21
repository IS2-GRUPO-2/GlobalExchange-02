"""
Seeds para crear transacciones completadas con ganancias para el dashboard de reportes.

Genera transacciones variadas en los últimos 6 meses con diferentes:
- Divisas (USD, EUR, BRL, ARS)
- Tipos de operación (compra/venta)
- Métodos financieros (efectivo, transferencia, tarjeta)
- Montos y tasas realistas
"""

from apps.metodos_financieros.models import MetodoFinanciero, MetodoFinancieroDetalle, TipoMetodoFinanciero
from apps.tauser.models import Tauser
from apps.usuarios.models import User
from apps.divisas.models import Divisa
from apps.clientes.models import Cliente
from apps.ganancias.models import Ganancia
from apps.operaciones.models import Transaccion
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random
from django.db import models

# Configurar Django
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.insert(0, project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'globalexchange.settings')
django.setup()


def run():
    """Crear transacciones completadas con ganancias para testing"""

    print("🔧 Creando transacciones y ganancias de prueba...")

    # Obtener datos necesarios
    try:
        admin_user = User.objects.get(email='ejfr09@hotmail.com')
        operador_user = User.objects.get(email='elias4845@gmail.com')
    except User.DoesNotExist:
        print("❌ Error: Usuarios no encontrados. Ejecutar primero 01_usuarios_seeds.py")
        return

    # Obtener divisas
    try:
        pyg = Divisa.objects.get(codigo='PYG')
        usd = Divisa.objects.get(codigo='USD')
        eur = Divisa.objects.get(codigo='EUR')
        brl = Divisa.objects.get(codigo='BRL')
        ars = Divisa.objects.get(codigo='ARS')
        divisas = [usd, eur, brl, ars]
    except Divisa.DoesNotExist:
        print("❌ Error: Divisas no encontradas. Ejecutar primero 03_divisas_seeds.py")
        return

    # Obtener clientes
    clientes = list(Cliente.objects.all())
    if not clientes:
        print("❌ Error: No hay clientes. Ejecutar primero 05_clientes_seeds.py")
        return

    # Obtener métodos financieros
    try:
        metodo_efectivo = MetodoFinanciero.objects.get(
            nombre=TipoMetodoFinanciero.EFECTIVO)
        metodo_transferencia = MetodoFinanciero.objects.get(
            nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA)
        metodo_tarjeta = MetodoFinanciero.objects.get(
            nombre=TipoMetodoFinanciero.TARJETA)
        metodos = [metodo_efectivo, metodo_transferencia, metodo_tarjeta]
    except MetodoFinanciero.DoesNotExist:
        print("❌ Error: Métodos financieros no encontrados. Ejecutar primero 06_financiero_seeds.py")
        return

    # Obtener tausers
    tausers = list(Tauser.objects.all())
    if not tausers:
        print("❌ Error: No hay tausers. Ejecutar primero 08_tausers_seeds.py")
        return

    # Configuración de tasas base realistas
    tasas_base = {
        'USD': Decimal('7250.00'),  # 1 USD = 7250 PYG
        'EUR': Decimal('8100.00'),  # 1 EUR = 8100 PYG
        'BRL': Decimal('1450.00'),  # 1 BRL = 1450 PYG
        'ARS': Decimal('7.50'),     # 1 ARS = 7.5 PYG
    }

    # Spreads (diferencia entre compra y venta, en %)
    spreads = {
        TipoMetodoFinanciero.EFECTIVO: Decimal('0.03'),                  # 3%
        TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA: Decimal('0.02'),    # 2%
        TipoMetodoFinanciero.TARJETA: Decimal('0.04'),                   # 4%
    }

    # Generar transacciones para los últimos 6 meses
    fecha_fin = datetime.now()
    fecha_inicio = fecha_fin - timedelta(days=180)

    transacciones_creadas = 0
    ganancias_creadas = 0

    # Generar entre 50-100 transacciones
    num_transacciones = random.randint(60, 100)

    for i in range(num_transacciones):
        # Fecha aleatoria en los últimos 6 meses
        dias_atras = random.randint(0, 180)
        fecha_transaccion = fecha_fin - timedelta(days=dias_atras)

        # Seleccionar datos aleatorios
        divisa = random.choice(divisas)
        cliente = random.choice(clientes)
        operacion = random.choice(['compra', 'venta'])
        metodo = random.choice(metodos)
        user = random.choice([admin_user, operador_user])
        tauser = random.choice(tausers)

        # No usar detalles financieros específicos (nullable en modelo)
        detalle = None

        # Calcular tasa base del mercado con pequeña variación
        tasa_base = tasas_base[divisa.codigo]
        variacion = Decimal(str(random.uniform(-0.02, 0.02)))  # +/- 2%
        precio_base = tasa_base * (1 + variacion)

        # Calcular spread según método
        spread = spreads[metodo.nombre]

        # Calcular tasa aplicada según operación
        if operacion == 'compra':
            # Casa compra divisa al cliente: paga menos (tasa_aplicada < precio_base)
            tasa_aplicada = precio_base * (1 - spread)
            tasa_inicial = precio_base
        else:  # venta
            # Casa vende divisa al cliente: cobra más (tasa_aplicada > precio_base)
            tasa_aplicada = precio_base * (1 + spread)
            tasa_inicial = precio_base

        # Generar monto aleatorio según divisa
        if divisa.codigo == 'USD':
            monto_divisa = Decimal(str(random.randint(100, 5000)))
        elif divisa.codigo == 'EUR':
            monto_divisa = Decimal(str(random.randint(100, 3000)))
        elif divisa.codigo == 'BRL':
            monto_divisa = Decimal(str(random.randint(500, 10000)))
        else:  # ARS
            monto_divisa = Decimal(str(random.randint(10000, 100000)))

        # Calcular montos
        monto_pyg = monto_divisa * tasa_aplicada

        # Determinar origen y destino según operación
        if operacion == 'compra':
            divisa_origen = divisa
            divisa_destino = pyg
            monto_origen = monto_divisa
            monto_destino = monto_pyg
        else:  # venta
            divisa_origen = pyg
            divisa_destino = divisa
            monto_origen = monto_pyg
            monto_destino = monto_divisa

        # Crear transacción completada
        try:
            transaccion = Transaccion.objects.create(
                id_user=user,
                cliente=cliente,
                operacion=operacion,
                tasa_aplicada=tasa_aplicada,
                tasa_inicial=tasa_inicial,
                precio_base=precio_base,
                divisa_origen=divisa_origen,
                divisa_destino=divisa_destino,
                monto_origen=monto_origen,
                monto_destino=monto_destino,
                metodo_financiero=metodo,
                metodo_financiero_detalle=detalle,
                fecha_inicio=fecha_transaccion,
                fecha_fin=fecha_transaccion +
                timedelta(minutes=random.randint(5, 60)),
                factura_emitida=True,
                tauser=tauser,
                estado='completada',
            )
            transacciones_creadas += 1

            # Calcular ganancia
            if operacion == 'compra':
                # Casa compra divisa: ganancia = diferencia entre precio_base y tasa_aplicada
                ganancia_por_unidad = precio_base - tasa_aplicada
            else:  # venta
                # Casa vende divisa: ganancia = diferencia entre tasa_aplicada y precio_base
                ganancia_por_unidad = tasa_aplicada - precio_base

            ganancia_neta = ganancia_por_unidad * monto_divisa

            # Crear registro de ganancia
            Ganancia.objects.create(
                transaccion=transaccion,
                ganancia_neta=ganancia_neta,
                divisa_extranjera=divisa,
                fecha=fecha_transaccion.date(),
                anio=fecha_transaccion.year,
                mes=fecha_transaccion.month,
                operacion=operacion,
                metodo_financiero=metodo,
                tasa_mercado=precio_base,
                tasa_aplicada=tasa_aplicada,
                monto_divisa=monto_divisa,
            )
            ganancias_creadas += 1

        except Exception as e:
            print(f"❌ Error creando transacción {i+1}: {e}")
            continue

    print(f"✔ Creadas {transacciones_creadas} transacciones completadas")
    print(f"✔ Generadas {ganancias_creadas} ganancias")

    # Estadísticas
    total_ganancia = Ganancia.objects.aggregate(
        total=models.Sum('ganancia_neta')
    )['total'] or Decimal('0')

    print(f"\n📊 Estadísticas:")
    print(f"  → Ganancia total: {total_ganancia:,.0f} PYG")
    print(
        f"  → Ganancia promedio: {(total_ganancia / ganancias_creadas):,.0f} PYG" if ganancias_creadas > 0 else "")

    # Por divisa
    print(f"\n📈 Por divisa:")
    for divisa in divisas:
        count = Ganancia.objects.filter(divisa_extranjera=divisa).count()
        ganancia_divisa = Ganancia.objects.filter(
            divisa_extranjera=divisa
        ).aggregate(total=models.Sum('ganancia_neta'))['total'] or Decimal('0')
        print(f"  → {divisa.codigo}: {count} ops, {ganancia_divisa:,.0f} PYG")

    # Por operación
    print(f"\n💼 Por operación:")
    for op in ['compra', 'venta']:
        count = Ganancia.objects.filter(operacion=op).count()
        ganancia_op = Ganancia.objects.filter(
            operacion=op
        ).aggregate(total=models.Sum('ganancia_neta'))['total'] or Decimal('0')
        print(f"  → {op.title()}: {count} ops, {ganancia_op:,.0f} PYG")


if __name__ == '__main__':
    run()
