import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getCuentasBancarias,
  getBilleterasDigitales,
  getDetallesMetodosFinancieros,
  createDetalleMetodoFinanciero,
  createCuentaBancaria,
  createBilleteraDigital,
  updateCuentaBancaria,
  updateBilleteraDigital,
  toggleActiveMetodoFinanciero,
} from "../services/metodoFinancieroService";
import type {
  CuentaBancaria,
  BilleteraDigital,
  MetodoFinancieroDetalle,
  InstanceTabType,
  ExtendedItem,
} from "../types/MetodoFinanciero";

export const useInstancias = () => {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [billeteras, setBilleteras] = useState<BilleteraDigital[]>([]);
  const [detalles, setDetalles] = useState<MetodoFinancieroDetalle[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInstancias = useCallback(async (search: string = "") => {
    setLoading(true);
    try {
      const [detallesRes, cuentasRes, billeterasRes] = await Promise.all([
        getDetallesMetodosFinancieros({ search }),
        getCuentasBancarias({ search }),
        getBilleterasDigitales({ search }),
      ]);

      setDetalles(detallesRes.results.filter((d) => d.es_cuenta_casa));
      setCuentas(cuentasRes.results);
      setBilleteras(billeterasRes.results);
    } catch (err) {
      console.error("Error fetching instancias:", err);
      toast.error("Error al cargar instancias");
    } finally {
      setLoading(false);
    }
  }, []);

  const createInstancia = useCallback(
    async (
      formData: any,
      tipo: InstanceTabType,
      metodoFinancieroId: number
    ) => {
      try {
        // Crear detalle
        const detalleData: MetodoFinancieroDetalle = {
          cliente: null,
          es_cuenta_casa: true,
          metodo_financiero: metodoFinancieroId,
          alias: `Casa - ${
            tipo === "cuentas" ? "cuenta" : "billetera digital"
          }`,
          is_active: true,
        };

        const detalleRes = await createDetalleMetodoFinanciero(detalleData);
        const detalleId = detalleRes.data.id;
        const itemData = { ...formData, metodo_financiero_detalle: detalleId };

        // Crear instancia específica
        if (tipo === "cuentas") {
          await createCuentaBancaria(itemData);
        } else {
          await createBilleteraDigital(itemData);
        }

        toast.success(
          `${
            tipo === "cuentas" ? "Cuenta" : "Billetera digital"
          } de la casa creada exitosamente!`
        );
        return true;
      } catch (err) {
        toast.error(
          `Error al crear ${
            tipo === "cuentas" ? "cuenta" : "billetera digital"
          } de la casa`
        );
        console.error(err);
        return false;
      }
    },
    []
  );

  const updateInstancia = useCallback(
    async (formData: any, item: ExtendedItem) => {
      if (!item.id) return false;

      try {
        if (item.tipo === "cuentas") {
          await updateCuentaBancaria(formData, item.id);
        } else {
          await updateBilleteraDigital(formData, item.id);
        }

        toast.success(
          `${
            item.tipo === "cuentas" ? "Cuenta" : "Billetera digital"
          } actualizada exitosamente!`
        );
        return true;
      } catch (err) {
        toast.error(
          `Error al actualizar ${
            item.tipo === "cuentas" ? "cuenta" : "billetera digital"
          }`
        );
        console.error(err);
        return false;
      }
    },
    []
  );

  const toggleInstancia = useCallback(async (item: ExtendedItem) => {
    if (!item.detalle_id) return false;

    try {
      await toggleActiveMetodoFinanciero(item.detalle_id);
      toast.success(
        `${item.tipo === "cuentas" ? "Cuenta" : "Billetera digital"} ${
          item.is_active ? "desactivada" : "activada"
        } exitosamente!`
      );
      return true;
    } catch (err) {
      toast.error(
        `Error al ${item.is_active ? "desactivar" : "activar"} ${
          item.tipo === "cuentas" ? "cuenta" : "billetera digital"
        }`
      );
      console.error(err);
      return false;
    }
  }, []);

  // Función auxiliar para obtener items extendidos con estado activo
  const getExtendedItems = useCallback(
    (items: any[], tipo: InstanceTabType): ExtendedItem[] => {
      return items.map((item) => {
        const detalle = detalles.find(
          (d) => d.id === item.metodo_financiero_detalle
        );
        return {
          ...item,
          tipo,
          is_active: detalle?.is_active ?? true,
          detalle_id: detalle?.id,
          desactivado_por_catalogo: detalle?.desactivado_por_catalogo ?? false,
        };
      });
    },
    [detalles]
  );

  return {
    cuentas,
    billeteras,
    detalles,
    loading,
    fetchInstancias,
    createInstancia,
    updateInstancia,
    toggleInstancia,
    getExtendedItems,
  };
};
