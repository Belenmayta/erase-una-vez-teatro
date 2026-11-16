import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Ticket,
  Calendar,
  GraduationCap,
  ScanLine,
  LayoutDashboard,
  LogOut,
  LogIn,
  User,
  Menu,
  X,
  
} from 'lucide-react';

export default function Navbar({ alAbrirLogin, paginaActual, alCambiarPagina }) {
  const { usuario, logout, esAdmin, esDocente, esRecepcion, esComprador } = useAuth();
  const [menuMovil, setMenuMovil] = useState(false);

  const irA = (pagina) => {
    alCambiarPagina(pagina);
    setMenuMovil(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo y Nombre */}
          <div
            onClick={() => irA('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform bg-slate-900 border border-slate-800">
              <img 
                src="https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/logo-erase-una-vez.jpg.jpg" 
                alt="Érase una vez Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <span className="text-xl font-bold font-theater text-white tracking-wide block leading-none">
                Érase una Vez
              </span>
              <span className="text-[11px] text-oro-400 uppercase tracking-widest font-medium">
                Compañía de Teatro • La Paz
              </span>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => irA('cartelera')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                paginaActual === 'cartelera'
                  ? 'bg-teatro-900/60 text-teatro-300 border border-teatro-700/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-oro-400" /> Cartelera
            </button>

            <button
              onClick={() => irA('cursos')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                paginaActual === 'cursos'
                  ? 'bg-teatro-900/60 text-teatro-300 border border-teatro-700/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-oro-400" /> Cursos & Talleres
            </button>

            <button
              onClick={() => irA('nosotros')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                paginaActual === 'nosotros'
                  ? 'bg-teatro-900/60 text-teatro-300 border border-teatro-700/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Nosotros
            </button>

            {/* Links según rol */}
            {esComprador && (
              <button
                onClick={() => irA('mis-boletos')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  paginaActual === 'mis-boletos'
                    ? 'bg-teatro-900/60 text-teatro-300 border border-teatro-700/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Ticket className="w-4 h-4 text-oro-400" /> Mis Boletos
              </button>
            )}

            {(esAdmin || esDocente) && (
              <button
                onClick={() => irA('mis-estudiantes')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  paginaActual === 'mis-estudiantes'
                    ? 'bg-teatro-900/60 text-teatro-300 border border-teatro-700/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-oro-400" /> Estudiantes
              </button>
            )}

            {(esRecepcion || esAdmin) && (
              <button
                onClick={() => irA('escaner')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  paginaActual === 'escaner'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-indigo-950/80 text-indigo-300 hover:bg-indigo-900 border border-indigo-700/50'
                }`}
              >
                <ScanLine className="w-4 h-4 text-indigo-400" /> Escáner Puerta
              </button>
            )}

            {esAdmin && (
              <button
                onClick={() => irA('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  paginaActual === 'admin'
                    ? 'bg-teatro-700 text-white shadow-lg shadow-teatro-800/40'
                    : 'bg-teatro-950/80 text-teatro-200 hover:bg-teatro-900 border border-teatro-700/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-oro-400" /> Panel Admin
              </button>
            )}
          </nav>

          {/* Botón de Usuario o Login */}
          <div className="hidden md:flex items-center gap-3">
            {usuario ? (
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/60 py-1.5 px-3 rounded-xl">
                <div className="text-right">
                  <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                    <User className="w-3.5 h-3.5 text-oro-400" />
                    {usuario.nombres} {usuario.apellidos}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      esAdmin
                        ? 'bg-teatro-900 text-teatro-200 border border-teatro-700'
                        : esRecepcion
                        ? 'bg-indigo-950 text-indigo-200 border border-indigo-700'
                        : 'bg-emerald-950 text-emerald-200 border border-emerald-700'
                    }`}
                  >
                    {usuario.rol}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={alAbrirLogin}
                className="py-2.5 px-5 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-teatro-900/40 transition flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Ingresar
              </button>
            )}
          </div>

          {/* Menú Móvil Botón */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMenuMovil(!menuMovil)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {menuMovil ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {menuMovil && (
        <div className="md:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
          <button
            onClick={() => irA('cartelera')}
            className="w-full text-left py-2.5 px-3 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-oro-400" /> Cartelera
          </button>
          <button
            onClick={() => irA('cursos')}
            className="w-full text-left py-2.5 px-3 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-oro-400" /> Cursos & Talleres
          </button>
          <button
            onClick={() => irA('nosotros')}
            className="w-full text-left py-2.5 px-3 rounded-lg text-slate-200 hover:bg-slate-800"
          >
            Nosotros
          </button>

          {esComprador && (
            <button
              onClick={() => irA('mis-boletos')}
              className="w-full text-left py-2.5 px-3 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center gap-2"
            >
              <Ticket className="w-4 h-4 text-oro-400" /> Mis Boletos
            </button>
          )}

          {(esAdmin || esDocente) && (
            <button
              onClick={() => irA('mis-estudiantes')}
              className="w-full text-left py-2.5 px-3 rounded-lg text-slate-200 hover:bg-slate-800 flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-oro-400" /> Estudiantes
            </button>
          )}

          {(esRecepcion || esAdmin) && (
            <button
              onClick={() => irA('escaner')}
              className="w-full text-left py-2.5 px-3 rounded-lg bg-indigo-900/70 text-indigo-200 flex items-center gap-2 font-semibold"
            >
              <ScanLine className="w-4 h-4" /> Escáner Puerta
            </button>
          )}

          {esAdmin && (
            <button
              onClick={() => irA('admin')}
              className="w-full text-left py-2.5 px-3 rounded-lg bg-teatro-800/80 text-white flex items-center gap-2 font-semibold"
            >
              <LayoutDashboard className="w-4 h-4 text-oro-400" /> Panel Admin
            </button>
          )}

          <div className="pt-4 border-t border-slate-800">
            {usuario ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {usuario.nombres} {usuario.apellidos}
                  </div>
                  <div className="text-xs text-oro-400">{usuario.rol}</div>
                </div>
                <button
                  onClick={logout}
                  className="py-1.5 px-3 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-xs"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  alAbrirLogin();
                  setMenuMovil(false);
                }}
                className="w-full py-2.5 bg-teatro-700 text-white font-semibold rounded-lg text-center"
              >
                Iniciar Sesión / Registro
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
