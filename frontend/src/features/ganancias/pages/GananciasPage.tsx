/**
 * Main Ganancias Dashboard Page
 * Reimplemented with tab-based navigation for different report views
 */

import { useState, useEffect } from 'react';
import type { ReportTab } from '../types/Ganancia';
import { getDivisas } from '../../divisas/services/divisaService';
import { getMetodosFinancieros } from '../../metodos_financieros/services/metodoFinancieroService';
import { ReportTabNavigation } from '../components/ReportTabNavigation';
import { GeneralReportView } from '../components/GeneralReportView';
import { PorDivisasReportView } from '../components/PorDivisasReportView';
import { EvolucionReportView } from '../components/EvolucionReportView';
import { Top10ReportView } from '../components/Top10ReportView';

interface Divisa {
  id: number;
  codigo: string;
  nombre: string;
}

interface MetodoFinanciero {
  id: number;
  nombre: string;
}

export const GananciasPage = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('general');
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);

  // Fetch divisas and metodos for filters
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Fetch divisas (excluding base currency)
        const divisasResponse = await getDivisas({ es_base: false, page_size: 100 });
        setDivisas(divisasResponse.results || []);
        
        // Fetch metodos financieros
        const metodosResponse = await getMetodosFinancieros({ page_size: 100 });
        setMetodos(metodosResponse.results || []);
      } catch (error) {
        console.error('Error fetching filters data:', error);
      }
    };

    fetchFiltersData();
  }, []);

  const renderReportView = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralReportView divisas={divisas} metodos={metodos} />;
      case 'por-divisas':
        return <PorDivisasReportView metodos={metodos} />;
      case 'evolucion':
        return <EvolucionReportView divisas={divisas} metodos={metodos} />;
      case 'top-10':
        return <Top10ReportView divisas={divisas} metodos={metodos} />;
      default:
        return <GeneralReportView divisas={divisas} metodos={metodos} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Ganancias</h1>
          <p className="text-gray-600 mt-2">
            Análisis completo de ganancias generadas por operaciones de cambio
          </p>
        </div>

        {/* Tab Navigation */}
        <ReportTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Report Content */}
        {renderReportView()}
      </div>
    </div>
  );
};
