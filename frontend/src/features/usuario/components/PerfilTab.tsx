import React from "react";
import { Key, Pencil } from "lucide-react";

const PerfilTab: React.FC<{
    user: any;
    setIsEditing: (v: boolean) => void;
}> = ({ user, setIsEditing }) => {
    const ProfileSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>
            {children}
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <ProfileSection title="Información personal">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name + ' ' + user.last_name)}&background=0D8ABC&color=fff`}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 shadow-lg"
                            />
                            <button
                                className="absolute bottom-0 right-0 p-2 bg-gray-900 rounded-full text-white hover:bg-gray-800 transition-colors"
                                aria-label="Editar foto de perfil"
                            >
                                <Pencil size={16} />
                            </button>
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-gray-500"> ID: {user.id}</p>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="text-sm text-gray-500 font-medium">Email</label>
                            <p className="text-gray-900 mt-1">{user.email}</p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="text-sm text-gray-500 font-medium">Cuenta Creada</label>
                            <p className="text-gray-900 mt-1">{new Date(user.date_joined).toDateString()}</p>
                        </div>
                    </div>
                </ProfileSection>
                {/* TO-DO: Botones para editar perfil y cambiar contraseña, llamar a componentes y llamar a services */}
                <div className="space-y-4">
                    <button className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium">
                        <Pencil size={18} /> Editar Perfil
                    </button>
                    <button className="w-full py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium">
                        <Key size={18} />Cambiar Contraseña
                    </button>
                </div>
            </div>

            <div className="lg:col-span-2">
                <ProfileSection title="Detalles del usuario">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-500 font-medium">Username</label>
                            <p className="text-gray-900 mt-1">{user.username}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500 font-medium">Activo</label>
                            <div className="mt-1">
                                {user.is_active ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        Sí
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-900">
                                        No
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-500 font-medium">Roles</label>
                            <ul className="mt-1 text-gray-900 text-sm list-disc list-inside">
                                {user.id}
                            </ul>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500 font-medium">Permisos</label>
                            <ul className="mt-1 text-gray-900 text-sm list-disc list-inside max-h-32 overflow-y-auto">
                                {user.permissions && user.permissions.length > 0 ? (
                                    user.permissions.map((perm: string, idx: number) => (
                                        <li key={idx}>{perm}</li>
                                    ))
                                ) : (
                                    <li className="text-gray-400">Sin permisos</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </ProfileSection>
            </div>
        </div>
    );
};

export default PerfilTab;
