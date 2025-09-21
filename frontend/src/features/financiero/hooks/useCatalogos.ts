import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getBancos,
  getBilleterasDigitalesCatalogo,
  createBanco,
  createBilleteraDigitalCatalogo,
  updateBanco,
  updateBilleteraDigitalCatalogo,
  toggleActiveBanco,
  toggleActiveBilleteraDigitalCatalogo,
} from "../services/metodoFinancieroService";
import type {
  Banco,
  BilleteraDigitalCatalogo,
  CatalogTabType,
} from "../types/MetodoFinanciero";

export const useCatalogos = () => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [billeterasCatalogo, setBilleterasCatalogo] = useState<
    BilleteraDigitalCatalogo[]
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchCatalogos = useCallback(async (search: string = "") => {
    setLoading(true);
    try {
      const [bancosRes, billeterasRes] = await Promise.all([
        getBancos({ search }),
        getBilleterasDigitalesCatalogo({ search }),
      ]);

      setBancos(bancosRes.results);
      setBilleterasCatalogo(billeterasRes.results);
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
        } else {
          await createBilleteraDigitalCatalogo(formData);
          toast.success("Billetera digital creada exitosamente!");
        }
        return true;
      } catch (err) {
        toast.error(
          `Error al crear ${tipo === "bancos" ? "banco" : "billetera digital"}`
        );
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
        } else {
          await updateBilleteraDigitalCatalogo(formData, id);
          toast.success("Billetera digital actualizada exitosamente!");
        }
        return true;
      } catch (err) {
        toast.error(
          `Error al actualizar ${
            tipo === "bancos" ? "banco" : "billetera digital"
          }`
        );
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
        } else {
          response = await toggleActiveBilleteraDigitalCatalogo(item.id);
          toast.success(
            `Billetera digital ${
              item.is_active ? "desactivada" : "activada"
            } exitosamente!`
          );
        }

        if (response.affected_instances?.length > 0) {
          toast.info(
            `Se desactivaron ${response.affected_instances.length} instancia(s) asociada(s)`
          );
        }

        return true;
      } catch (err) {
        toast.error(
          `Error al ${item.is_active ? "desactivar" : "activar"} ${
            tipo === "bancos" ? "banco" : "billetera digital"
          }`
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
    loading,
    fetchCatalogos,
    createCatalogItem,
    updateCatalogItem,
    toggleCatalogItem,
  };
};
