/**
 * Custom hook for fetching estadísticas generales
 */

import { useState, useEffect } from 'react';
import type { EstadisticasGenerales, GananciaFiltros } from '../types/Ganancia';
import { getEstadisticas } from '../services/gananciaService';

export const useGananciaStats = (filtros: GananciaFiltros = {}) => {
  const [stats, setStats] = useState<EstadisticasGenerales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEstadisticas(filtros);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [JSON.stringify(filtros)]);

  return { stats, loading, error, refetch };
};
