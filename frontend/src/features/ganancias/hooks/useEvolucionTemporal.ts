/**
 * Custom hook for fetching evolución temporal data
 */

import { useState, useEffect } from 'react';
import type { GananciaEvolucionTemporal, GananciaFiltros } from '../types/Ganancia';
import { getEvolucionTemporal } from '../services/gananciaService';

export const useEvolucionTemporal = (filtros: GananciaFiltros = {}) => {
  const [data, setData] = useState<GananciaEvolucionTemporal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getEvolucionTemporal(filtros);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filtros)]);

  return { data, loading, error };
};
