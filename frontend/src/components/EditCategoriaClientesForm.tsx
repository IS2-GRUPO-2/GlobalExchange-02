import { useState } from "react";

interface Props {
  categoria: {
    idCategoria: string;
    nombre: string;
    descripcion: string;
    descuento: number;
  };
  onSubmit: (data: { idCategoria: string; descripcion: string; descuento: number }) => void;
  onCancel: () => void;
}

const EditCategoriaClientesForm = ({ categoria, onSubmit, onCancel }: Props) => {
  const [descripcion, setDescripcion] = useState(categoria.descripcion || "");
  const [descuento, setDescuento] = useState(categoria.descuento);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ idCategoria: categoria.idCategoria, descripcion, descuento });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={categoria.nombre}
          disabled
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Descuento (%)</label>
        <input
          type="number"
          value={descuento}
          onChange={(e) => setDescuento(parseFloat(e.target.value))}
          min="0"
          step="0.01"
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          Guardar
        </button>
      </div>
    </form>
  );
};

export default EditCategoriaClientesForm;
