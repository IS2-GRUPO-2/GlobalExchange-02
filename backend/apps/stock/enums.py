from enum import StrEnum, auto

class TipoMovimiento(StrEnum):
    SALCLT = "SALCLT"
    ENTCLT = "ENTCLT"
    SALCS  = "SALCS" 
    ENTCS  = "ENTCS" 

class EstadoMovimiento(StrEnum):
    EN_PROCESO = auto()
    FINALIZADO = auto()
    CANCELADO = auto()