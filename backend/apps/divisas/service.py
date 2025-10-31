from .models import Denominacion


def __intentar_formar(restante, idx, denominaciones):
    """Intenta formar el monto restante usando denominaciones desde el índice idx."""
    if restante == 0:
        return True
    if idx >= len(denominaciones):
        return False

    denom = denominaciones[idx]
    # Cantidad máxima posible con esta denominación
    max_cant = restante // denom

    # Intentar usar desde la cantidad máxima hasta 0
    for n in range(max_cant, -1, -1):
        nuevo_restante = restante - n * denom
        if __intentar_formar(nuevo_restante, idx + 1, denominaciones):
            return True

    return False


def puede_acumular_monto(divisa_id: int, monto: int) -> bool:
    """
    Determina si es posible acumular el monto dado con las denominaciones activas de una divisa.

    Args:
        divisa_id: ID de la divisa
        monto: Monto a acumular

    Returns:
        True si es posible acumular el monto, False en caso contrario
    """
    if monto <= 0:
        return False

    # Obtener denominaciones activas de la divisa, ordenadas de mayor a menor
    denominaciones = Denominacion.objects.filter(
        divisa_id=divisa_id,
        is_active=True
    ).order_by('-denominacion').values_list('denominacion', flat=True)

    if not denominaciones:
        return False

    # Convertir a lista para facilitar el uso
    denoms = list(denominaciones)

    return __intentar_formar(monto, 0, denoms)
