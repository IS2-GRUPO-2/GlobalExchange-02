from apps.metodos_financieros.models import (
    Banco, BilleteraDigitalCatalogo, TarjetaCatalogo, MetodoFinanciero, 
    MetodoFinancieroDetalle, CuentaBancaria, BilleteraDigital, Tarjeta,
    TipoMetodoFinanciero
)
from apps.clientes.models import Cliente

def run():
    """Crear métodos financieros base para el sistema"""
    
    print("🔧 Creando métodos financieros...")
    
    # Crear bancos principales de Argentina y región
    bancos_data = [
        {
            'nombre': 'Banco de la Nación Argentina',
            'cvu': '0110000000000000000000',
            'comision_compra': 1.5,
            'comision_venta': 1.2,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Banco Galicia',
            'cvu': '0070000000000000000000',
            'comision_compra': 1.8,
            'comision_venta': 1.5,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False,
            'is_active': True
        },
        {
            'nombre': 'Banco Santander Argentina',
            'cvu': '0072000000000000000000',
            'comision_compra': 2.0,
            'comision_venta': 1.7,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Banco BBVA Argentina',
            'cvu': '0017000000000000000000',
            'comision_compra': 1.9,
            'comision_venta': 1.6,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Banco Macro',
            'cvu': '0285000000000000000000',
            'comision_compra': 1.4,
            'comision_venta': 1.1,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': False,
            'is_active': True
        },
        {
            'nombre': 'Banco Ciudad de Buenos Aires',
            'cvu': '0043000000000000000000',
            'comision_compra': 1.6,
            'comision_venta': 1.3,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False,
            'is_active': True
        },
        {
            'nombre': 'Banco Industrial (BIND)',
            'cvu': '0300000000000000000000',
            'comision_compra': 2.1,
            'comision_venta': 1.8,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Banco Provincia de Buenos Aires',
            'cvu': '0014000000000000000000',
            'comision_compra': 1.3,
            'comision_venta': 1.0,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True,
            'is_active': True
        }
    ]
    
    for banco_data in bancos_data:
        banco, created = Banco.objects.get_or_create(
            nombre=banco_data['nombre'],
            defaults=banco_data
        )
        if created:
            print(f"  → Banco creado: {banco.nombre}")
    
    # Crear billeteras digitales
    billeteras_data = [
        {
            'nombre': 'Mercado Pago',
            'comision_compra': 2.8,
            'comision_venta': 2.5,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Ualá',
            'comision_compra': 2.0,
            'comision_venta': 1.8,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Brubank',
            'comision_compra': 1.9,
            'comision_venta': 1.7,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False,
            'is_active': True
        },
        {
            'nombre': 'Naranja X',
            'comision_compra': 2.5,
            'comision_venta': 2.2,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Personal Pay',
            'comision_compra': 2.3,
            'comision_venta': 2.0,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': False,
            'is_active': True
        },
        {
            'nombre': 'PayPal',
            'comision_compra': 4.2,
            'comision_venta': 3.8,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Binance Pay',
            'comision_compra': 1.0,
            'comision_venta': 0.8,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'nombre': 'Tigo Money',
            'comision_compra': 3.0,
            'comision_venta': 2.7,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False,
            'is_active': True
        },
        {
            'nombre': 'Cuenta DNI',
            'comision_compra': 0.5,
            'comision_venta': 0.3,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': False,
            'is_active': True
        }
    ]
    
    for billetera_data in billeteras_data:
        billetera, created = BilleteraDigitalCatalogo.objects.get_or_create(
            nombre=billetera_data['nombre'],
            defaults=billetera_data
        )
        if created:
            print(f"  → Billetera creada: {billetera.nombre}")

    # Crear marcas de tarjetas del catálogo
    tarjetas_catalogo_data = [
        {
            'marca': 'Visa',
            'comision_compra': 3.2,
            'comision_venta': 2.8,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'marca': 'Mastercard',
            'comision_compra': 3.1,
            'comision_venta': 2.7,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False,
            'is_active': True
        },
        {
            'marca': 'American Express',
            'comision_compra': 4.5,
            'comision_venta': 4.0,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'marca': 'Cabal',
            'comision_compra': 2.8,
            'comision_venta': 2.5,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': True,
            'is_active': True
        },
        {
            'marca': 'Naranja',
            'comision_compra': 3.5,
            'comision_venta': 3.2,
            'comision_personalizada_compra': False,
            'comision_personalizada_venta': False,
            'is_active': True
        },
        {
            'marca': 'Nativa',
            'comision_compra': 2.9,
            'comision_venta': 2.6,
            'comision_personalizada_compra': True,
            'comision_personalizada_venta': False,
            'is_active': True
        }
    ]
    
    for tarjeta_data in tarjetas_catalogo_data:
        tarjeta, created = TarjetaCatalogo.objects.get_or_create(
            marca=tarjeta_data['marca'],
            defaults=tarjeta_data
        )
        if created:
            print(f"  → Marca de tarjeta creada: {tarjeta.marca}")
    
    # Crear métodos financieros base
    metodos_financieros_data = [
        {
            'nombre': TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA,
            'permite_cobro': True,
            'permite_pago': True,
            'comision_cobro_porcentaje': 1.5,
            'comision_pago_porcentaje': 1.0,
            'is_active': True
        },
        {
            'nombre': TipoMetodoFinanciero.BILLETERA_DIGITAL,
            'permite_cobro': True,
            'permite_pago': True,
            'comision_cobro_porcentaje': 2.0,
            'comision_pago_porcentaje': 1.5,
            'is_active': True
        },
        {
            'nombre': TipoMetodoFinanciero.TARJETA,
            'permite_cobro': True,
            'permite_pago': False,
            'comision_cobro_porcentaje': 3.5,
            'comision_pago_porcentaje': 0.0,
            'is_active': True
        },
        {
            'nombre': TipoMetodoFinanciero.EFECTIVO,
            'permite_cobro': True,
            'permite_pago': True,
            'comision_cobro_porcentaje': 0.0,
            'comision_pago_porcentaje': 0.0,
            'is_active': True
        },
        {
            'nombre': TipoMetodoFinanciero.CHEQUE,
            'permite_cobro': True,
            'permite_pago': False,
            'comision_cobro_porcentaje': 2.5,
            'comision_pago_porcentaje': 0.0,
            'is_active': True
        }
    ]
    
    for metodo_data in metodos_financieros_data:
        metodo, created = MetodoFinanciero.objects.get_or_create(
            nombre=metodo_data['nombre'],
            defaults=metodo_data
        )
        if created:
            print(f"  → Método financiero creado: {metodo.get_nombre_display()}")
    
    # Crear algunos métodos financieros detallados para clientes
    try:
        # Obtener objetos necesarios
        clientes = Cliente.objects.all()[:5]  # Primeros 5 clientes
        banco_galicia = Banco.objects.get(nombre='Banco Galicia')
        banco_nacion = Banco.objects.get(nombre='Banco de la Nación Argentina')
        mp = BilleteraDigitalCatalogo.objects.get(nombre='Mercado Pago')
        uala = BilleteraDigitalCatalogo.objects.get(nombre='Ualá')
        
        # Marcas de tarjetas del catálogo
        visa = TarjetaCatalogo.objects.get(marca='Visa')
        mastercard = TarjetaCatalogo.objects.get(marca='Mastercard')
        cabal = TarjetaCatalogo.objects.get(marca='Cabal')
        
        metodo_transferencia = MetodoFinanciero.objects.get(nombre=TipoMetodoFinanciero.TRANSFERENCIA_BANCARIA)
        metodo_billetera = MetodoFinanciero.objects.get(nombre=TipoMetodoFinanciero.BILLETERA_DIGITAL)
        metodo_tarjeta = MetodoFinanciero.objects.get(nombre=TipoMetodoFinanciero.TARJETA)
        
        if len(clientes) >= 5:
            # Cliente 1: Cuenta en Galicia
            detalle1, created = MetodoFinancieroDetalle.objects.get_or_create(
                cliente=clientes[0],
                alias='Mi Cuenta Galicia ARS',
                defaults={
                    'metodo_financiero': metodo_transferencia,
                    'is_active': True
                }
            )
            if created:
                CuentaBancaria.objects.create(
                    metodo_financiero_detalle=detalle1,
                    banco=banco_galicia,
                    numero_cuenta='123456789012345',
                    titular=clientes[0].nombre,
                    cbu_cvu='0070123456789012345678'
                )
                print(f"  → Cuenta bancaria creada para {clientes[0].nombre}")
            
            # Cliente 1: Mercado Pago
            detalle2, created = MetodoFinancieroDetalle.objects.get_or_create(
                cliente=clientes[0],
                alias='Mi Mercado Pago',
                defaults={
                    'metodo_financiero': metodo_billetera,
                    'is_active': True
                }
            )
            if created:
                BilleteraDigital.objects.create(
                    metodo_financiero_detalle=detalle2,
                    plataforma=mp,
                    usuario_id=clientes[0].correo,
                    email=clientes[0].correo,
                    telefono=clientes[0].telefono,
                    alias_billetera='CLIENTE.MP.ARS'
                )
                print(f"  → Billetera digital creada para {clientes[0].nombre}")
            
            # Cliente 1: Tarjeta Visa Local
            detalle_tarjeta1, created = MetodoFinancieroDetalle.objects.get_or_create(
                cliente=clientes[0],
                alias='Mi Visa Débito',
                defaults={
                    'metodo_financiero': metodo_tarjeta,
                    'is_active': True
                }
            )
            if created:
                Tarjeta.objects.create(
                    metodo_financiero_detalle=detalle_tarjeta1,
                    tipo='LOCAL',
                    payment_method_id=f'local_visa_{clientes[0].cedula}',
                    marca=visa,
                    brand='visa',
                    last4='4532',
                    exp_month=12,
                    exp_year=2028,
                    titular=clientes[0].nombre
                )
                print(f"  → Tarjeta local creada para {clientes[0].nombre}")
            
            # Cliente 2: Cuenta en Nación
            detalle3, created = MetodoFinancieroDetalle.objects.get_or_create(
                cliente=clientes[1],
                alias='Cuenta Banco Nación',
                defaults={
                    'metodo_financiero': metodo_transferencia,
                    'is_active': True
                }
            )
            if created:
                CuentaBancaria.objects.create(
                    metodo_financiero_detalle=detalle3,
                    banco=banco_nacion,
                    numero_cuenta='987654321098765',
                    titular=clientes[1].nombre,
                    cbu_cvu='0110987654321098765432'
                )
                print(f"  → Cuenta bancaria creada para {clientes[1].nombre}")
            
                # Cliente 2: Tarjeta Mastercard Stripe
            detalle_tarjeta2, created = MetodoFinancieroDetalle.objects.get_or_create(
                cliente=clientes[1],
                alias='Mi Mastercard',
                defaults={
                    'metodo_financiero': metodo_tarjeta,
                    'is_active': True
                }
            )
            if created:
                Tarjeta.objects.create(
                    metodo_financiero_detalle=detalle_tarjeta2,
                    tipo='STRIPE',
                    payment_method_id=f'pm_test_card_{clientes[1].cedula}_mc',
                    marca=mastercard,
                    brand='mastercard',
                    last4='5555',
                    exp_month=10,
                    exp_year=2027,
                    titular=clientes[1].nombre
                )
                print(f"  → Tarjeta Stripe creada para {clientes[1].nombre}")
            
            # Cliente 3: Ualá
            detalle4, created = MetodoFinancieroDetalle.objects.get_or_create(
                cliente=clientes[2],
                alias='Mi Ualá',
                defaults={
                    'metodo_financiero': metodo_billetera,
                    'is_active': True
                }
            )
            if created:
                BilleteraDigital.objects.create(
                    metodo_financiero_detalle=detalle4,
                    plataforma=uala,
                    usuario_id=clientes[2].correo,
                    email=clientes[2].correo,
                    telefono=clientes[2].telefono,
                    alias_billetera='CLIENTE.UALA.ARS'
                )
                print(f"  → Billetera digital creada para {clientes[2].nombre}")
            
            # Cliente 3: Tarjeta Cabal Local
            detalle_tarjeta3, created = MetodoFinancieroDetalle.objects.get_or_create(
                cliente=clientes[2],
                alias='Mi Cabal',
                defaults={
                    'metodo_financiero': metodo_tarjeta,
                    'is_active': True
                }
            )
            if created:
                Tarjeta.objects.create(
                    metodo_financiero_detalle=detalle_tarjeta3,
                    tipo='LOCAL',
                    payment_method_id=f'local_cabal_{clientes[2].cedula}',
                    marca=cabal,
                    brand='cabal',
                    last4='6271',
                    exp_month=8,
                    exp_year=2029,
                    titular=clientes[2].nombre
                )
                print(f"  → Tarjeta local Cabal creada para {clientes[2].nombre}")

            # Cliente 4: Múltiples tarjetas
            if len(clientes) >= 4:
                # Cliente 4: Visa Stripe
                detalle_tarjeta4, created = MetodoFinancieroDetalle.objects.get_or_create(
                    cliente=clientes[3],
                    alias='Mi Visa Crédito',
                    defaults={
                        'metodo_financiero': metodo_tarjeta,
                        'is_active': True
                    }
                )
                if created:
                    Tarjeta.objects.create(
                        metodo_financiero_detalle=detalle_tarjeta4,
                        tipo='STRIPE',
                        payment_method_id=f'pm_test_card_{clientes[3].cedula}_visa',
                        marca=visa,
                        brand='visa',
                        last4='4242',
                        exp_month=6,
                        exp_year=2030,
                        titular=clientes[3].nombre
                    )
                    print(f"  → Tarjeta Visa Stripe creada para {clientes[3].nombre}")

            # Cliente 5: Mastercard Local
            if len(clientes) >= 5:
                detalle_tarjeta5, created = MetodoFinancieroDetalle.objects.get_or_create(
                    cliente=clientes[4],
                    alias='Mi Mastercard Débito',
                    defaults={
                        'metodo_financiero': metodo_tarjeta,
                        'is_active': True
                    }
                )
                if created:
                    Tarjeta.objects.create(
                        metodo_financiero_detalle=detalle_tarjeta5,
                        tipo='LOCAL',
                        payment_method_id=f'local_mastercard_{clientes[4].cedula}',
                        marca=mastercard,
                        brand='mastercard',
                        last4='2720',
                        exp_month=4,
                        exp_year=2026,
                        titular=clientes[4].nombre
                    )
                    print(f"  → Tarjeta local Mastercard creada para {clientes[4].nombre}")
        
        # Crear cuentas de la casa de cambio
        casa_detalle1, created = MetodoFinancieroDetalle.objects.get_or_create(
            es_cuenta_casa=True,
            alias='Casa - Galicia Principal ARS',
            defaults={
                'metodo_financiero': metodo_transferencia,
                'is_active': True
            }
        )
        if created:
            CuentaBancaria.objects.create(
                metodo_financiero_detalle=casa_detalle1,
                banco=banco_galicia,
                numero_cuenta='555000111222333',
                titular='GlobalExchange S.A.',
                cbu_cvu='0070555000111222333444'
            )
            print("  → Cuenta de casa creada: Galicia Principal")
        
        casa_detalle2, created = MetodoFinancieroDetalle.objects.get_or_create(
            es_cuenta_casa=True,
            alias='Casa - Mercado Pago Empresarial',
            defaults={
                'metodo_financiero': metodo_billetera,
                'is_active': True
            }
        )
        if created:
            BilleteraDigital.objects.create(
                metodo_financiero_detalle=casa_detalle2,
                plataforma=mp,
                usuario_id='globalexchange.empresarial',
                email='pagos@globalexchange.com',
                telefono='+54911000000',
                alias_billetera='GLOBALEXCHANGE.MP'
            )
            print("  → Cuenta de casa creada: Mercado Pago Empresarial")
                
    except Exception as e:
        print(f"⚠️  Error creando métodos financieros detallados: {e}")
    
    print(f"✅ Bancos: {Banco.objects.count()} total")
    print(f"✅ Billeteras digitales: {BilleteraDigitalCatalogo.objects.count()} total")
    print(f"✅ Marcas de tarjetas: {TarjetaCatalogo.objects.count()} total")
    print(f"✅ Métodos financieros: {MetodoFinanciero.objects.count()} total")
    print(f"✅ Métodos financieros detallados: {MetodoFinancieroDetalle.objects.count()} total")
