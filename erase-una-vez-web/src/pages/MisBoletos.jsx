import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function MisBoletos({ alAbrirLogin }) {
  const { usuario } = useAuth();
  const [boletos, setBoletos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      if (!usuario) {
        setCargando(false);
        alAbrirLogin();
        return;
      }
      try {
        const data = await api.misBoletos();
        setBoletos(data);
      } catch (err) {
        if (err.status === 401) {
          alAbrirLogin();
        } else {
          setError(err.message || 'Error al cargar los boletos');
        }
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [usuario]);

  const imprimirBoleto = (idBoleto) => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Encabezado */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teatro-900/60 border border-teatro-700/50 text-teatro-300 text-xs font-semibold">
            <Ticket className="w-3.5 h-3.5 text-oro-400" />
            Billetera Digital
          </div>
          <h1 className="text-3xl font-bold font-theater text-white mt-1">
            Mis Boletos Digitales
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Presenta el código QR desde tu celular en la puerta del teatro o imprímelo para acceder.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" /> Imprimir Boletos
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          <div className="animate-spin w-8 h-8 border-2 border-teatro-500 border-t-transparent rounded-full mx-auto mb-3" />
          Cargando tus boletos emitidos...
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/60 border border-red-800 rounded-2xl text-center text-red-200 text-sm max-w-md mx-auto">
          {error}
        </div>
      ) : boletos.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-md mx-auto space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white font-theater">No tienes boletos emitidos</h3>
          <p className="text-xs text-slate-400">
            Aún no has adquirido entradas para las próximas presentaciones. Explora la cartelera y reserva tus butacas favoritas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {boletos.map((b) => (
            <div
              key={b.id_boleto}
              className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col sm:flex-row relative group print:border-black print:text-black print:bg-white"
            >
              {/* Parte Izquierda: Datos del Evento */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4 border-b sm:border-b-0 sm:border-r border-slate-800 border-dashed">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-oro-400 font-bold bg-oro-950/80 px-2.5 py-0.5 rounded-full border border-oro-800/60">
                      Boleto #{b.id_boleto} &bull; {b.tipo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        b.estado === 'EMITIDO'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {b.estado === 'EMITIDO' ? '✓ Válido para ingreso' : 'Utilizado en puerta'}
                    </span>
                  </div>

                  <h3 className="font-theater text-xl font-bold text-white leading-tight">
                    {b.obra_titulo}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-oro-400" />
                      <span>{b.fecha} &bull; {b.hora_inicio} hrs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teatro-400" />
                      <span>{b.sala_nombre} ({b.sala_direccion || 'Sopocachi'})</span>
                    </div>
                  </div>
                </div>

                {/* Butaca destacada */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="bg-teatro-950/90 border border-teatro-700/60 px-3.5 py-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">Ubicación</span>
                    <span className="text-lg font-black text-white">
                      Fila {b.fila} &bull; Butaca {b.numero}
                    </span>
                    <span className="text-[10px] text-teatro-300 block">{b.zona || 'General'}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Titular</span>
                    <span className="text-xs font-semibold text-white block">
                      {b.comprador_nombres} {b.comprador_apellidos}
                    </span>
                    {b.comprador_ci && (
                      <span className="text-[10px] text-slate-400 block font-mono">CI: {b.comprador_ci}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Parte Derecha: Código QR para validación */}
              <div className="p-6 sm:w-56 bg-slate-950/80 flex flex-col items-center justify-center text-center space-y-3 shrink-0">
                <div className="p-2 bg-white rounded-2xl shadow-xl">
                  {b.qr_imagen ? (
                    <img
                      src={b.qr_imagen}
                      alt={`QR Boleto ${b.id_boleto}`}
                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                    />
                  ) : (
                    <QrCode className="w-32 h-32 text-slate-900" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 block font-semibold">
                    Código de Validación
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono font-bold truncate max-w-[170px] block">
                    {b.codigo_qr}
                  </span>
                </div>

                {b.estado === 'USADO' && (
                  <div className="text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    Ingreso: {b.fecha_hora_ingreso ? new Date(b.fecha_hora_ingreso).toLocaleTimeString() : 'Registrado'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
