import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Tauser } from "../types/Tauser";

interface FormTauser {
  id?: string;
  codigo: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  latitud: number;
  longitud: number;
  is_active?: boolean;
}

interface Props {
  tauser: Tauser | null;
  isEditForm: boolean;
  onSubmit: (data: FormTauser) => void;
  onCancel: () => void;
}

// esquema de validación
const schema = yup.object().shape({
  codigo: yup.string().required("El código es obligatorio."),
  nombre: yup.string().required("El nombre es obligatorio."),
  direccion: yup.string().required("La dirección es obligatoria."),
  ciudad: yup.string().required("La ciudad es obligatoria."),
  departamento: yup.string().required("El departamento es obligatorio."),
  latitud: yup
    .number()
    .typeError("La latitud debe ser un número.")
    .required("La latitud es obligatoria.")
    .min(-90, "La latitud no puede ser menor que -90.")
    .max(90, "La latitud no puede ser mayor que 90."),
  longitud: yup
    .number()
    .typeError("La longitud debe ser un número.")
    .required("La longitud es obligatoria.")
    .min(-180, "La longitud no puede ser menor que -180.")
    .max(180, "La longitud no puede ser mayor que 180."),
});

// Icono para el marcador
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapSelector = ({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) => {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onChange(lat, lng);
    },
  });

  return <Marker {...({ position, icon: markerIcon } as any)} />;
};

const TauserForm = ({ tauser, isEditForm, onSubmit, onCancel }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormTauser>({
    resolver: yupResolver(schema),
    defaultValues: isEditForm
      ? {
          id: tauser?.id,
          codigo: tauser?.codigo,
          nombre: tauser?.nombre,
          direccion: tauser?.direccion,
          ciudad: tauser?.ciudad,
          departamento: tauser?.departamento,
          latitud: tauser?.latitud,
          longitud: tauser?.longitud,
          is_active: tauser?.is_active,
        }
      : {
          codigo: "",
          nombre: "",
          direccion: "",
          ciudad: "",
          departamento: "",
          latitud: -25.263739, // valor inicial (ejemplo: Asunción)
          longitud: -57.575926,
          is_active: true,
        },
  });

  const onFormSubmit = async (data: FormTauser) => {
    try {
      onSubmit(data);
      reset();
    } catch {
      toast.error(
        isEditForm ? "Error al editar el Tauser" : "Error al crear el Tauser"
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          {isEditForm ? "Editar Tauser" : "Crear Tauser"}
        </h2>
      </div>

      {/* Contenedor principal con scroll */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Primera fila: Código y Nombre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Código *
                </label>
                <input
                  type="text"
                  {...register("codigo")}
                  disabled={isEditForm}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.codigo ? "border-red-500" : "border-gray-300"
                  } ${isEditForm ? "bg-gray-100 text-gray-500" : ""}`}
                  placeholder="Código único del Tauser"
                />
                {errors.codigo && (
                  <p className="text-sm text-red-600">{errors.codigo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  {...register("nombre")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.nombre ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nombre del Tauser"
                />
                {errors.nombre && (
                  <p className="text-sm text-red-600">{errors.nombre.message}</p>
                )}
              </div>
            </div>

            {/* Segunda fila: Dirección */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Dirección *
              </label>
              <textarea
                {...register("direccion")}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                  errors.direccion ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Dirección física del Tauser"
              />
              {errors.direccion && (
                <p className="text-sm text-red-600">
                  {errors.direccion.message}
                </p>
              )}
            </div>

            {/* Tercera fila: Ciudad y Departamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ciudad *
                </label>
                <input
                  type="text"
                  {...register("ciudad")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.ciudad ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ejemplo: Asunción"
                />
                {errors.ciudad && (
                  <p className="text-sm text-red-600">{errors.ciudad.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Departamento *
                </label>
                <input
                  type="text"
                  {...register("departamento")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.departamento ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ejemplo: Central"
                />
                {errors.departamento && (
                  <p className="text-sm text-red-600">
                    {errors.departamento.message}
                  </p>
                )}
              </div>
            </div>

            {/* Cuarta fila: Coordenadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Latitud *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  {...register("latitud")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.latitud ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="-25.263739"
                />
                {errors.latitud && (
                  <p className="text-sm text-red-600">
                    {errors.latitud.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Longitud *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  {...register("longitud")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.longitud ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="-57.575926"
                />
                {errors.longitud && (
                  <p className="text-sm text-red-600">
                    {errors.longitud.message}
                  </p>
                )}
              </div>
            </div>

            {/* Quinta fila: Mapa */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ubicación en el mapa (click para seleccionar)
              </label>
              <div className="w-full h-64 border border-gray-300 rounded-md overflow-hidden">
                <MapContainer
                  {...({
                    center: [
                      tauser?.latitud || -25.263739,
                      tauser?.longitud || -57.575926,
                    ] as [number, number],
                    zoom: 13,
                    className: "h-full w-full",
                    scrollWheelZoom: true
                  } as any)}
                >
                  <TileLayer
                    {...({
                      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
                      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    } as any)}
                  />
                  <MapSelector
                    lat={tauser?.latitud || -25.263739}
                    lng={tauser?.longitud || -57.575926}
                    onChange={(lat, lng) => {
                      setValue("latitud", Number(lat.toFixed(6)));
                      setValue("longitud", Number(lng.toFixed(6)));
                    }}
                  />
                </MapContainer>
              </div>
            </div>
          </form>
        </div>

        {/* Footer con botones fijos */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit(onFormSubmit)}
              className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Guardando..."
                : isEditForm
                ? "Actualizar Tauser"
                : "Crear Tauser"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TauserForm;