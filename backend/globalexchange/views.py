# En globalexchange/views.py (crear si no existe)
from django.http import JsonResponse
from django.conf import settings
from django.http import Http404
from rest_framework.decorators import api_view

def custom_404_handler(request, exception=None):
    """Handler 404 personalizado para no revelar estructura"""
    
    if request.path.startswith('/api/'):
        # Para rutas de API, respuesta JSON genérica
        return JsonResponse({
            'error': 'Endpoint not found',
            'status': 404
        }, status=404)
    else:
        # Para otras rutas, página 404 del frontend
        from django.shortcuts import render
        return render(request, 'index.html', status=404)

@api_view(['GET'])
def api_root_404(request):
    """Reutiliza el handler global para /api/"""
    return custom_404_handler(request, exception=None)
