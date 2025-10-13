import { Clock, Shield, TrendingDown, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Operaciones Instantáneas",
    description: "Realiza tus cambios de divisas en segundos con nuestro sistema automatizado",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  },
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Tus transacciones están protegidas con los más altos estándares de seguridad",
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    icon: TrendingDown,
    title: "Mejores Tasas",
    description: "Tasas competitivas actualizadas en tiempo real para maximizar tu dinero",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: Clock,
    title: "Disponible 24/7",
    description: "Accede a nuestros servicios en cualquier momento, todos los días del año",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  }
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
          >
            <div className={`${feature.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <Icon className={`w-6 h-6 ${feature.color}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {feature.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
