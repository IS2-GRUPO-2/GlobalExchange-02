/**
 * Tab Navigation component for Ganancias Reports
 * Allows switching between different report views
 */

import React from 'react';
import { BarChart3, TrendingUp, DollarSign, FileClock } from 'lucide-react';
import type { ReportTab } from '../types/Ganancia';

interface ReportTabNavigationProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
}

const tabs: Array<{ key: ReportTab; label: string; icon: React.ReactNode }> = [
  {
    key: 'general',
    label: 'General',
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    key: 'por-divisas',
    label: 'Ganancia por Divisas',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    key: 'evolucion',
    label: 'Evolución Temporal',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    key: 'transacciones',
    label: 'Transacciones del Periodo',
    icon: <FileClock className="w-5 h-5" />,
  },
];

export const ReportTabNavigation = ({ activeTab, onTabChange }: ReportTabNavigationProps) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
