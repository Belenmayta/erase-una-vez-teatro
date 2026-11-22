import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  X,
  LogIn,
  UserPlus,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MailCheck,
  KeyRound,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

export default function ModalLogin({ abierto, alCerrar }) {
  const { login, confirmarMfa, registro } = useAuth();

  // modo: 'login' | 'mfa' | 'registro' | 'verificar_registro'
  const [modo, setModo] = useState('login');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [ci, setCi] = useState('');
  const [telefono, setTelefono] = useState('');

  // Estados de verificación de correo (DNS MX API)
  const [verificandoCorreo, setVerificandoCorreo] = useState(false);
  const [estadoCorreo, setEstadoCorreo] = useState(null); // { valido: bool, mensaje: string, servidor_mx: string }

  // Estados de MFA (Login en 2 pasos) y Verificación de Registro (OTP 6 dígitos)
  const [mfaToken, setMfaToken] = useState('');
  const [codigoMfa, setCodigoMfa] = useState('');
  const [codigoMfaDemo, setCodigoMfaDemo] = useState('');
  const [usuarioPreMfa, setUsuarioPreMfa] = useState(null);

  const [codigoRegistro, setCodigoRegistro] = useState('');
  const [codigoRegistroDemo, setCodigoRegistroDemo] = useState('');

  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!abierto) return null;

  const limpiarMensajes = () => {
    setError('');
    setMensajeExito('');
  };

  // Validación estricta de parámetros en el cliente antes de enviar
  const validarParametrosRegistro = () => {
    const regexLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
    if (!nombres.trim() || nombres.trim().length < 2 || !regexLetras.test(nombres.trim())) {
      return 'El campo Nombres solo debe contener letras y espacios (mínimo 2 caracteres, sin números ni símbolos).';
    }
    if (!apellidos.trim() || apellidos.trim().length < 2 || !regexLetras.test(apellidos.trim())) {
      return 'El campo Apellidos solo debe contener letras y espacios (mínimo 2 caracteres, sin números ni símbolos).';
    }
    if (!ci.trim() || !/^\d{5,10}(?:-[0-9A-Za-z]{1,2})?(?:\s?(?:LP|CB|SC|OR|PT|TJ|CH|BE|PD))?$/i.test(ci.trim())) {
      return 'Ingrese un C.I. válido (5 a 10 dígitos numéricos, ej. 6543210 o 6543210 LP).';
    }
    if (!telefono.trim()) {
      return 'El número de celular / WhatsApp es obligatorio.';
    }
    const telDigitos = telefono.replace(/[\s\-()]/g, '').replace(/^\+?591/, '');
    if (!/^[67]\d{7}$/.test(telDigitos)) {
      return 'El teléfono debe ser un número celular válido de Bolivia (8 dígitos comenzando con 6 o 7).';
    }
    if (!contrasena || contrasena.length < 8 || !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
      return 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.';
    }
    return null;
  };

  // Verificar en vivo mediante API DNS MX que el correo realmente exista
  const handleVerificarCorreoExistente = async (correoEvaluar = correo) => {
    const limpio = String(correoEvaluar || '').trim().toLowerCase();
    if (!limpio || !limpio.includes('@')) {
      setEstadoCorreo({
        valido: false,
        mensaje: 'Ingresa un correo electrónico con formato nombre@dominio.com',
      });
      return false;
    }

    setVerificandoCorreo(true);
    setEstadoCorreo(null);
    try {
      const res = await api.verificarCorreo(limpio, modo === 'registro');
      setEstadoCorreo({
        valido: true,
        mensaje: res.mensaje || 'Correo verificado: el dominio existe y recibe correos.',
        servidor_mx: res.servidor_mx,
      });
      return true;
    } catch (err) {
      setEstadoCorreo({
        valido: false,
        mensaje: err.message || 'El dominio del correo no existe o no es válido.',
      });
      return false;
    } finally {
      setVerificandoCorreo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    // 1. FLUJO DE LOGIN (PASO 1 -> SOLICITAR MFA)
    if (modo === 'login') {
      setCargando(true);
      try {
        const res = await login(correo.trim(), contrasena);
        if (res?.requiere_mfa) {
          setMfaToken(res.mfa_token);
          setCodigoMfaDemo(res.codigo_mfa_demo || '');
          setUsuarioPreMfa(res.usuario_pre || null);
          setCodigoMfa('');
          setModo('mfa');
          setMensajeExito(
            res.mensaje || 'Se generó un código MFA de 6 dígitos para verificar tu identidad.'
          );
        } else {
          alCerrar();
        }
      } catch (err) {
        setError(err.message || 'Credenciales incorrectas');
      } finally {
        setCargando(false);
      }
      return;
    }

    // 2. FLUJO DE VERIFICACIÓN MFA (PASO 2 DE LOGIN)
    if (modo === 'mfa') {
      if (!codigoMfa || codigoMfa.trim().length !== 6) {
        setError('Ingresa el código de seguridad MFA de 6 dígitos.');
        return;
      }
      setCargando(true);
      try {
        await confirmarMfa(mfaToken, codigoMfa.trim());
        alCerrar();
      } catch (err) {
        setError(err.message || 'Código MFA incorrecto o expirado');
      } finally {
        setCargando(false);
      }
      return;
    }

    // 3. FLUJO DE CREAR CUENTA (PASO 1 -> VALIDAR PARÁMETROS, VERIFICAR CORREO MX Y ENVIAR CÓDIGO)
    if (modo === 'registro') {
      const errorValidacion = validarParametrosRegistro();
      if (errorValidacion) {
        setError(errorValidacion);
        return;
      }

      setCargando(true);
      try {
        const correoOk = await handleVerificarCorreoExistente(correo);
        if (!correoOk) {
          setError('Por favor ingresa un correo electrónico real y activo antes de continuar.');
          setCargando(false);
          return;
        }

        const res = await api.solicitarCodigoRegistro({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          ci: ci.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim(),
          contrasena,
        });

        setCodigoRegistroDemo(res.codigo_verificacion_demo || '');
        setCodigoRegistro('');
        setModo('verificar_registro');
        setMensajeExito(
          res.mensaje ||
            'Correo verificado por DNS MX. Ingresa el código de 6 dígitos para activar tu cuenta.'
        );
      } catch (err) {
        setError(err.message || 'Error al verificar los datos de registro');
      } finally {
        setCargando(false);
      }
      return;
    }

    // 4. FLUJO DE CONFIRMACIÓN DE CREACIÓN DE CUENTA (PASO 2 -> VALIDAR CÓDIGO 6 DÍGITOS)
    if (modo === 'verificar_registro') {
      if (!codigoRegistro || codigoRegistro.trim().length !== 6) {
        setError('Debes ingresar el código de verificación de 6 dígitos.');
        return;
      }
      setCargando(true);
      try {
        await registro({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          ci: ci.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim(),
          contrasena,
          codigo_verificacion: codigoRegistro.trim(),
        });
        alCerrar();
      } catch (err) {
        setError(err.message || 'Código de verificación inválido');
      } finally {
        setCargando(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[94vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="p-6 bg-gradient-to-r from-teatro-900 via-teatro-800 to-slate-900 border-b border-slate-700/50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold font-theater text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-oro-400" />
              {modo === 'login' && 'Acceso Seguro — Érase una Vez'}
              {modo === 'mfa' && 'Verificación Multifactor (MFA)'}
              {modo === 'registro' && 'Crear Cuenta Verificada'}
              {modo === 'verificar_registro' && 'Paso 2: Confirmar Correo'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {modo === 'login' && 'Ingresa tus credenciales institucionales o de comprador'}
              {modo === 'mfa' && 'Autenticación en dos pasos para proteger tu cuenta'}
              {modo === 'registro' && 'Validación estricta de identidad y existencia real de correo'}
              {modo === 'verificar_registro' && 'Ingresa el código de 6 dígitos para activar tu cuenta'}
            </p>
          </div>
          <button
            onClick={alCerrar}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cinta de seguridad MFA & DNS MX */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            Protección MFA 2FA Activa
          </span>
          <span className="flex items-center gap-1 text-oro-400">
            <MailCheck className="w-3.5 h-3.5" />
            Verificación DNS MX de Correo
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mensajeExito && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {/* VISTA PASO 2 DE LOGIN: MFA (CÓDIGO DE 6 DÍGITOS) */}
          {modo === 'mfa' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/80 border border-oro-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-oro-400 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    Segundo Factor de Autenticación (MFA)
                  </span>
                  {usuarioPreMfa?.rol && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teatro-900 text-teatro-200 border border-teatro-700 font-bold">
                      {usuarioPreMfa.rol}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  Para proteger el acceso de <strong>{usuarioPreMfa?.correo || correo}</strong>, ingresa el código de verificación de 6 dígitos:
                </p>
                {codigoMfaDemo && (
                  <div className="mt-2 p-2.5 bg-slate-950 border border-emerald-600/50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Código MFA Generado para tu Sesión:
                      </span>
                      <span className="text-lg font-mono font-bold text-emerald-400 tracking-widest">
                        {codigoMfaDemo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCodigoMfa(codigoMfaDemo)}
                      className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs rounded-md border border-emerald-600/40 transition"
                    >
                      Autocompletar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Código MFA de 6 dígitos *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={codigoMfa}
                  onChange={(e) => setCodigoMfa(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white text-center text-xl font-mono tracking-[0.4em] focus:outline-none focus:border-oro-400"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    limpiarMensajes();
                    setModo('login');
                  }}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <button
                  type="submit"
                  disabled={cargando || codigoMfa.length !== 6}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-semibold rounded-lg shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {cargando ? 'Verificando MFA...' : 'Confirmar Acceso MFA'}
                </button>
              </div>
            </div>
          )}

          {/* VISTA PASO 2 DE REGISTRO: VERIFICACIÓN DE CÓDIGO DE 6 DÍGITOS */}
          {modo === 'verificar_registro' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/80 border border-oro-500/40 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-oro-400 flex items-center gap-1.5">
                  <MailCheck className="w-4 h-4" />
                  Paso de Verificación de Creación de Usuario
                </span>
                <p className="text-xs text-slate-300">
                  Hemos comprobado que el correo <strong>{correo}</strong> existe y cuenta con servidores de correo activos. Ingresa el código de 6 dígitos para finalizar el registro:
                </p>
                {codigoRegistroDemo && (
                  <div className="mt-2 p-2.5 bg-slate-950 border border-oro-500/50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        Código de Verificación de Cuenta:
                      </span>
                      <span className="text-lg font-mono font-bold text-oro-400 tracking-widest">
                        {codigoRegistroDemo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCodigoRegistro(codigoRegistroDemo)}
                      className="px-2.5 py-1 bg-oro-500/20 hover:bg-oro-500/30 text-oro-300 text-xs rounded-md border border-oro-500/40 transition"
                    >
                      Usar código
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Código de Verificación (6 dígitos) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={codigoRegistro}
                  onChange={(e) => setCodigoRegistro(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white text-center text-xl font-mono tracking-[0.4em] focus:outline-none focus:border-oro-400"
                  placeholder="000000"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    limpiarMensajes();
                    setModo('registro');
                  }}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Corregir datos
                </button>
                <button
                  type="submit"
                  disabled={cargando || codigoRegistro.length !== 6}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-semibold rounded-lg shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {cargando ? 'Activando cuenta...' : 'Confirmar y Crear Cuenta'}
                </button>
              </div>
            </div>
          )}

          {/* VISTAS PRINCIPALES: LOGIN Y REGISTRO (PASO 1) */}
          {(modo === 'login' || modo === 'registro') && (
            <>
              {modo === 'registro' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nombres (solo letras) *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                      placeholder="Ej. Ana María"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Apellidos (solo letras) *
                    </label>
                    <input
                      type="text"
                      required
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                      placeholder="Ej. Quispe Flores"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Correo Electrónico *
                  </label>
                  {modo === 'registro' && (
                    <button
                      type="button"
                      onClick={() => handleVerificarCorreoExistente(correo)}
                      disabled={verificandoCorreo || !correo}
                      className="text-[11px] text-oro-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${verificandoCorreo ? 'animate-spin' : ''}`} />
                      {verificandoCorreo ? 'Consultando DNS MX...' : 'Verificar si el correo existe'}
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value);
                    setEstadoCorreo(null);
                  }}
                  onBlur={() => {
                    if (modo === 'registro' && correo.includes('@')) {
                      handleVerificarCorreoExistente(correo);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                  placeholder="usuario@gmail.com"
                />

                {modo === 'registro' && estadoCorreo && (
                  <div
                    className={`mt-1.5 p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                      estadoCorreo.valido
                        ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300'
                        : 'bg-red-950/70 border border-red-700/60 text-red-300'
                    }`}
                  >
                    {estadoCorreo.valido ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span>
                      {estadoCorreo.mensaje}
                      {estadoCorreo.servidor_mx ? ` (MX: ${estadoCorreo.servidor_mx})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {modo === 'registro' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      C.I. (5 a 10 dígitos) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={ci}
                      onChange={(e) => setCi(e.target.value.replace(/[^0-9A-Za-z\-\s]/g, ''))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                      placeholder="Ej. 6543210 LP"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Celular Bolivia (8 dígitos) *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={8}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teatro-500"
                      placeholder="Ej. 72071698"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña {modo === 'registro' ? '(Mín. 8 caracteres, letras y números)' : ''} *
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
                  <span className="text-sm">Verificando...</span>
                ) : modo === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" /> Continuar con Verificación MFA
                  </>
                ) : (
                  <>
                    <MailCheck className="w-4 h-4" /> Verificar Correo y Enviar Código
                  </>
                )}
              </button>
            </>
          )}
        </form>

        {/* Alternar modo */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 text-center text-xs text-slate-400">
          {modo === 'login' || modo === 'mfa' ? (
            <p>
              ¿No tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setEstadoCorreo(null);
                  setModo('registro');
                }}
                className="text-oro-400 hover:underline font-semibold"
              >
                Regístrate con verificación aquí
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setModo('login');
                }}
                className="text-oro-400 hover:underline font-semibold"
              >
                Inicia sesión con MFA
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
