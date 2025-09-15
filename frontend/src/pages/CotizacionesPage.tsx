import { Check, Edit, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import type { Tasa, TasaCreate } from "../types/Tasa";
import type { Divisa, PaginatedDivisas } from "../types/Divisa";

import {
  createTasa,
  deactivateTasa,
  getTasas,
  partialUpdateTasa,
  updateTasa,
} from "../services/tasaService";

import { getDivisas } from "../services/divisaService";
import { useAuth } from "../context/useAuth";
import Modal from "../components/Modal";
import TasaForm, { type TasaFormData } from "../components/TasaForm";

const CotizacionesPage = () => {
  // datos
  const [tasasRaw, setTasasRaw] = useState<Tasa[]>([]);
  const [tasas, setTasas] = useState<Tasa[]>([]);

  // búsqueda al estilo ClientesPage
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTasa, setSelectedTasa] = useState<Tasa | null>(null);

  const { isLoggedIn } = useAuth();

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => setCreateModalOpen(false);

  const openEditModal = (tasa: Tasa) => {
    setSelectedTasa(tasa);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedTasa(null);
    setEditModalOpen(false);
  };

  // Mapa id -> {codigo, nombre} para mostrar/filtrar por código/nombre
  const [divisasMap, setDivisasMap] = useState<
    Record<number, { codigo: string; nombre: string}>
  >({});

  const [divisaBase, setDivisaBase] = useState<Divisa | null>(null);

  const fetchDivisaBase = async () => {
    try {
      const res: PaginatedDivisas = await getDivisas({ search: "", page: 1 , es_base: true});
      const base = res.results?.[0] ?? null;
      console.log("Divisa base:", base);
      if (base) setDivisaBase(base);
    } catch (e) {
      console.error("Error obteniendo divisa base", e);
    }
  };
  const formatNumber = (value: number | string) => {
    if (value === null || value === undefined) return "";
    const precision = divisaBase?.precision ?? 3;
    return new Intl.NumberFormat("es-PY", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(Number(value));
  };

  useEffect(() => {
    fetchDivisaBase();
  }, []);

  const buildDivisasMap = async () => {
    let page = 1;
    const m: Record<number, { codigo: string; nombre: string }> = {};
    while (true) {
      const res: PaginatedDivisas = await getDivisas({ page, search: "" });
      const list = res?.results ?? [];
      list.forEach((d: Divisa) => {
        if (typeof d.id === "number") {
          m[d.id] = { codigo: d.codigo, nombre: d.nombre };
        }
      });
      if (!res?.next || list.length === 0) break;
      page += 1;
    }
    setDivisasMap(m);
  };

  useEffect(() => {
    buildDivisasMap();
  }, []);

  const fetchTasas = async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await getTasas();
      setTasasRaw(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setErr("Error al cargar cotizaciones");
      setTasasRaw([]);
    } finally {
      setLoading(false);
    }
  };

  // igual que en Clientes: refetch cuando cambia el query (y al loguearse)
  useEffect(() => {
    fetchTasas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isLoggedIn]);

  // filtrar en front por código/nombre de divisa o por precio/comisión
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setTasas(tasasRaw);
      return;
    }
    const filtered = (tasasRaw ?? []).filter((t) => {
      const d = t.divisa ? divisasMap[t.divisa] : undefined;
      const byCode = d?.codigo?.toLowerCase().includes(q) ?? false;
      const byName = d?.nombre?.toLowerCase().includes(q) ?? false;
      const byBase = String(t.precioBase).toLowerCase().includes(q);
      const byComC = String(t.comisionBaseCompra).toLowerCase().includes(q);
      const byComV = String(t.comisionBaseVenta).toLowerCase().includes(q);
      const byId = String(t.divisa).toLowerCase().includes(q); // por si el map aún no cargó
      return byCode || byName || byBase || byComC || byComV || byId;
    });
    setTasas(filtered);
  }, [searchQuery, tasasRaw, divisasMap]);



  // Crear
  const handleCreateTasa = async (data: TasaFormData) => {
    const payload: TasaCreate = {
      divisa: data.divisa,
      precioBase: data.precioBase,
      comisionBaseCompra: data.comisionBaseCompra,
      comisionBaseVenta: data.comisionBaseVenta,
      activo: data.activo,
    };

    try {
      const res = await createTasa(payload);
      if (res.status === 201) {
        toast.success("Tasa creada con éxito");
        fetchTasas();
      } else {
        toast.info(`Respuesta: ${res.status}`);
      }
      closeCreateModal();
    }catch (e: any) {
      const data = e?.response?.data;

      let msg = "Error creando tasa";

      if (typeof data === "string") {
        msg = data;
      } else if (data && typeof data === "object") {
        const allErrors: string[] = [];
        for (const key in data) {
          if (Array.isArray(data[key])) {
            allErrors.push(...data[key]);
          } else if (typeof data[key] === "string") {
            allErrors.push(data[key]);
          }
        }
        if (allErrors.length > 0) {
          msg = allErrors.join("\n");
        }
      }

      toast.error(msg);
    }
  };

  // Editar
  const handleUpdateTasa = async (data: TasaFormData) => {
    if (!selectedTasa?.id) return;

    const payload: Tasa = {
      id: selectedTasa.id,
      divisa: data.divisa,
      precioBase: data.precioBase,
      comisionBaseCompra: data.comisionBaseCompra,
      comisionBaseVenta: data.comisionBaseVenta,
      activo: data.activo,
    };

    try {
      const res = await updateTasa(payload, selectedTasa.id);
      if (res.status === 200) {
        toast.success("Cotización actualizada con éxito");
        fetchTasas();
      } else {
        toast.info(`Respuesta: ${res.status}`);
      }
      closeEditModal();
    }catch (e: any) {
      const data = e?.response?.data;

      let msg = "Error creando tasa";

      if (typeof data === "string") {
        msg = data;
      } else if (data && typeof data === "object") {
        const allErrors: string[] = [];
        for (const key in data) {
          if (Array.isArray(data[key])) {
            allErrors.push(...data[key]);
          } else if (typeof data[key] === "string") {
            allErrors.push(data[key]);
          }
        }
        if (allErrors.length > 0) {
          msg = allErrors.join("\n");
        }
      }

      toast.error(msg);
    }
  };

  const handleDeactivateTasa = async (id: number) => {
    try {
      const res = await deactivateTasa(id);
      if (res.status === 204 || res.status === 200) {
        toast.success("Cotización desactivada con éxito");
        fetchTasas();
      } else {
        toast.info(`Respuesta: ${res.status}`);
      }
    } catch {
      toast.error("Ha ocurrido un error al desactivar la Cotización");
    }
  };

  // Activar (PATCH activo=true)
  const handleActivateTasa = async (tasa: Tasa) => {
    try {
      const res = await partialUpdateTasa({ activo: true }, tasa.id!);
      if (res.status === 200) {
        toast.success("Tasa activada con éxito");
        fetchTasas();
      } else {
        toast.info(`Respuesta: ${res.status}`);
      }
    }catch (e: any) {
      const data = e?.response?.data;

      let msg = "Error creando tasa";

      if (typeof data === "string") {
        msg = data;
      } else if (data && typeof data === "object") {
        const allErrors: string[] = [];
        for (const key in data) {
          if (Array.isArray(data[key])) {
            allErrors.push(...data[key]);
          } else if (typeof data[key] === "string") {
            allErrors.push(data[key]);
          }
        }
        if (allErrors.length > 0) {
          msg = allErrors.join("\n");
        }
      }

      toast.error(msg);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex-1 overflow-y-auto p-6">
      {/* Header: búsqueda (igual estilo que ClientesPage) + crear */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64 md:w-96 pl-4">
          <div className="absolute inset-y-0 left-0 p-8 pt-5 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar cotizaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center"
        >
          <Plus size={18} className="mr-2" />
          Crear Cotización
        </button>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Divisa</th>
                <th>Nombre</th>
                <th>Precio base</th>
                <th>Comisión base Compra</th>
                <th>Comisión base Venta</th>
                <th>Compra</th>
                <th>Venta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div>Cargando…</div>
                  </td>
                </tr>
              ) : err ? (
                <tr>
                  <td colSpan={7}>
                    <div>{err}</div>
                  </td>
                </tr>
              ) : (tasas ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div>No hay datos</div>
                  </td>
                </tr>
              ) : (
                (tasas ?? []).map((tasa) => (
                  <tr key={tasa.id}>
                    <td className="font-medium">
                      {tasa.divisa && divisasMap[tasa.divisa]
                        ? `${divisasMap[tasa.divisa].codigo}`
                        : tasa.divisa}
                    </td>
                    <td className="font-medium">
                      {tasa.divisa && divisasMap[tasa.divisa]
                        ? `${divisasMap[tasa.divisa].nombre}`
                        : tasa.divisa}
                    </td>
                    <td>{formatNumber(tasa.precioBase)} {divisaBase?.simbolo ?? ""}</td>
                    <td>{formatNumber(tasa.comisionBaseCompra)} {divisaBase?.simbolo ?? ""}</td>
                    <td>{formatNumber(tasa.comisionBaseVenta)} {divisaBase?.simbolo ?? ""}</td>
                    <td>{formatNumber(tasa.tasaCompra ?? 0)} {divisaBase?.simbolo ?? ""}</td>
                    <td>{formatNumber(tasa.tasaVenta ?? 0)} {divisaBase?.simbolo ?? ""}</td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tasa.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-900"
                        }`}
                      >
                        {tasa.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(tasa)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={
                            tasa.activo
                              ? () => handleDeactivateTasa(tasa.id!)
                              : () => handleActivateTasa(tasa)
                          }
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                          title={tasa.activo ? "Desactivar" : "Activar"}
                        >
                          {tasa.activo ? <X size={16} /> : <Check size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modales */}
        <Modal isOpen={createModalOpen} onClose={closeCreateModal}>
          <TasaForm
            onSubmit={handleCreateTasa}
            onCancel={closeCreateModal}
            isEditForm={false}
            tasa={null}
          />
        </Modal>

        <Modal isOpen={editModalOpen} onClose={closeEditModal}>
          <TasaForm
            onSubmit={handleUpdateTasa}
            onCancel={closeEditModal}
            isEditForm={true}
            tasa={selectedTasa}
          />
        </Modal>
      </div>
    </div>
  );
};

export default CotizacionesPage;
