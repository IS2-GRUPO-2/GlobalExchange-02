from django.urls import path
from .views import DescargarFacturaPDFView
urlpatterns = [
    path('<int:transaccion_id>/descargar_pdf', DescargarFacturaPDFView.as_view(), name="descargar_factura_pdf")
]