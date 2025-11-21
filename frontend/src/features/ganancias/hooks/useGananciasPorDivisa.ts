/**
 * Custom hook for fetching and managing ganancias data
 */

import { useState, useEffect } from 'react';
import type { GananciaPorDivisa, GananciaFiltros } from '../types/Ganancia';
import { getGananciasPorDivisa } from '../services/gananciaService';

export const useGananciasPorDivisa = (filtros: GananciaFiltros = {}) => {
  const [data, setData] = useState<GananciaPorDivisa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getGananciasPorDivisa(filtros);
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
