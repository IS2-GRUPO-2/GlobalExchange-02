import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getBancos,
  getBilleterasDigitalesCatalogo,
  getTarjetasCatalogo,
  createBanco,
  createBilleteraDigitalCatalogo,
  createTarjetaCatalogo,
  updateBanco,
  updateBilleteraDigitalCatalogo,
  updateTarjetaCatalogo,
  toggleActiveBanco,
  toggleActiveBilleteraDigitalCatalogo,
  toggleActiveTarjetaCatalogo,
} from "../services/metodoFinancieroService";
import type {
  Banco,
  BilleteraDigitalCatalogo,
  TarjetaCatalogo,
  CatalogTabType,
} from "../types/MetodoFinanciero";

export const useCatalogos = () => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [billeterasCatalogo, setBilleterasCatalogo] = useState<
    BilleteraDigitalCatalogo[]
  >([]);
  const [tarjetasCatalogo, setTarjetasCatalogo] = useState<
    TarjetaCatalogo[]
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchCatalogos = useCallback(async (search: string = "") => {
    setLoading(true);
    try {
      const [bancosRes, billeterasRes, tarjetasRes] = await Promise.all([
        getBancos({ search }),
        getBilleterasDigitalesCatalogo({ search }),
        getTarjetasCatalogo({ search }),
      ]);

      setBancos(bancosRes.results);
      setBilleterasCatalogo(billeterasRes.results);
      setTarjetasCatalogo(tarjetasRes.results);
    } catch (err) {
      console.error("Error fetching catálogos:", err);
      toast.error("Error al cargar catálogos");
    } finally {
      setLoading(false);
    }
  }, []);

  const createCatalogItem = useCallback(
    async (formData: any, tipo: CatalogTabType) => {
      try {
        if (tipo === "bancos") {
          await createBanco(formData);
          toast.success("Banco creado exitosamente!");
        } else if (tipo === "billeteras") {
          await createBilleteraDigitalCatalogo(formData);
          toast.success("Billetera digital creada exitosamente!");
        } else if (tipo === "tarjetas") {
          await createTarjetaCatalogo(formData);
          toast.success("Marca de tarjeta creada exitosamente!");
        }
        return true;
      } catch (err) {
        const itemType = tipo === "bancos" ? "banco" : 
                        tipo === "billeteras" ? "billetera digital" : 
                        "marca de tarjeta";
        toast.error(`Error al crear ${itemType}`);
        console.error(err);
        return false;
      }
    },
    []
  );

  const updateCatalogItem = useCallback(
    async (formData: any, id: number, tipo: CatalogTabType) => {
      try {
        if (tipo === "bancos") {
          await updateBanco(formData, id);
          toast.success("Banco actualizado exitosamente!");
        } else if (tipo === "billeteras") {
          await updateBilleteraDigitalCatalogo(formData, id);
          toast.success("Billetera digital actualizada exitosamente!");
        } else if (tipo === "tarjetas") {
          await updateTarjetaCatalogo(formData, id);
          toast.success("Marca de tarjeta actualizada exitosamente!");
        }
        return true;
      } catch (err) {
        const itemType = tipo === "bancos" ? "banco" : 
                        tipo === "billeteras" ? "billetera digital" : 
                        "marca de tarjeta";
        toast.error(`Error al actualizar ${itemType}`);
        console.error(err);
        return false;
      }
    },
    []
  );

  const toggleCatalogItem = useCallback(
    async (item: any, tipo: CatalogTabType) => {
      if (!item.id) return false;

      try {
        let response;
        if (tipo === "bancos") {
          response = await toggleActiveBanco(item.id);
          toast.success(
            `Banco ${item.is_active ? "desactivado" : "activado"} exitosamente!`
          );
        } else if (tipo === "billeteras") {
          response = await toggleActiveBilleteraDigitalCatalogo(item.id);
          toast.success(
            `Billetera digital ${
              item.is_active ? "desactivada" : "activada"
            } exitosamente!`
          );
        } else if (tipo === "tarjetas") {
          response = await toggleActiveTarjetaCatalogo(item.id);
          toast.success(
            `Marca de tarjeta ${
              item.is_active ? "desactivada" : "activada"
            } exitosamente!`
          );
        }

        if (response?.affected_instances?.length > 0) {
          toast.info(
            `Se desactivaron ${response.affected_instances.length} instancia(s) asociada(s)`
          );
        }

        return true;
      } catch (err) {
        const itemType = tipo === "bancos" ? "banco" : 
                        tipo === "billeteras" ? "billetera digital" : 
                        "marca de tarjeta";
        toast.error(
          `Error al ${item.is_active ? "desactivar" : "activar"} ${itemType}`
        );
        console.error(err);
        return false;
      }
    },
    []
  );

  return {
    bancos,
    billeterasCatalogo,
    tarjetasCatalogo,
    loading,
    fetchCatalogos,
    createCatalogItem,
    updateCatalogItem,
    toggleCatalogItem,
  };
};
