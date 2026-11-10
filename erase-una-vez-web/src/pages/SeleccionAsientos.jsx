import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Crown,
} from 'lucide-react';

const ESTILOS_SECTOR = {
  VIP: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    cardActiva: 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/40',
    cardInactiva: 'bg-slate-900/90 border-amber-500/30 hover:border-amber-400/70',
    barra: 'from-amber-900/50 via-amber-800/30 to-amber-900/50 border-amber-500/40 text-amber-200',
    butacaDisponible:
      'bg-amber-950/70 hover:bg-amber-900/90 text-amber-200 border-amber-500/50 cursor-pointer hover:scale-110',
  },
  PLATEA: {
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    cardActiva: 'bg-rose-950/60 border-rose-400 ring-2 ring-rose-400/40',
    cardInactiva: 'bg-slate-900/90 border-rose-500/30 hover:border-rose-400/70',
    barra: 'from-rose-950/60 via-teatro-900/40 to-rose-950/60 border-rose-500/40 text-rose-200',
    butacaDisponible:
      'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border-rose-500/40 cursor-pointer hover:scale-110',
  },
  MEZZANINE: {
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
    cardActiva: 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/40',
    cardInactiva: 'bg-slate-900/90 border-sky-500/30 hover:border-sky-400/70',
    barra: 'from-sky-950/60 via-slate-900 to-sky-950/60 border-sky-500/40 text-sky-200',
    butacaDisponible:
      'bg-sky-950/60 hover:bg-sky-900/80 text-sky-200 border-sky-500/40 cursor-pointer hover:scale-110',
  },
  GENERAL: {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    cardActiva: 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/40',
    cardInactiva: 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-400/70',
    barra: 'from-emerald-950/50 via-slate-900 to-emerald-950/50 border-emerald-500/40 text-emerald-200',
    butacaDisponible:
      'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 cursor-pointer hover:scale-110',
  },
};

export default function SeleccionAsientos({ funcion, alVolver, alProcederPago, alAbrirLogin }) {
  const { usuario } = useAuth();
  const [datosSala, setDatosSala] = useState(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [sectorFiltro, setSectorFiltro] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const cargarMapa = async () => {
    try {
      setError('');
      const idReal = funcion?.id_presentacion || funcion?.id_funcion || funcion?.id;
      const data = await api.obtenerAsientosFuncion(idReal);
      setDatosSala(data);
    } catch (err) {
      setError(err.message || 'Error al cargar mapa de asientos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!funcion) return;
    cargarMapa();
    const intervalo = setInterval(cargarMapa, 20000);
    return () => clearInterval(intervalo);
  }, [funcion?.id_presentacion, funcion?.id_funcion]);

  const toggleAsiento = (asiento) => {
    if (asiento.estado_actual !== 'DISPONIBLE') return;

    setAsientosSeleccionados((prev) => {
      const existe = prev.some((a) => a.id_asiento === asiento.id_asiento);
      if (existe) {
        return prev.filter((a) => a.id_asiento !== asiento.id_asiento);
      } else {
        return [...prev, asiento];
      }
    });
  };

  const manejarReservar = async () => {
    if (!usuario) {
      alAbrirLogin();
      return;
    }

    if (asientosSeleccionados.length === 0) {
      setError('Por favor elija al menos un asiento en el mapa');
      return;
    }

    setProcesando(true);
    setError('');
    try {
      const ids = asientosSeleccionados.map((a) => a.id_asiento);
      const idFuncion = funcion?.id_presentacion || funcion?.id_funcion;
      const res = await api.reservarAsientos(idFuncion, ids);
      alProcederPago(res.venta);
    } catch (err) {
      setError(err.message || 'No se pudo completar la reserva.');
      cargarMapa();
      setAsientosSeleccionados([]);
    } finally {
      setProcesando(false);
    }
  };

  const sectoresDisponibles = datosSala?.sectores || [];
  const tieneMultiplesSectores = sectoresDisponibles.length > 1;

  // Agrupar asientos por sector y luego por fila
  const bloquesPorSector = [];
  if (datosSala?.asientos) {
    const ordenSectores = tieneMultiplesSectores ? ['VIP', 'PLATEA', 'MEZZANINE'] : ['GENERAL'];

    ordenSectores.forEach((codigoSector) => {
      if (sectorFiltro !== 'TODOS' && sectorFiltro !== codigoSector) return;

      const asientosDelSector = datosSala.asientos.filter(
        (a) => (a.sector || 'GENERAL') === codigoSector
      );
      if (asientosDelSector.length === 0) return;

      const filasMap = {};
      asientosDelSector.forEach((a) => {
        if (!filasMap[a.fila]) filasMap[a.fila] = [];
        filasMap[a.fila].push(a);
      });

      const filasOrdenadas = Object.keys(filasMap).sort(
        (a, b) => a.length - b.length || a.localeCompare(b)
      );
      filasOrdenadas.forEach((f) => {
        filasMap[f].sort((a, b) => a.numero - b.numero);
      });

      const rangoFilas =
        filasOrdenadas.length > 1
          ? `Filas ${filasOrdenadas[0]} - ${filasOrdenadas[filasOrdenadas.length - 1]}`
          : `Fila ${filasOrdenadas[0] || ''}`;

      const infoSector = sectoresDisponibles.find((s) => s.codigo === codigoSector) || {
        codigo: codigoSector,
        nombre: codigoSector === 'GENERAL' ? 'Sector General' : `Sector ${codigoSector}`,
        precio: Number(asientosDelSector[0]?.precio_asiento || funcion.precio),
        filas: rangoFilas,
      };

      bloquesPorSector.push({
        ...infoSector,
        rangoFilas,
        totalButacasSector: asientosDelSector.length,
        filasOrdenadas,
        filasMap,
      });
    });
  }

  // Calcular total sumando el precio de cada asiento según su sector (VIP, Platea, Mezzanine o General)
  const totalPagar = asientosSeleccionados
    .reduce((acc, a) => acc + Number(a.precio_asiento || funcion.precio || 0), 0)
    .toFixed(2);

  const nombreSalaActual =
    datosSala?.presentacion?.nombre_sala || funcion.sala || 'Sala Teatral';
  const capacidadSalaActual =
    datosSala?.presentacion?.capacidad || datosSala?.asientos?.length || 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Botón Volver y Cabecera de Función */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <button
          onClick={alVolver}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Cartelera
        </button>

        <div className="text-left md:text-right">
          <h1 className="text-2xl font-bold font-theater text-white">{funcion.titulo}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1 md:justify-end">
            <span className="flex items-center gap-1 text-oro-400">
              <Calendar className="w-3.5 h-3.5" /> {funcion.fecha}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {funcion.hora_inicio} hrs
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-teatro-400">
              <MapPin className="w-3.5 h-3.5" /> {nombreSalaActual}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-700 text-red-200 text-sm rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas de Sectores y Precios estilo SuperTicket */}
      {!cargando && sectoresDisponibles.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-oro-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {tieneMultiplesSectores
                  ? 'Selecciona tu Sector (Tarifas por Ubicación)'
                  : 'Tarifa de Sala (Sector General Único)'}
              </h2>
            </div>

            {tieneMultiplesSectores && (
              <button
                type="button"
                onClick={() => setSectorFiltro('TODOS')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                  sectorFiltro === 'TODOS'
                    ? 'bg-oro-400 text-slate-950 border-oro-300 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                Ver Todos los Sectores
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-1 ${
              tieneMultiplesSectores ? 'sm:grid-cols-3' : 'sm:grid-cols-1'
            } gap-3`}
          >
            {sectoresDisponibles.map((sec) => {
              const estilo = ESTILOS_SECTOR[sec.codigo] || ESTILOS_SECTOR.GENERAL;
              const activo = sectorFiltro === sec.codigo;
              const disponibles = datosSala?.asientos
                ? datosSala.asientos.filter(
                    (a) =>
                      (a.sector || 'GENERAL') === sec.codigo &&
                      a.estado_actual === 'DISPONIBLE'
                  ).length
                : 0;

              return (
                <button
                  key={sec.codigo}
                  type="button"
                  onClick={() =>
                    tieneMultiplesSectores
                      ? setSectorFiltro(activo ? 'TODOS' : sec.codigo)
                      : null
                  }
                  className={`text-left p-4 rounded-xl border transition flex items-center justify-between ${
                    activo ? estilo.cardActiva : estilo.cardInactiva
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {sec.codigo === 'VIP' && <Crown className="w-4 h-4 text-amber-400" />}
                      <span className="font-bold text-white text-sm">{sec.nombre}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${estilo.badge}`}
                      >
                        {Array.isArray(sec.filas) ? `Filas ${sec.filas.join(', ')}` : sec.filas}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {disponibles} butacas disponibles
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Precio</span>
                    <span className="text-lg font-extrabold text-oro-400 font-theater">
                      Bs. {Number(sec.precio).toFixed(0)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid: Mapa de Asientos (Izquierda) + Resumen de Compra (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Mapa de Asientos */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          {/* Telón / Escenario */}
          <div className="w-full mb-8 text-center">
            <div className="w-3/4 mx-auto py-2.5 bg-gradient-to-r from-teatro-900 via-teatro-700 to-teatro-900 text-white text-xs font-bold tracking-widest uppercase rounded-t-xl border-t border-x border-teatro-500 shadow-[0_-10px_25px_rgba(225,29,72,0.2)]">
              🎭 ESCENARIO / TELÓN PRINCIPAL
            </div>
            <div className="h-1.5 w-3/4 mx-auto bg-oro-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-b-full" />
            <p className="text-[11px] text-slate-400 mt-2">
              {tieneMultiplesSectores
                ? 'Distribución por sectores: VIP (frente al escenario), Platea (central) y Mezzanine (posterior)'
                : 'Sala íntima con tarifa General única en todas las filas'}
            </p>
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 pb-5 mb-6 border-b border-slate-800">
            {tieneMultiplesSectores ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-amber-950/80 border border-amber-500/60" />
                  <span>VIP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-rose-950/80 border border-rose-500/60" />
                  <span>Platea</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-sky-950/80 border border-sky-500/60" />
                  <span>Mezzanine</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-800 border border-slate-600" />
                <span>General Disponible</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-oro-400 border border-oro-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <span>Tu Selección</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-600/70 border border-amber-500" />
              <span>Reservado (15 min)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-950 border border-slate-800 opacity-40" />
              <span>Vendido</span>
            </div>
          </div>

          {/* Renderizado de Butacas agrupadas por Sector */}
          {cargando ? (
            <div className="text-center py-20 text-slate-400 text-sm">
              Cargando distribución de sala...
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[520px] flex flex-col items-center gap-6">
                {bloquesPorSector.map((bloque) => {
                  const estilo = ESTILOS_SECTOR[bloque.codigo] || ESTILOS_SECTOR.GENERAL;
                  return (
                    <div
                      key={bloque.codigo}
                      className="w-full flex flex-col items-center gap-2.5"
                    >
                      {/* Divisor del Sector */}
                      <div
                        className={`w-full max-w-2xl px-4 py-1.5 rounded-lg bg-gradient-to-r border text-xs font-bold flex items-center justify-between ${estilo.barra}`}
                      >
                        <span>
                          {bloque.nombre.toUpperCase()} ({bloque.rangoFilas} &bull;{' '}
                          {bloque.totalButacasSector} butacas)
                        </span>
                        <span className="font-extrabold">Bs. {Number(bloque.precio).toFixed(0)}</span>
                      </div>

                      {/* Filas del sector */}
                      {bloque.filasOrdenadas.map((letraFila) => (
                        <div key={letraFila} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs font-bold text-slate-400">
                            {letraFila}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {bloque.filasMap[letraFila].map((asiento) => {
                              const seleccionado = asientosSeleccionados.some(
                                (a) => a.id_asiento === asiento.id_asiento
                              );
                              const estado = asiento.estado_actual;

                              let claseColor = estilo.butacaDisponible;

                              if (seleccionado) {
                                claseColor =
                                  'bg-oro-400 text-slate-950 font-extrabold border-oro-300 ring-2 ring-oro-400 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.6)]';
                              } else if (estado === 'RESERVADO') {
                                claseColor =
                                  'bg-amber-600/60 border-amber-500 text-amber-200 cursor-not-allowed opacity-75';
                              } else if (estado === 'GRATUITO') {
                                claseColor =
                                  'bg-purple-900/80 border-purple-600 text-purple-200 cursor-not-allowed opacity-75';
                              } else if (estado === 'OCUPADO' || estado === 'VENDIDO') {
                                claseColor =
                                  'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed opacity-30';
                              }

                              return (
                                <button
                                  key={asiento.id_asiento}
                                  type="button"
                                  title={`Butaca ${asiento.fila}-${asiento.numero} (${
                                    asiento.zona || bloque.nombre
                                  }) - Bs. ${asiento.precio_asiento || bloque.precio}`}
                                  onClick={() => toggleAsiento(asiento)}
                                  disabled={estado !== 'DISPONIBLE'}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] sm:text-xs font-bold border transition-all duration-150 flex items-center justify-center ${claseColor}`}
                                >
                                  {asiento.numero}
                                </button>
                              );
                            })}
                          </div>

                          <span className="w-6 text-center text-xs font-bold text-slate-400">
                            {letraFila}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nota al pie de sala */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            {nombreSalaActual} &bull; Capacidad total: {capacidadSalaActual} butacas numeradas
          </div>
        </div>

        {/* Resumen de Reserva (Sidebar) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 sticky top-28">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Ticket className="w-5 h-5 text-oro-400" />
            <h3 className="font-theater text-lg font-bold text-white">Resumen de tu Compra</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Modalidad de Sala:</span>
              <span className="font-semibold text-white">
                {tieneMultiplesSectores ? 'Sectores (VIP / Platea / Mezzanine)' : 'Sector General Único'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Butacas seleccionadas:</span>
              <span className="font-bold text-oro-400">{asientosSeleccionados.length}</span>
            </div>

            {/* Lista de asientos elegidos con su sector y precio */}
            <div className="py-2">
              <span className="text-slate-400 block mb-2">Ubicaciones elegidas:</span>
              {asientosSeleccionados.length === 0 ? (
                <p className="text-slate-500 italic">No has seleccionado ninguna butaca aún.</p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {asientosSeleccionados.map((a) => {
                    const sec = a.sector || 'GENERAL';
                    const estilo = ESTILOS_SECTOR[sec] || ESTILOS_SECTOR.GENERAL;
                    const precioUnit = Number(a.precio_asiento || funcion.precio || 0).toFixed(0);
                    return (
                      <div
                        key={a.id_asiento}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            Fila {a.fila}-{a.numero}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${estilo.badge}`}
                          >
                            {sec}
                          </span>
                        </div>
                        <span className="font-bold text-oro-400">Bs. {precioUnit}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-slate-700 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Total a pagar:</span>
              <span className="text-2xl font-extrabold text-oro-400 font-theater">
                Bs. {totalPagar}
              </span>
            </div>
          </div>

          {/* Información de Garantía */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-oro-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Bloqueo temporal de seguridad
            </div>
            <p>
              Al presionar continuar, las butacas quedarán reservadas exclusivamente para ti durante{' '}
              <strong className="text-white">15 minutos</strong> para pagar con código QR bancario.
            </p>
          </div>

          {/* Botón de Acción */}
          <button
            onClick={manejarReservar}
            disabled={procesando || asientosSeleccionados.length === 0}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-bold rounded-xl shadow-lg shadow-teatro-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {procesando ? (
              <span>Bloqueando asientos...</span>
            ) : !usuario ? (
              <span>Inicia Sesión para Reservar</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-oro-400" />
                Continuar al Pago QR (Bs. {totalPagar})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
