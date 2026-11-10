import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, Shield, Sparkles, UserCheck } from 'lucide-react';

export default function ModalLogin({ abierto, alCerrar }) {
  const { login, registro, loginDemo } = useAuth();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [ci, setCi] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!abierto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      if (modo === 'login') {
        await login(correo, contrasena);
      } else {
        await registro({
          nombres,
          apellidos,
          ci,
          correo,
          telefono,
          contrasena,
        });
      }
      alCerrar();
    } catch (err) {
      setError(err.message || 'Error en autenticación');
    } finally {
      setCargando(false);
    }
  };

  const manejarDemo = async (rol) => {
    setError('');
    setCargando(true);
    try {
      await loginDemo(rol);
      alCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Cabecera con degradado teatral */}
        <div className="p-6 bg-gradient-to-r from-teatro-900 via-teatro-800 to-slate-900 border-b border-slate-700/50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold font-theater text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-oro-400" />
              {modo === 'login' ? 'Bienvenido a Érase una Vez' : 'Crear Cuenta de Comprador'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {modo === 'login'
                ? 'Ingresa tus credenciales para continuar'
                : 'Regístrate para comprar boletos e inscribirte a cursos'}
            </p>
          </div>
          <button
            onClick={alCerrar}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Acceso Rápido de Prueba (Demo Roles) */}
        <div className="p-4 bg-slate-800/60 border-b border-slate-700/40">
          <p className="text-xs font-semibold text-oro-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Acceso Rápido de Demostración:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => manejarDemo('ADMINISTRADOR')}
              disabled={cargando}
              className="py-1.5 px-2 bg-teatro-800/80 hover:bg-teatro-700 text-white rounded-lg text-xs font-medium border border-teatro-600/40 transition text-center"
            >
              👑 Administrador
            </button>
            <button
              onClick={() => manejarDemo('RECEPCION')}
              disabled={cargando}
              className="py-1.5 px-2 bg-indigo-900/80 hover:bg-indigo-800 text-white rounded-lg text-xs font-medium border border-indigo-600/40 transition text-center"
            >
              📱 Recepción / QR
            </button>
            <button
              onClick={() => manejarDemo('COMPRADOR')}
              disabled={cargando}
              className="py-1.5 px-2 bg-emerald-900/80 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium border border-emerald-600/40 transition text-center"
            >
              🎟️ Compradora
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-lg">
              {error}
            </div>
          )}

          {modo === 'registro' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                  placeholder="Ej. Ana"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                  placeholder="Ej. Quispe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico *</label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
              placeholder="nombre@ejemplo.com"
            />
          </div>

          {modo === 'registro' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">C.I.</label>
                <input
                  type="text"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                  placeholder="Ej. 6543210 LP"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                  placeholder="Ej. 70000000"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Contraseña {modo === 'registro' ? '(Mínimo 8 caracteres)' : ''} *
            </label>
            <input
              type="password"
              required
              minLength={modo === 'registro' ? 8 : 1}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-semibold rounded-lg shadow-lg shadow-teatro-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cargando ? (
              <span className="text-sm">Procesando...</span>
            ) : modo === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> Iniciar Sesión
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Crear Cuenta
              </>
            )}
          </button>
        </form>

        {/* Alternar modo */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 text-center text-xs text-slate-400">
          {modo === 'login' ? (
            <p>
              ¿No tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setModo('registro');
                }}
                className="text-oro-400 hover:underline font-semibold"
              >
                Regístrate aquí
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setModo('login');
                }}
                className="text-oro-400 hover:underline font-semibold"
              >
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
