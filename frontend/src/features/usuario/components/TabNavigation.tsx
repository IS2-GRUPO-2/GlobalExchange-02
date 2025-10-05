import { User, Settings } from "lucide-react";

type TabNavigationProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const tabs = [
  {
    key: "profile",
    label: "Perfil",
    icon: <User size={18} />,
  },
  {
    key: "settings",
    label: "Configuración",
    icon: <Settings size={18} />,
  },
];

const TabNavigation = ({ activeTab, setActiveTab }: TabNavigationProps) => (
  <div className="flex space-x-2 mb-6 border-b border-gray-200">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key)}
        className={`px-4 py-2 -mb-px font-medium transition-colors ${
          activeTab === tab.key
            ? "border-b-2 border-gray-900 text-gray-900"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        <div className="flex items-center gap-2">
          {tab.icon}
          <span>{tab.label}</span>
        </div>
      </button>
    ))}
  </div>
);

export default TabNavigation;
