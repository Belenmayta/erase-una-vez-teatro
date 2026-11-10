import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ScanLine,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Ticket,
} from 'lucide-react';

export default function EscanerPuerta({ alAbrirLogin }) {
  const { usuario, esRecepcion, esAdmin } = useAuth();
  const [funciones, setFunciones] = useState([]);
  const [idFuncionSeleccionada, setIdFuncionSeleccionada] = useState('');
  const [aforo, setAforo] = useState(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [resultadoValidacion, setResultadoValidacion] = useState(null); // { ok, mensaje, boleto, motivo, ... }
  const [ultimosIngresos, setUltimosIngresos] = useState([]);
  const [errorCamara, setErrorCamara] = useState('');

  const html5QrCodeRef = useRef(null);

  // Sintetizador de sonido con Web Audio API (agradable para acceso, alerta para rechazo)
  const reproducirSonido = (exito) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (exito) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {
      // Audio no disponible o bloqueado por el navegador
    }
  };

  // Cargar funciones disponibles
  useEffect(() => {
    async function cargar() {
      try {
        const funcs = await api.obtenerFunciones(true);
        setFunciones(funcs);
        if (funcs.length > 0) {
          setIdFuncionSeleccionada(funcs[0].id_funcion);
        }
      } catch (e) {
        console.error(e);
      }
    }
    cargar();
  }, []);

  // Cargar aforo de la función activa
  const refrescarAforo = async (idFunc) => {
    if (!idFunc) return;
    try {
      const data = await api.obtenerAsistenciaFuncion(idFunc);
      setAforo(data.aforo);
      const ultimos = data.boletos.filter((b) => b.estado === 'USADO').slice(0, 5);
      setUltimosIngresos(ultimos);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (idFuncionSeleccionada) {
      refrescarAforo(idFuncionSeleccionada);
    }
  }, [idFuncionSeleccionada]);

  // Validar código QR (desde cámara o manual)
  const procesarCodigo = async (codigo) => {
    if (!codigo || procesando) return;
    setProcesando(true);
    setResultadoValidacion(null);

    try {
      const res = await api.validarIngresoQR(codigo, idFuncionSeleccionada);
      reproducirSonido(true);
      setResultadoValidacion({
        ok: true,
        mensaje: res.mensaje || '¡Acceso Autorizado!',
        boleto: res.boleto,
      });
      // Actualizar conteo de aforo
      refrescarAforo(idFuncionSeleccionada);
    } catch (err) {
      reproducirSonido(false);
      setResultadoValidacion({
        ok: false,
        motivo: err.data?.motivo || 'ERROR',
        mensaje: err.message || 'Boleto no válido',
        asiento: err.data?.asiento,
        hora_ingreso_previo: err.data?.hora_ingreso_previo,
        validado_por: err.data?.validado_por,
      });
    } finally {
      setProcesando(false);
    }
  };

  // Iniciar / detener cámara
  const toggleCamara = async () => {
    setErrorCamara('');
    if (camaraActiva) {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) {
          console.error(e);
        }
      }
      setCamaraActiva(false);
    } else {
      try {
        const scanner = new Html5Qrcode('qr-reader-container');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' }, // Cámara trasera preferida
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            procesarCodigo(decodedText);
          },
          () => {} // Ignorar lecturas fallidas por frame
        );
        setCamaraActiva(true);
      } catch (err) {
        setErrorCamara('No se pudo acceder a la cámara. Verifique los permisos en su navegador o ingrese el código manualmente.');
        setCamaraActiva(false);
      }
    }
  };

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && camaraActiva) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [camaraActiva]);

  if (!usuario || (!esRecepcion && !esAdmin)) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <ScanLine className="w-12 h-12 text-oro-400 mx-auto" />
        <h3 className="text-xl font-bold font-theater text-white">Acceso Restringido</h3>
        <p className="text-xs text-slate-300">
          Esta función es de uso exclusivo del personal de recepción y administración del teatro para el control de accesos.
        </p>
        <button
          onClick={alAbrirLogin}
          className="px-5 py-2.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold"
        >
          Iniciar Sesión como Recepción
        </button>
      </div>
    );
  }

  const funcionActiva = funciones.find((f) => String(f.id_funcion) === String(idFuncionSeleccionada));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabecera y Selector de Función */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-xs font-semibold">
            <ScanLine className="w-3.5 h-3.5" />
            Control de Acceso en Puerta
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-theater text-white mt-1">
            Escáner QR de Boletos
          </h1>
          <p className="text-xs text-slate-400">
            Valida los pases digitales desde la cámara del celular o computadora en tiempo real.
          </p>
        </div>

        {/* Selector de función */}
        <div className="min-w-[280px]">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Función activa a validar en puerta:
          </label>
          <select
            value={idFuncionSeleccionada}
            onChange={(e) => setIdFuncionSeleccionada(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            {funciones.map((f) => (
              <option key={f.id_funcion} value={f.id_funcion}>
                {f.fecha} {f.hora_inicio} - {f.titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Escáner Cámara / Manual (Izquierda) + Monitor de Aforo (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lado Escáner */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Botón de Cámara */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-indigo-400" /> Cámara del Dispositivo
            </span>

            <button
              onClick={toggleCamara}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                camaraActiva
                  ? 'bg-red-950 text-red-200 border border-red-800 hover:bg-red-900'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {camaraActiva ? (
                <>
                  <CameraOff className="w-4 h-4" /> Detener Cámara
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" /> Activar Cámara
                </>
              )}
            </button>
          </div>

          {errorCamara && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl">
              {errorCamara}
            </div>
          )}

          {/* Visor de Cámara */}
          <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl min-h-[260px] flex items-center justify-center">
            <div id="qr-reader-container" className="w-full" />
            {!camaraActiva && (
              <div className="text-center p-6 space-y-2 text-slate-500">
                <ScanLine className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs">Cámara apagada. Presione "Activar Cámara" o ingrese el código abajo.</p>
              </div>
            )}
          </div>

          {/* Entrada Manual de Código de Boleto */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-400">
              O ingresar código de boleto manualmente:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && procesarCodigo(codigoManual)}
                placeholder="Ej. EUV-TK-..."
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => procesarCodigo(codigoManual)}
                disabled={procesando || !codigoManual}
                className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {procesando ? 'Verificando...' : 'Validar'}
              </button>
            </div>
          </div>

          {/* Resultado de la Validación (Feedback Visual Grande) */}
          {resultadoValidacion && (
            <div
              className={`p-6 rounded-2xl border-2 transition-all shadow-2xl animate-fade-in ${
                resultadoValidacion.ok
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                  : 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              }`}
            >
              <div className="flex items-start gap-4">
                {resultadoValidacion.ok ? (
                  <CheckCircle className="w-10 h-10 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-theater tracking-wide">
                      {resultadoValidacion.ok ? '¡ACCESO AUTORIZADO!' : '¡ACCESO DENEGADO!'}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-black/40">
                      {resultadoValidacion.ok ? 'Boleto Válido' : resultadoValidacion.motivo}
                    </span>
                  </div>

                  <p className="text-sm font-medium leading-relaxed">
                    {resultadoValidacion.mensaje}
                  </p>

                  {resultadoValidacion.ok && resultadoValidacion.boleto && (
                    <div className="pt-2 border-t border-emerald-700/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-emerald-300/80 block text-[10px] uppercase font-semibold">Ubicación</span>
                        <span className="text-base font-extrabold text-white">
                          {resultadoValidacion.boleto.asiento}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-300/80 block text-[10px] uppercase font-semibold">Espectador</span>
                        <span className="text-xs font-bold text-white truncate block">
                          {resultadoValidacion.boleto.comprador}
                        </span>
                      </div>
                    </div>
                  )}

                  {!resultadoValidacion.ok && resultadoValidacion.asiento && (
                    <div className="pt-2 border-t border-red-800/60 text-xs space-y-1">
                      <p>
                        Asiento asignado: <strong className="text-white">{resultadoValidacion.asiento}</strong>
                      </p>
                      {resultadoValidacion.hora_ingreso_previo && (
                        <p className="text-[11px] text-red-200">
                          Hora de ingreso previo: {new Date(resultadoValidacion.hora_ingreso_previo).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Monitor de Aforo y Asistencia en Tiempo Real */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card de Aforo */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-oro-400" />
                <h3 className="font-theater text-lg font-bold text-white">Monitor de Aforo</h3>
              </div>
              <button
                onClick={() => refrescarAforo(idFuncionSeleccionada)}
                className="text-[11px] text-indigo-400 hover:underline font-semibold"
              >
                Actualizar
              </button>
            </div>

            {aforo ? (
              <div className="space-y-4">
                {/* Métricas Principales */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">En Sala</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {aforo.asistentes_ingresados}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Por Ingresar</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {aforo.pendientes_ingreso}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Capacidad</span>
                    <span className="text-2xl font-black text-white font-mono">
                      {aforo.capacidad_sala}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso de asistencia */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Ocupación de Boletos Emitidos:</span>
                    <span className="font-bold text-white">{aforo.porcentaje_asistencia}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, aforo.porcentaje_asistencia)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl text-xs text-slate-400 space-y-1 border border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Boletos Vendidos:</span>
                    <span className="text-white font-semibold">{aforo.boletos_vendidos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entradas Gratuitas (Social):</span>
                    <span className="text-purple-300 font-semibold">{aforo.entradas_gratuitas}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Cargando datos de aforo...</p>
            )}
          </div>

          {/* Últimos Ingresos en Puerta */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="font-theater text-sm font-bold text-white uppercase tracking-wider text-oro-400">
              Últimas Entradas Validadas
            </h4>

            {ultimosIngresos.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No se han registrado ingresos aún para esta función.</p>
            ) : (
              <div className="space-y-2">
                {ultimosIngresos.map((b) => (
                  <div
                    key={b.id_boleto}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        Fila {b.fila} &bull; Asiento #{b.numero}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {b.nombres} {b.apellidos}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      ✓ En Sala
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
