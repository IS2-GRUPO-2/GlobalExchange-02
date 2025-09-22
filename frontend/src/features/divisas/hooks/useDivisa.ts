import { useCallback, useState } from "react";
import type { Divisa } from "../../../types/Divisa";
import {
  createDivisa,
  deactivateDivisa,
  getDivisas,
  updateDivisa,
} from "../../../services/divisaService";
import { toast } from "react-toastify";
import type { DivisaFormData } from "../components/DivisaForm";

export const useDivisa = () => {
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDivisas = useCallback(
    async (search: string = "", currentPage: number = 1) => {
      setLoading(true);
      try {
        const res = await getDivisas({ search, page: currentPage });
        setDivisas(res.results);
        setTotalPages(Math.ceil(res.count / 10));
      } catch (err) {
        toast.error("Error al cargar clientes!");
        setErr(String(err));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createDivisaHook = useCallback(async (divisaData: DivisaFormData) => {
    let divisa: Divisa = {
      nombre: divisaData.nombre,
      codigo: divisaData.codigo,
      simbolo: divisaData.simbolo,
      max_digitos: divisaData.max_digitos,
      precision: divisaData.precision,
      is_active: true,
      es_base: divisaData.es_base ?? false,
    };

    try {
      const res = await createDivisa(divisa);
      if (res.status === 201) {
        toast.success("Divisa creada con éxito!");
        setPage(1);
        fetchDivisas();
        return true;
      }
    } catch (err) {
      toast.error("Ha ocurrido un error al crear la divisa.");
      setErr(String(err));
      return false;
    }
  }, []);

  const updateDivisaHook = useCallback(
    async (divisaData: DivisaFormData, selectedDivisa: Divisa) => {
      let divisa: Divisa = {
        nombre: divisaData.nombre,
        codigo: divisaData.codigo,
        simbolo: divisaData.simbolo,
        max_digitos: divisaData.max_digitos,
        precision: divisaData.precision,
        is_active: selectedDivisa.is_active,
      };

      try {
        const res = await updateDivisa(divisa, selectedDivisa.id!);
        if (res.status === 200) {
          toast.success("Divisa actualizada con éxito!");
          fetchDivisas();
          return true;
        }
      } catch (err) {
        toast.error("Ha ocurrido un error al actualizar la divisa.");
        setErr(String(err));
        return false;
      }
    },
    []
  );

  const toggleDivisa = useCallback(async (divisa: Divisa) => {
    if (!divisa.id) return false;

    try {
      if (divisa.is_active) {
        await deactivateDivisa(divisa.id);
        toast.success("¡Divisa desactivada con éxito!");
      } else {
        const active_divisa = { ...divisa, is_active: true };
        await updateDivisa(active_divisa, divisa.id);
        toast.success("¡Divisa activada con éxito!");
      }
      return true;
    } catch (err) {
      toast.error("Error al actualizar la divisa.");
      setErr(String(err));
      return false;
    }
  }, []);

  return {
    divisas,
    setDivisas,
    loading,
    setLoading,
    page,
    setPage,
    totalPages,
    fetchDivisas,
    createDivisaHook,
    updateDivisaHook,
    toggleDivisa,
    err,
  };
};
