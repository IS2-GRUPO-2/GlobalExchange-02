import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getMetodosFinancieros,
  createMetodoFinanciero,
  updateMetodoFinanciero,
  deactivateMetodoFinanciero,
} from "../services/metodoFinancieroService";
import type { MetodoFinanciero } from "../types/MetodoFinanciero";

export const useMetodosFinancieros = () => {
  const [metodos, setMetodos] = useState<MetodoFinanciero[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMetodos = useCallback(
    async (search: string = "", currentPage: number = 1) => {
      setLoading(true);
      try {
        const res = await getMetodosFinancieros({ page: currentPage, search });
        setMetodos(res.results);
        setTotalPages(Math.ceil(res.count / 10));
      } catch (err) {
        console.error("Error fetching métodos:", err);
        toast.error("Error al cargar métodos financieros");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createMetodo = useCallback(async (formData: any) => {
    try {
      await createMetodoFinanciero(formData);
      toast.success("Método financiero creado exitosamente!");
      return true;
    } catch (err) {
      toast.error("Error al crear método financiero");
      console.error(err);
      return false;
    }
  }, []);

  const updateMetodo = useCallback(async (formData: any, id: number) => {
    try {
      await updateMetodoFinanciero(formData, id);
      toast.success("Método financiero actualizado exitosamente!");
      return true;
    } catch (err) {
      toast.error("Error al actualizar método financiero");
      console.error(err);
      return false;
    }
  }, []);

  const toggleMetodo = useCallback(async (metodo: MetodoFinanciero) => {
    if (!metodo.id) return false;

    try {
      if (metodo.is_active) {
        await deactivateMetodoFinanciero(metodo.id);
        toast.success("Método financiero desactivado exitosamente!");
      } else {
        const updatedMetodo = { ...metodo, is_active: true };
        await updateMetodoFinanciero(updatedMetodo, metodo.id);
        toast.success("Método financiero activado exitosamente!");
      }
      return true;
    } catch (err) {
      toast.error(
        `Error al ${
          metodo.is_active ? "desactivar" : "activar"
        } método financiero`
      );
      console.error(err);
      return false;
    }
  }, []);

  return {
    metodos,
    loading,
    page,
    totalPages,
    setPage,
    fetchMetodos,
    createMetodo,
    updateMetodo,
    toggleMetodo,
  };
};
