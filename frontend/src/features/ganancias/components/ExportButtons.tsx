/**
 * Export Buttons Component
 * Reusable buttons for exporting reports to Excel and PDF
 */

import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportExcel, exportPDF } from '../services/gananciaService';
import type { GananciaFiltros } from '../types/Ganancia';

interface ExportButtonsProps {
  reportType: 'general' | 'por_divisa' | 'evolucion' | 'transacciones';
  filtros: GananciaFiltros;
}

export const ExportButtons = ({ reportType, filtros }: ExportButtonsProps) => {
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportExcel = async () => {
    try {
      setLoadingExcel(true);
      setError(null);
      await exportExcel(reportType, filtros);
    } catch (err: any) {
      console.error('Error al exportar a Excel:', err);
      const errorMessage = err.message || 'Error al exportar a Excel. Por favor, intente nuevamente.';
      setError(errorMessage);
      // Limpiar el error después de 5 segundos
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoadingPDF(true);
      setError(null);
      await exportPDF(reportType, filtros);
    } catch (err: any) {
      console.error('Error al exportar a PDF:', err);
      const errorMessage = err.message || 'Error al exportar a PDF. Por favor, intente nuevamente.';
      setError(errorMessage);
      // Limpiar el error después de 5 segundos
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingPDF(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleExportExcel}
          disabled={loadingExcel || loadingPDF}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Exportar a Excel"
        >
          {loadingExcel ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          <span>{loadingExcel ? 'Exportando...' : 'Exportar Excel'}</span>
        </button>
        
        <button
          onClick={handleExportPDF}
          disabled={loadingExcel || loadingPDF}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title="Descargar PDF con nombre y timestamp"
        >
          {loadingPDF ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span>{loadingPDF ? 'Generando...' : 'Descargar PDF'}</span>
        </button>
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
