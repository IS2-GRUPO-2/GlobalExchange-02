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
import { Bell, CircleUser, ChevronDown} from "lucide-react";
import Can from "./Can";
import { useAuth } from "../context/useAuth";
import logoWhite from "../assets/logo-white.svg";
import {
  SIMULACION,
} from "../types/perms";

const navigation = [
  { name: "Inicio", href: "/", current: true, permisos: [] },
  { name: "Simulación de Operaciones", href: "/simulacion-operacion", current: false, permisos: [SIMULACION.USE] },
  { name: "Iniciar sesión", href: "/login", current: false, permisos: [] },
  { name: "Registrarse", href: "/register", current: false, permisos: [] },
];

function classNames(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

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
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
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
              {/* 🔔 Notificaciones */}
              <button
                type="button"
                className="relative rounded-full p-1 text-gray-300 hover:text-white"
              >
                <Bell className="w-6 h-6" />
              </button>

              {/* Usuario + Nombre + Flechita */}
              <Menu as="div" className="relative">
                {({ open }) => (
                  <>
                    <MenuButton className="flex items-center space-x-2 rounded-full p-1.5 focus:outline-none transition-colors hover:bg-white/5 group">
                      <CircleUser className="w-6 h-6 text-gray-300 group-hover:text-white" />
                      <span className="hidden md:block text-sm font-medium text-gray-300 group-hover:text-white">
                        {user?.first_name || user?.username || "Usuario"}
                      </span>
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-300 group-hover:text-white transition-transform duration-200 ${open ? 'rotate-180' : ''}`} 
                      />
                    </MenuButton>
                    
                    <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-zinc-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <MenuItem>
                        <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
                          Cuenta
                        </a>
                      </MenuItem>
                      <MenuItem>
                        <a href="/configuraciones" className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
                          Configuraciones
                        </a>
                      </MenuItem>
                      <MenuItem>
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                        >
                          Cerrar sesión
                        </button>
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
