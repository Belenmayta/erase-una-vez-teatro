import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ScanLine,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  Users,
  RefreshCw,
  Image as ImageIcon,
  Zap,
  Search,
  Check,
} from 'lucide-react';

export default function EscanerPuerta({ alAbrirLogin }) {
  const { usuario, esRecepcion, esAdmin } = useAuth();
  const [funciones, setFunciones] = useState([]);
  const [idFuncionSeleccionada, setIdFuncionSeleccionada] = useState('');
  const [aforo, setAforo] = useState(null);
  const [todosBoletosFuncion, setTodosBoletosFuncion] = useState([]);
  const [ultimosIngresos, setUltimosIngresos] = useState([]);
  const [busquedaBoleto, setBusquedaBoleto] = useState('');

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [camarasDisponibles, setCamarasDisponibles] = useState([]);
  const [idCamaraElegida, setIdCamaraElegida] = useState('');
  const [linternaActiva, setLinternaActiva] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [resultadoValidacion, setResultadoValidacion] = useState(null);
  const [errorCamara, setErrorCamara] = useState('');

  const html5QrCodeRef = useRef(null);
  const ultimoCodigoLeidoRef = useRef({ codigo: '', tiempo: 0 });
  const inputArchivoRef = useRef(null);

  // Sintetizador de sonido con Web Audio API + vibración háptica en celular
  const reproducirFeedback = (exito) => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(exito ? [120] : [150, 80, 150]);
      }
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (exito) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
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
      // Ignorar si audio está bloqueado
    }
  };

  // Cargar funciones disponibles
  useEffect(() => {
    async function cargar() {
      try {
        const funcs = await api.obtenerFunciones(true);
        setFunciones(funcs);
        if (funcs.length > 0) {
          setIdFuncionSeleccionada(funcs[0].id_funcion || funcs[0].id_presentacion);
        }
      } catch (e) {
        console.error(e);
      }
    }
    cargar();
  }, []);

  // Detectar cámaras del celular o laptop
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCamarasDisponibles(devices);
          // Preferir la cámara trasera principal (evitando gran angular si hay varias)
          const trasera =
            devices.find((d) => /back|trasera|rear|environment/i.test(d.label) && !/wide|ultra/i.test(d.label)) ||
            devices.find((d) => /back|trasera|rear|environment/i.test(d.label)) ||
            devices[devices.length - 1];
          setIdCamaraElegida(trasera.id);
        }
      })
      .catch(() => {});
  }, []);

  const refrescarAforo = async (idFunc) => {
    if (!idFunc) return;
    try {
      const data = await api.obtenerAsistenciaFuncion(idFunc);
      setAforo(data.aforo);
      setTodosBoletosFuncion(data.boletos || []);
      const ultimos = (data.boletos || []).filter((b) => b.estado === 'USADO').slice(0, 8);
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

  // Validar código QR (desde cámara, foto o manual)
  const procesarCodigo = async (codigoRaw) => {
    const codigo = String(codigoRaw || '').trim();
    if (!codigo || procesando) return;

    // Evitar lecturas duplicadas del mismo QR en menos de 2.8 segundos
    const ahora = Date.now();
    if (
      ultimoCodigoLeidoRef.current.codigo === codigo &&
      ahora - ultimoCodigoLeidoRef.current.tiempo < 2800
    ) {
      return;
    }
    ultimoCodigoLeidoRef.current = { codigo, tiempo: ahora };

    setProcesando(true);
    setResultadoValidacion(null);

    try {
      const res = await api.validarIngresoQR(codigo, idFuncionSeleccionada);
      reproducirFeedback(true);
      setResultadoValidacion({
        ok: true,
        mensaje: res.mensaje || '¡Acceso Autorizado!',
        boleto: res.boleto,
      });
      setCodigoManual('');
      refrescarAforo(idFuncionSeleccionada);
    } catch (err) {
      reproducirFeedback(false);
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

  const detenerCamaraActual = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error(e);
      }
    }
    setCamaraActiva(false);
    setLinternaActiva(false);
  };

  const iniciarCamaraConDispositivo = async (cameraIdOrConfig) => {
    setErrorCamara('');
    await detenerCamaraActual();

    try {
      // Habilitar detector nativo de códigos QR del hardware del celular (10x más rápido)
      const scanner = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });
      html5QrCodeRef.current = scanner;

      const configCamara = cameraIdOrConfig
        ? { deviceId: { exact: cameraIdOrConfig } }
        : { facingMode: { ideal: 'environment' } };

      await scanner.start(
        configCamara,
        {
          fps: 25,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.max(180, Math.floor(minEdge * 0.78));
            return { width: boxSize, height: boxSize };
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          procesarCodigo(decodedText);
        },
        () => {}
      );
      setCamaraActiva(true);
    } catch (err) {
      // Reintentar con configuración genérica environment si falló el deviceId exacto
      try {
        const scannerFallback = new Html5Qrcode('qr-reader-container');
        html5QrCodeRef.current = scannerFallback;
        await scannerFallback.start(
          { facingMode: 'environment' },
          { fps: 20, qrbox: { width: 240, height: 240 } },
          (decodedText) => procesarCodigo(decodedText),
          () => {}
        );
        setCamaraActiva(true);
      } catch {
        setErrorCamara(
          'No se pudo abrir la cámara en vivo. Puedes usar el botón "Escanear desde Foto / Captura" o validar con 1 clic en la lista de abajo.'
        );
        setCamaraActiva(false);
      }
    }
  };

  const toggleCamara = async () => {
    if (camaraActiva) {
      await detenerCamaraActual();
    } else {
      await iniciarCamaraConDispositivo(idCamaraElegida);
    }
  };

  const cambiarCamara = async (nuevoId) => {
    setIdCamaraElegida(nuevoId);
    if (camaraActiva) {
      await iniciarCamaraConDispositivo(nuevoId);
    }
  };

  const toggleLinterna = async () => {
    if (!html5QrCodeRef.current || !camaraActiva) return;
    try {
      const nuevoEstado = !linternaActiva;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nuevoEstado }],
      });
      setLinternaActiva(nuevoEstado);
    } catch {
      setErrorCamara('Este dispositivo o lente no soporta encender el flash durante el escaneo.');
    }
  };

  // Escanear QR desde una foto o captura de pantalla (infalible cuando la cámara no enfoca)
  const escanearDesdeImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorCamara('');

    try {
      if (camaraActiva) {
        await detenerCamaraActual();
      }
      const scanner = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      });
      const decodedText = await scanner.scanFile(file, true);
      await procesarCodigo(decodedText);
    } catch {
      reproducirFeedback(false);
      setErrorCamara(
        'No se detectó un código QR nítido en la imagen seleccionada. Intenta acercar más la foto al QR o valida al espectador en la lista inferior.'
      );
    } finally {
      if (inputArchivoRef.current) inputArchivoRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
        } catch {}
      }
    };
  }, []);

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

  const boletosPendientesFiltrados = todosBoletosFuncion.filter((b) => {
    if (!busquedaBoleto.trim()) return true;
    const q = busquedaBoleto.toLowerCase();
    return (
      `${b.nombres || ''} ${b.apellidos || ''}`.toLowerCase().includes(q) ||
      `${b.fila}-${b.numero}`.toLowerCase().includes(q) ||
      String(b.codigo_qr || '').toLowerCase().includes(q) ||
      String(b.ci || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cabecera y Selector de Función */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-xs font-semibold">
            <ScanLine className="w-3.5 h-3.5" />
            Control de Acceso en Puerta (Alta Velocidad 25 FPS)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-theater text-white mt-1">
            Escáner QR de Boletos
          </h1>
          <p className="text-xs text-slate-400">
            Detección acelerada por hardware para celulares, escaneo por foto y validación directa por lista.
          </p>
        </div>

        <div className="min-w-[280px]">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Función activa a validar en puerta:
          </label>
          <select
            value={idFuncionSeleccionada}
            onChange={(e) => setIdFuncionSeleccionada(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            {funciones.map((f) => {
              const idF = f.id_funcion || f.id_presentacion;
              return (
                <option key={idF} value={idF}>
                  {String(f.fecha).slice(0, 10)} {f.hora_inicio} - {f.titulo}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Grid: Escáner Cámara / Manual (Izquierda) + Monitor de Aforo (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lado Escáner */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          {/* Controles de Cámara */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-indigo-400" /> Lector QR Inteligente
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {camaraActiva && (
                <button
                  type="button"
                  onClick={toggleLinterna}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    linternaActiva
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Flash
                </button>
              )}

              <input
                ref={inputArchivoRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={escanearDesdeImagen}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputArchivoRef.current?.click()}
                className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Tomar Foto / Imagen QR
              </button>

              <button
                type="button"
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
                    <Camera className="w-4 h-4" /> Activar Cámara en Vivo
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Selector de lente si el celular tiene varias cámaras */}
          {camarasDisponibles.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                Cambiar lente de cámara:
              </span>
              <select
                value={idCamaraElegida}
                onChange={(e) => cambiarCamara(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {camarasDisponibles.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Cámara ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorCamara && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl">
              {errorCamara}
            </div>
          )}

          {/* Visor de Cámara */}
          <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl min-h-[260px] flex items-center justify-center">
            <div id="qr-reader-container" className="w-full max-w-md mx-auto" />
            {!camaraActiva && (
              <div className="text-center p-6 space-y-3 text-slate-400">
                <ScanLine className="w-12 h-12 mx-auto text-indigo-400 animate-pulse" />
                <p className="text-xs font-medium text-slate-300">
                  Presiona <strong className="text-white">"Activar Cámara en Vivo"</strong> o usa{' '}
                  <strong className="text-emerald-400">"Tomar Foto / Imagen QR"</strong> si el celular tiene poca luz.
                </p>
              </div>
            )}
          </div>

          {/* Resultado de la Validación (Feedback Visual Grande) */}
          {resultadoValidacion && (
            <div
              className={`p-5 rounded-2xl border-2 transition-all shadow-2xl animate-fade-in ${
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

                  <p className="text-sm font-medium leading-relaxed">{resultadoValidacion.mensaje}</p>

                  {resultadoValidacion.ok && resultadoValidacion.boleto && (
                    <div className="pt-2 border-t border-emerald-700/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-emerald-300/80 block text-[10px] uppercase font-semibold">
                          Ubicación
                        </span>
                        <span className="text-base font-extrabold text-white">
                          {resultadoValidacion.boleto.asiento}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-300/80 block text-[10px] uppercase font-semibold">
                          Espectador
                        </span>
                        <span className="text-xs font-bold text-white truncate block">
                          {resultadoValidacion.boleto.comprador}
                        </span>
                      </div>
                    </div>
                  )}

                  {!resultadoValidacion.ok && resultadoValidacion.asiento && (
                    <div className="pt-2 border-t border-red-800/60 text-xs space-y-1">
                      <p>
                        Asiento asignado:{' '}
                        <strong className="text-white">{resultadoValidacion.asiento}</strong>
                      </p>
                      {resultadoValidacion.hora_ingreso_previo && (
                        <p className="text-[11px] text-red-200">
                          Hora de ingreso previo:{' '}
                          {new Date(resultadoValidacion.hora_ingreso_previo).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {procesando ? 'Verificando...' : 'Validar'}
              </button>
            </div>
          </div>

          {/* Lista Rápida de Boletos de la Función para Validar en 1 Clic */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-oro-400 uppercase tracking-wider">
                Validación Directa por Padrón de Función ({todosBoletosFuncion.length} boletos)
              </h4>
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={busquedaBoleto}
                  onChange={(e) => setBusquedaBoleto(e.target.value)}
                  placeholder="Buscar por nombre, CI o fila..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-oro-400"
                />
              </div>
            </div>

            {boletosPendientesFiltrados.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No hay boletos emitidos que coincidan con la búsqueda.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {boletosPendientesFiltrados.map((b) => (
                  <div
                    key={b.id_boleto}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          Fila {b.fila}-{b.numero}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-oro-400 font-mono">
                          {b.codigo_qr}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        {b.nombres} {b.apellidos} {b.ci ? `• CI: ${b.ci}` : ''}
                      </span>
                    </div>

                    {b.estado === 'USADO' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[11px] shrink-0">
                        ✓ Ya Ingresó
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => procesarCodigo(b.codigo_qr)}
                        disabled={procesando}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow"
                      >
                        <Check className="w-3.5 h-3.5" /> Dar Ingreso
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
                className="text-[11px] text-indigo-400 hover:underline font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Actualizar
              </button>
            </div>

            {aforo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      En Sala
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {aforo.asistentes_ingresados}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Por Ingresar
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {aforo.pendientes_ingreso}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Capacidad
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      {aforo.capacidad_sala}
                    </span>
                  </div>
                </div>

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
            <h4 className="font-theater text-sm font-bold uppercase tracking-wider text-oro-400">
              Últimas Entradas Validadas
            </h4>

            {ultimosIngresos.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No se han registrado ingresos aún para esta función.
              </p>
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
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold text-[11px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 block">
                        ✓ En Sala
                      </span>
                      {b.fecha_hora_ingreso && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(b.fecha_hora_ingreso).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
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
