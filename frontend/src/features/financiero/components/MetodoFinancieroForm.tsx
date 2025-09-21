import React from "react";

interface MetodoFinancieroFormProps {
  selectedItem: any;
  editModalOpen: boolean;
  isSubmitting: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const MetodoFinancieroForm: React.FC<MetodoFinancieroFormProps> = ({
  selectedItem,
  editModalOpen,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const initialData = selectedItem || {
    nombre: "TRANSFERENCIA_BANCARIA",
    permite_cobro: true,
    permite_pago: true,
    comision_cobro_porcentaje: "0.00",
    comision_pago_porcentaje: "0.00",
    is_active: true,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      nombre: formData.get("nombre"),
      permite_cobro: formData.get("permite_cobro") === "on",
      permite_pago: formData.get("permite_pago") === "on",
      comision_cobro_porcentaje: formData.get("comision_cobro_porcentaje"),
      comision_pago_porcentaje: formData.get("comision_pago_porcentaje"),
      is_active: true,
    };
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="nombre"
          className="block text-sm font-medium text-gray-700"
        >
          Tipo de Método *
        </label>
        <select
          id="nombre"
          name="nombre"
          defaultValue={initialData.nombre}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          required
        >
          <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</option>
          <option value="BILLETERA_DIGITAL">Billetera Digital</option>
          <option value="METALICO">Metálico</option>
          <option value="CHEQUE">Cheque</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <input
            id="permite_cobro"
            name="permite_cobro"
            type="checkbox"
            defaultChecked={initialData.permite_cobro}
            className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
          />
          <label
            htmlFor="permite_cobro"
            className="ml-2 block text-sm text-gray-900"
          >
            Permite Cobro
          </label>
        </div>

        <div className="flex items-center">
          <input
            id="permite_pago"
            name="permite_pago"
            type="checkbox"
            defaultChecked={initialData.permite_pago}
            className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
          />
          <label
            htmlFor="permite_pago"
            className="ml-2 block text-sm text-gray-900"
          >
            Permite Pago
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="comision_cobro_porcentaje"
            className="block text-sm font-medium text-gray-700"
          >
            Comisión Cobro (%)
          </label>
          <input
            type="number"
            id="comision_cobro_porcentaje"
            name="comision_cobro_porcentaje"
            step="0.01"
            min="0"
            max="100"
            defaultValue={initialData.comision_cobro_porcentaje}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="comision_pago_porcentaje"
            className="block text-sm font-medium text-gray-700"
          >
            Comisión Pago (%)
          </label>
          <input
            type="number"
            id="comision_pago_porcentaje"
            name="comision_pago_porcentaje"
            step="0.01"
            min="0"
            max="100"
            defaultValue={initialData.comision_pago_porcentaje}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? "Guardando..."
            : editModalOpen
            ? "Actualizar"
            : "Crear"}
        </button>
      </div>
    </form>
  );
};
