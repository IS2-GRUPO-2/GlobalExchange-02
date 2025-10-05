/**
 * @fileoverview Componente de navegación principal de la aplicación
 */

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { CircleUser, ChevronDown, User2, LogOut, Settings, History } from "lucide-react";
import Can from "./Can";
import { useAuth } from "../context/useAuth";
import logoWhite from "../assets/logo-white.svg";
import { OPERACION } from "../types/perms";
import ClientPicker from "./ClientPicker";

/** Configuración de elementos de navegación */
const navigation = [
  { name: "Inicio", href: "/", current: true, permisos: [] },
  {
    name: "Operaciones",
    href: "/operaciones",
    current: false,
    permisos: [OPERACION.USE],
  },
  { name: "Iniciar sesión", href: "/login", current: false, permisos: [] },
  { name: "Registrarse", href: "/register", current: false, permisos: [] },
];

/**
 * Función utilitaria para combinar clases CSS condicionalmente
 * @function classNames
 * @param {...(string|undefined|false|null)} classes - Clases CSS a combinar
 * @returns {string} String con las clases válidas unidas
 */
function classNames(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Componente de barra de navegación principal
 * @component Navbar
 * @returns {JSX.Element} Barra de navegación responsiva
 *
 * @description
 * - Barra de navegación responsiva con menú desplegable en móviles
 * - Maneja navegación entre páginas según permisos del usuario
 * - Muestra menú de usuario autenticado con opciones de cuenta
 * - Incluye notificaciones y opción de cerrar sesión
 * - Filtra elementos de navegación según estado de autenticación
 * - Responsive: menú hamburguesa en móviles, horizontal en desktop
 *
 * @features
 * - Logo de la aplicación
 * - Enlaces de navegación con control de permisos
 * - Menú desplegable de usuario (cuenta, configuraciones, logout)
 * - Botón de notificaciones
 * - Menú móvil responsivo
 *
 * @example
 * // Se usa automáticamente en App.tsx cuando no se debe ocultar
 * {!hideNavbar && <Navbar />}
 */
export default function Navbar() {
  const { logout, isLoggedIn, user } = useAuth();

  const filteredNavigation = navigation.filter((item) => {
    if (
      isLoggedIn() &&
      (item.name === "Iniciar sesión" || item.name === "Registrarse")
    ) {
      return false;
    }
    return true;
  });

  return (
    <Disclosure
      as="nav"
      className="relative bg-zinc-900 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex min-h-16 items-center justify-between py-2">
          {/* Botón menú mobile */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white">
              <Bars3Icon
                aria-hidden="true"
                className="block size-6 group-data-open:hidden"
              />
              <XMarkIcon
                aria-hidden="true"
                className="hidden size-6 group-data-open:block"
              />
            </DisclosureButton>
          </div>

          {/* Logo + Links */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <a href="/" className="flex shrink-0 items-center">
              <img
                alt="Logo"
                src={logoWhite}
                className="h-20 w-auto sm:h-12 md:h-14"
              />
            </a>
            <div className="hidden sm:ml-6 sm:block self-center">
              <div className="flex space-x-4">
                {filteredNavigation.map((item) => (
                  <Can key={item.name} anyOf={item.permisos}>
                    <a
                      href={item.href}
                      aria-current={item.current ? "page" : undefined}
                      className={classNames(
                        item.current
                          ? "bg-gray-950/50 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white",
                        "rounded-md px-3 py-2 text-sm font-medium"
                      )}
                    >
                      {item.name}
                    </a>
                  </Can>
                ))}
              </div>
            </div>
          </div>

          {/* Dropdown usuario */}
          {isLoggedIn() && (
            <div className="absolute inset-y-0 right-0 flex items-center space-x-3 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              
              {/* Selector de cliente */}
              {user?.id && <ClientPicker userId={user.id} className="w-56" />}

              {/* Usuario + Nombre + Flechita */}
              <Menu as="div" className="relative">
                {({ open }) => (
                  <>
                    <MenuButton className="flex items-center space-x-2 rounded-full p-1.5 focus:outline-none transition-colors hover:bg-white/5 group">
                      <CircleUser className="w-6 h-6 text-gray-300 group-hover:text-white" />
                      <span className="hidden md:block text-sm font-medium text-gray-300 group-hover:text-white">
                        {user?.username || "Usuario"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-300 group-hover:text-white transition-transform duration-200 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </MenuButton>

                    <MenuItems className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-zinc-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {/* Info usuario */}
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <div className="flex items-center space-x-3">
                          <CircleUser className="w-8 h-8 text-gray-300" />
                          <div>
                            <div className="font-semibold text-white text-sm">{user?.first_name} {user?.last_name}</div>
                            <div className="text-xs text-gray-400">{user?.email}</div>
                          </div>
                        </div>
                      </div>

                      {/* Mi perfil */}
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href="/perfil-usuario"
                            className={`flex items-center px-4 py-2 text-sm w-full gap-2 ${active ? "bg-white/5 text-white" : "text-gray-300"}`}
                          >
                            <User2 className="w-4 h-4" />
                            Mi perfil
                          </a>
                        )}
                      </MenuItem>
                      <div className="my-1 border-t border-zinc-800" />

                      {/* Grupo: Historial y Configuración */}
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href="/historial-transacciones"
                            className={`flex items-center px-4 py-2 text-sm w-full gap-2 ${active ? "bg-white/5 text-white" : "text-gray-300"}`}
                          >
                            <History className="w-4 h-4" />
                            Historial de transacciones
                          </a>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <a
                            href="/configuraciones"
                            className={`flex items-center px-4 py-2 text-sm w-full gap-2 ${active ? "bg-white/5 text-white" : "text-gray-300"}`}
                          >
                            <Settings className="w-4 h-4" />
                            Configuraciones
                          </a>
                        )}
                      </MenuItem>
                      <div className="my-1 border-t border-zinc-800" />

                      {/* Logout */}
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`flex items-center px-4 py-2 text-sm w-full gap-2 text-left ${active ? "bg-white/5 text-white" : "text-gray-300"}`}
                          >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </>
                )}
              </Menu>
            </div>
          )}
        </div>
      </div>

      {/* 📱 Menú móvil */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {filteredNavigation.map((item) => (
            <Can key={item.name} anyOf={item.permisos}>
              <DisclosureButton
                as="a"
                href={item.href}
                aria-current={item.current ? "page" : undefined}
                className={classNames(
                  item.current
                    ? "bg-gray-950/50 text-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white",
                  "block rounded-md px-3 py-2 text-base font-medium"
                )}
              >
                {item.name}
              </DisclosureButton>
            </Can>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
