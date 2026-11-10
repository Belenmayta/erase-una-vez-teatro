import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  QrCode,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Ticket,
  Copy,
  Check,
} from 'lucide-react';

export default function PagoQR({ venta, alVolver, alVerBoletos }) {
  const [datosPago, setDatosPago] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [error, setError] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(15 * 60); // 15 minutos en segundos
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    async function iniciarPago() {
      try {
        setError('');
        const res = await api.generarPagoQR(venta.id_venta);
        setDatosPago(res.pago);

        // Calcular segundos restantes
        if (res.pago.fecha_limite_pago) {
          const limite = new Date(res.pago.fecha_limite_pago).getTime();
          const ahora = new Date().getTime();
          const diffSegundos = Math.max(0, Math.floor((limite - ahora) / 1000));
          setTiempoRestante(diffSegundos);
        }
      } catch (err) {
        setError(err.message || 'Error al generar el código QR de pago');
      } finally {
        setCargando(false);
      }
    }
    iniciarPago();
  }, [venta.id_venta]);

  // Contador regresivo
  useEffect(() => {
    if (tiempoRestante <= 0 || pagoExitoso) return;
    const interval = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tiempoRestante, pagoExitoso]);

  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

  const copiarReferencia = () => {
    if (datosPago?.referencia_qr) {
      navigator.clipboard.writeText(datosPago.referencia_qr);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const simularConfirmacion = async () => {
    if (!datosPago) return;
    setConfirmando(true);
    setError('');
    try {
      const res = await api.confirmarPago({ id_pago: datosPago.id_pago });
      setPagoExitoso(true);
    } catch (err) {
      setError(err.message || 'No se pudo confirmar el pago.');
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Botón Volver */}
      {!pagoExitoso && (
        <button
          onClick={alVolver}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a selección de asientos
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-700 text-red-200 text-sm rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {pagoExitoso ? (
        /* Pantalla de Éxito */
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-3xl font-bold font-theater text-white">¡Pago Confirmado con Éxito!</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Tu compra ha sido procesada correctamente. Tus boletos digitales con código QR único para la función
              <strong className="text-white"> {venta.obra || 'seleccionada'}</strong> ya se encuentran emitidos y listos para su validación en puerta.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl max-w-sm mx-auto text-xs space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Referencia de pago:</span>
              <span className="text-white font-mono">{datosPago?.referencia_qr}</span>
            </div>
            <div className="flex justify-between">
              <span>Monto cancelado:</span>
              <span className="text-oro-400 font-bold">Bs. {datosPago?.monto}</span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className="text-emerald-400 font-bold">EMITIDO</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={alVerBoletos}
              className="py-3 px-8 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-semibold rounded-xl text-sm shadow-xl shadow-teatro-900/40 transition flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4 text-oro-400" /> Ver Mis Boletos Digitales
            </button>
          </div>
        </div>
      ) : (
        /* Pasarela de Pago QR Dinámico */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Cabecera y Temporizador */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs font-bold text-oro-400 uppercase tracking-widest flex items-center gap-1.5">
                <QrCode className="w-4 h-4" /> Pasarela de Pago Dinámico Simple QR
              </span>
              <h2 className="text-2xl font-bold font-theater text-white mt-1">
                Completa tu Compra
              </h2>
            </div>

            {/* Contador de tiempo límite */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              tiempoRestante < 180
                ? 'bg-red-950/80 border-red-700 text-red-300 animate-pulse'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}>
              <Clock className="w-4 h-4" />
              <div className="text-right">
                <span className="text-[10px] uppercase block tracking-wider font-semibold">Tiempo para pagar</span>
                <span className="text-base font-extrabold font-mono">{tiempoFormateado}</span>
              </div>
            </div>
          </div>

          {tiempoRestante === 0 ? (
            <div className="p-8 text-center bg-red-950/40 border border-red-800 rounded-2xl space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Tiempo de reserva expirado</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Los 15 minutos asignados para el pago han concluido y los asientos fueron liberados para otros espectadores.
              </p>
              <button
                onClick={alVolver}
                className="mt-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Volver a Seleccionar Asientos
              </button>
            </div>
          ) : cargando ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <div className="animate-spin w-8 h-8 border-2 border-teatro-500 border-t-transparent rounded-full mx-auto mb-3" />
              Generando código QR dinámico con pasarela bancaria...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Imagen del Código QR */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 shadow-inner">
                <div className="p-3 bg-white rounded-2xl shadow-xl">
                  {datosPago?.qr_imagen ? (
                    <img
                      src={datosPago.qr_imagen}
                      alt="Código QR de Pago Simple"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-slate-800 font-bold text-xs bg-slate-100 rounded-xl">
                      Generando QR bancario...
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <span className="text-xs text-slate-400">Total a Pagar:</span>
                  <div className="text-3xl font-extrabold text-oro-400 font-theater">
                    Bs. {datosPago?.monto}
                  </div>
                  <span className="text-[11px] text-slate-500 block">Moneda: Bolivianos (BOB)</span>
                </div>
              </div>
              {/* Instrucciones y Confirmación */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider text-oro-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Instrucciones de Pago Bancario
                  </h4>
                  <ol className="space-y-2 text-xs text-slate-300 leading-relaxed list-decimal list-inside bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <li>Abre tu aplicación bancaria móvil (BNB, BCP, Banco Unión, Fie, etc.).</li>
                    <li>Selecciona la opción <strong className="text-white">Pago con QR Simple</strong>.</li>
                    <li>Apunta tu cámara hacia el código QR mostrado en pantalla.</li>
                    <li>Verifica el monto de <strong className="text-oro-400">Bs. {datosPago?.monto}</strong> y confirma.</li>
                  </ol>
                </div>

                {/* Referencia única */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Referencia única</span>
                    <span className="text-xs text-slate-300 font-mono truncate block">
                      {datosPago?.referencia_qr}
                    </span>
                  </div>
                  <button
                    onClick={copiarReferencia}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0"
                    title="Copiar referencia"
                  >
                    {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Botón de Simulación de Pago (para demostración del tribunal / evaluación) */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={simularConfirmacion}
                    disabled={confirmando || tiempoRestante <= 0}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {confirmando ? (
                      <span className="text-sm">Procesando confirmación bancaria...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Simular Confirmación de Pago Bancario
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    En producción, este proceso es notificado automáticamente mediante el Webhook de la pasarela QR.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
