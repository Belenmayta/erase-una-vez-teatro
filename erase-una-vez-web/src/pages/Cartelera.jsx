import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Calendar, Clock, MapPin, Ticket, Search, Sparkles, AlertCircle } from 'lucide-react';

export default function Cartelera({ alSeleccionarFuncion }) {
  const [funciones, setFunciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.obtenerFunciones();
        setFunciones(data);
      } catch (err) {
        setError('No se pudo cargar la cartelera. Intente de nuevo.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const funcionesFiltradas = funciones.filter(
    (f) =>
      f.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (f.publico_objetivo && f.publico_objetivo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teatro-900/60 border border-teatro-700/50 text-teatro-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-oro-400" />
          Cartelera Oficial
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-theater text-white">
          Próximas Obras y Presentaciones Teatrales
        </h1>
        <p className="text-slate-300 text-sm">
          Consulta fechas, horarios y adquiere tus pases digitales con selección directa de butacas.
        </p>

        {/* Buscador */}
        <div className="pt-2 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título u obra..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teatro-500 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Estados */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-teatro-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Cargando cartelera teatral...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/60 border border-red-800 rounded-2xl text-center text-red-200 text-sm max-w-md mx-auto flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>{error}</span>
        </div>
      ) : funcionesFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl max-w-lg mx-auto space-y-2">
          <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-white font-medium text-sm">No se encontraron funciones</p>
          <p className="text-xs text-slate-400">Prueba con otro término de búsqueda o vuelve a consultar más tarde.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {funcionesFiltradas.map((f) => (
            <div
              key={f.id_presentacion || f.id_funcion} 
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between hover:border-teatro-700/60 transition group"
            >
              {/* Imagen / Afiche */}
              <div className="relative h-56 overflow-hidden bg-slate-950">
                <img
                  src={f.afiche_url}
                  alt={f.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/70 text-right shadow-lg">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">Boleto</span>
                  <span className="text-base font-bold text-oro-400">Bs. {f.precio}</span>
                </div>

                <div className="absolute bottom-3 left-4">
                  <span className="text-[11px] font-semibold text-teatro-200 bg-teatro-900/90 px-3 py-1 rounded-full border border-teatro-700/60 shadow-sm">
                    {f.publico_objetivo || 'Público General'}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <h3 className="font-theater text-xl font-bold text-white group-hover:text-teatro-300 transition">
                    {f.titulo}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {f.descripcion}
                  </p>
                </div>
                {/* Detalles de Fecha, Hora y Sala */}
                <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-oro-400 shrink-0" />
                    <span className="font-semibold text-white">
                      {new Date(f.fecha).toLocaleDateString('es-BO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </span>
                    <span className="text-slate-500">&bull;</span>
                    <Clock className="w-4 h-4 text-oro-400 shrink-0 ml-1" />
                    <span>{f.hora_inicio} hrs</span>
                    {f.duracion_min && (
                      <span className="text-slate-400 text-[11px]">({f.duracion_min} min)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teatro-400 shrink-0" />
                    <span className="truncate">{f.sala} ({f.sala_direccion || 'Sopocachi'})</span>
                  </div>

                  <button
                      onClick={() => alSeleccionarFuncion(f)} // ✅ Pasa el objeto entero correctamente
                      className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-teatro-900/40 flex items-center justify-center gap-2 group/btn"
                    >
                      <Ticket className="w-4 h-4 text-oro-400 group-hover/btn:scale-110 transition-transform" />
                      Seleccionar Butacas
                    </button>
                </div>

                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
