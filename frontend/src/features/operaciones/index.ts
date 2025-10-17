// Exportaciones principales del módulo de operaciones
export { default as EtapaSeleccionDivisas } from './components/EtapaSeleccionDivisas';
export { default as EtapaSeleccionMetodo } from './components/EtapaSeleccionMetodo';
export { default as SeleccionMetodoFinanciero } from './components/SeleccionMetodoFinanciero';
export { default as SeleccionInstanciaMetodo } from './components/SeleccionInstanciaMetodo';
export { default as EtapaSeleccionTauser } from './components/EtapaSeleccionTauser';
export { default as EtapaResultado } from './components/EtapaResultado';
export { default as EtapaTerminosCondiciones } from './components/EtapaTerminosCondiciones';
export { default as OperacionCompraVenta } from './components/OperacionCompraVenta';
export { default as OperacionCompraVentaPublica } from './components/OperacionCompraVentaPublica';
export { default as OperacionPage } from './pages/OperacionPage';
export { default as SimuladorTransaccionBancariaPage } from './pages/SimuladorTransaccionBancariaPage';

// Exportar tipos
export type { CalcularOperacionResponse, OperacionRequest } from './types/Operacion';
export type { Transaccion, TransaccionRequest } from './types/Transaccion';

// Exportar servicios
export { operacionPrivada, operacionPublica } from './services/operacionService';
export { crearTransaccion, reconfirmarTasa, actualizarTransaccion, confirmarPago } from './services/transaccionService';
