import { useEffect, useState } from "react";
import { type Denominacion, type Divisa } from "../../../types/Divisa";
import {
  deactivateDenominacion,
  getDenominacionesOfDivisa,
  updateDenominacion,
} from "../../../services/divisaService";
import { toast } from "react-toastify";
import * as yup from "yup";
import { Check, Plus, X, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Can from "../../../components/Can";
import { DENOMINACIONES } from "../../../types/perms";

export type DenominacionFormData = {
  denominacion: number;
};

const denominacionSchema = yup.object().shape({
  denominacion: yup
    .number()
    .required("Este campo es requerido")
    .typeError("Debe ser un número")
    .integer("El número debe ser entero")
    .moreThan(0, "El número debe ser mayor a cero"),
});

type Props = {
  onSubmit: (data: DenominacionFormData) => void;
  onCancel: () => void;
  divisa: Divisa;
  denominacion?: Denominacion;
};

const DenominacionesDivisa = ({ onSubmit, onCancel, divisa }: Props) => {
  const [denominaciones, setDenominaciones] = useState<Denominacion[]>([]);
  const [pending, setPending] = useState(false);
  const [isForm, setIsForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DenominacionFormData>({
    resolver: yupResolver(denominacionSchema),
    defaultValues: { denominacion: 0 },
  });

  const onFormSubmit = async (data: DenominacionFormData) => {
    try {
      onSubmit(data);
      reset();
    } catch (err) {
      toast.error("Error al crear nueva denominación!");
    } finally {
      fetchDenominaciones();
      setIsForm(false);
    }
  };

  const fetchDenominaciones = async () => {
    setPending(true);
    try {
      const res = await getDenominacionesOfDivisa(divisa.id!);
      setDenominaciones(res);
      console.log(res);
      setPending(false);
    } catch (err) {
      toast.error("Ha ocurrido un error obteniendo las denominaciones");
    }
  };

  const handleDeactivateDenominacion = async (id: number) => {
    try {
      const res = await deactivateDenominacion(id);
      if (res.status === 200)
        toast.success("Denominación desactivada con éxito");
      fetchDenominaciones();
    } catch (e) {
      toast.error("Ha ocurrido un error");
    }
  };
  const handleActivateDenominacion = async (denominacion: Denominacion) => {
    denominacion.is_active = true;
    try {
      const res = await updateDenominacion(denominacion, denominacion.id!);
      if (res.status === 200) {
        toast.success("Denominación activada con éxito!");
        fetchDenominaciones();
      }
    } catch (e) {
      toast.error("Ha ocurrido un error");
    }
  };

  const handleEditStart = (denominacion: Denominacion) => {
    setEditingId(denominacion.id!);
    setEditValue(denominacion.denominacion.toString());
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleEditSave = async (denominacion: Denominacion) => {
    try {
      const updated: Denominacion = {
        ...denominacion,
        denominacion: parseInt(editValue),
      };
      const res = await updateDenominacion(updated, denominacion.id!);
      if (res.status === 200) {
        toast.success("Denominación actualizada con éxito!");
        fetchDenominaciones();
      }
    } catch (e) {
      toast.error("Ha ocurrido un error al actualizar");
    } finally {
      setEditingId(null);
      setEditValue("");
    }
  };

  useEffect(() => {
    fetchDenominaciones();
  }, [isForm]);

  if (isForm) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Crear nueva denominación
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Divisa
            </label>
            <input
              type="text"
              id="name"
              readOnly={true}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              defaultValue={divisa.codigo}
            />
          </div>

          <div>
            <label
              htmlFor="denominacion"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Denominación
            </label>
            <input
              type="text"
              id="denominacion"
              {...register("denominacion")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.denominacion ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Denominación"
            />
            {errors.denominacion && (
              <p className="mt-1 text-sm text-red-600">
                {errors.denominacion.message}
              </p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleSubmit(onFormSubmit)}
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creando..." : "Crear denominación"}
            </button>
            <button
              type="button"
              onClick={() => {
                onCancel();
                setIsForm(false);
              }}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex-1 overflow-y-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Denominaciones asociadas
      </h2>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Can anyOf={[DENOMINACIONES.ADD]}>
          <button
            onClick={() => {
              setIsForm(true);
            }}
            className="btn-primary flex items-center justify-center"
          >
            <Plus size={18} className="mr-2" />
            Crear denominación
          </button>
        </Can>
      </div>
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Divisa</th>
                <th>Denominacion</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            {pending ? (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <div>Buscando denominaciones...</div>
                  </td>
                </tr>
              </tbody>
            ) : denominaciones.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <div>No hay denominaciones para esta divisa</div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 min-h-md">
                {denominaciones.map((denominacion: Denominacion) => (
                  <tr key={denominacion.id}>
                    <td className="font-medium">{divisa.codigo}</td>
                    <td>
                      {editingId === denominacion.id ? (
                        <input
                          type="number"
                          className="w-24 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditSave(denominacion);
                            if (e.key === "Escape") handleEditCancel();
                          }}
                          autoFocus
                        />
                      ) : (
                        denominacion.denominacion.toLocaleString("es-ES")
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          denominacion.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-900"
                        }`}
                      >
                        {denominacion.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {editingId === denominacion.id ? (
                          <>
                            <button
                              onClick={() => handleEditSave(denominacion)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded-full"
                              title="Guardar"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Can
                              anyOf={
                                denominacion.is_active
                                  ? [DENOMINACIONES.DELETE]
                                  : [DENOMINACIONES.CHANGE]
                              }
                            >
                              <button
                                onClick={
                                  denominacion.is_active
                                    ? () =>
                                        handleDeactivateDenominacion(
                                          denominacion.id!
                                        )
                                    : () =>
                                        handleActivateDenominacion(denominacion)
                                }
                                className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                                title={
                                  denominacion.is_active
                                    ? "Desactivar"
                                    : "Activar"
                                }
                              >
                                {denominacion.is_active ? (
                                  <X size={16} />
                                ) : (
                                  <Check size={16} />
                                )}
                              </button>
                            </Can>

                            <Can anyOf={[DENOMINACIONES.CHANGE]}>
                              <button
                                onClick={() => handleEditStart(denominacion)}
                                className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                                title="Actualizar"
                              >
                                <Pencil size={16} />
                              </button>
                            </Can>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DenominacionesDivisa;
