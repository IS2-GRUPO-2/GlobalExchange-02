
factura_base = {
            "iTipEmi": "1", # tipo de emision
            "iTiDE": "1", # harcoded
            "dNumTim": "02595733", # nro de timbrado
            "dFeIniT": "2025-03-27", # fecha de inicio de timbrado
            "dEst": "001", # establecimiento
            "dPunExp": "003", # punto de expedicion
            "dNumDoc": "", # numero de factura (de 201 a 250), deben ser 7 caracteres
            "dFeEmiDE": "", # fecha de emision de la factura
            "iTipTra": "", # tipo de transaccion (6 es compra de divisas, 5 es venta de divisas)
            "iTImp": "4", # tipo de impuesto
            "cMoneOpe": "PYG", # PYG o USD, no soporta otros tipos de monedas
            "dCondTiCam": "1", # hardcoded
            "dTiCam": "7350", # tipo de cambio si la moneda no es pyg
            "dRucEm": "2595733", # ruc del emisor, harcoded
            "dDVEmi": "3", # digito verificador del ruc, hardcoded
            "iTipCont": "2", # tipo de contribuyente del emisor, hardocded
            "dNomEmi": "GLOBAL EXCHANGE PY", # hardcoded
            "dDirEmi": "CRUZ DEL CHACO 567", # hardcoded
            "dNumCas": "567", # hardcoded
            "cDepEmi": "1", # central
            "dDesDepEmi": "CAPITAL", 
            "cCiuEmi": "1",
            "dDesCiuEmi": "ASUNCION (DISTRITO)",
            "dTelEmi": "(021)611192",
            "dEmailE": "ggonzar@gmail.com",
            "gActEco": [ # hardcoded
                {
                    "cActEco": "62010",
                    "dDesActEco": "Actividades de programación informática"
                },
                {
                    "cActEco": "74909",
                    "dDesActEco": "Otras actividades profesionales, científicas y técnicas n.c.p."
                }
            ],
            "iNatRec": "", # naturaleza del emisor, revisar manual sifen
    	    "iTiOpe": "", # tipo de operacion, 1 si es persona juridica, 2 si es persona fisica
            "cPaisRec": "PRY", # todos los clientes son de py
            "iTiContRec": "", # tipo de contribuyente del receptor
            "dRucRec": "0", # ruc del receptor
            "dDVRec": "0", #digito verificador del ruc del receptor
            "iTipIDRec": "0", # obligatorio si inatRec es 2, 1 es CI
            "dNumIDRec": "0", # obligatorio si iTipIDRec existe
            "dNomRec": "", # nombre del receptor
            "dEmailRec": "", # correo del receptor
            "iIndPres": "", # indicador de presencia, 1 es presencial, 2 es online
            "iCondOpe": "1", # condicion de la operacion, 1 es contado. Siempre pagamos al contado
            "gPaConEIni": [ # pagos cuando la operacion es al contado
                #{
                #    "iTiPago": "1", tipo de pago, 1 significa efectivo
                #    "dMonTiPag": "725000", monto a pagar
                #    "cMoneTiPag": "PYG", divisa del pago
                #    "dTiCamTiPag": "1" tipo de cambio
                #}
            ],
            "iCondCred": "1", # condicion de credito, hardcoded 1
            "dPlazoCre": "0",
            "gCamItem": [ # items a ser pagados en esta factura
                #{
                #    "dCodInt": "DIVUSD",
                #    "dDesProSer": "Dólares Estadounidenses",
                #    "cUniMed": "77",
                #    "dCantProSer": "1",
                #    "dPUniProSer": "725000",
                #    "dDescItem": "0",
                #    "dDescGloItem": "0",
                #    "dAntPreUniIt": "0",
                #    "dAntGloPreUniIt": "0",
                #    "iAfecIVA": "2",
                #    "dPropIVA": "100",
                #    "dTasaIVA": "0"
                #}
            ],
            "CDC": "0",
            "dCodSeg": "0",
            "dDVId": "0",
            "dSisFact": "1"
        }