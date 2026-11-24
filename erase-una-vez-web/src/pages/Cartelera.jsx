import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Search,
  Sparkles,
  AlertCircle,
  BookOpen,
  History,
  Film,
  X,
  Users,
} from 'lucide-react';

const ARCHIVO_HISTORICO_LOCAL = [
  {
    id_obra: 'hist-pasanaku',
    titulo: 'Pasanaku',
    descripcion:
      'Comedia teatral costumbrista: “Estás invitada(o) a divertirte y brindar por nuestro nuevo espacio, muchas sorpresas”. Presentada el Viernes 24 de Mayo a Hrs. 19:00 en nuestra sede de Av. 20 de Octubre y Aspiazu, Edif. Aspiazu PB, galería local 5 al fondo (Adhesión Bs. 15 • Reservas: 61111084).',
    duracion_min: 75,
    publico_objetivo: 'Comedia Familiar y Adultos',
    afiche_url: '/galeria/afiche-pasanaku.jpg',
    sala_nombre: 'Sede Sopocachi — Edif. Aspiazu PB Local 5',
    estado: 'Finalizada',
  },
  {
    id_obra: 'hist-pequefest',
    titulo: 'Peque Fest 2024',
    descripcion:
      'Festival infantil musical y teatral presentado el 13 y 14 de Abril de 2024 con la adaptación musical de La Sirenita (Ariel, Sebastián y Flounder), dinámicas participativas y números musicales para toda la familia (Referencias: 60646087 - 69995091).',
    duracion_min: 90,
    publico_objetivo: 'Infantil y Familiar',
    afiche_url: '/galeria/afiche-peque-fest-2024.jpg',
    sala_nombre: 'Escenario Principal Érase una Vez',
    estado: 'Finalizada',
  },
  {
    id_obra: 'hist-muestras',
    titulo: 'Muestras de Teatro — Alumnos de Érase una Vez',
    descripcion:
      'Gala académica y demostrativa protagonizada por los alumnos formados en los talleres de actuación y teatroterapia de Érase una Vez. Presentada el Sábado 10 de Febrero a Hrs. 17:00 en el Teatro de Cámara (Informes: 69995091 • Facebook: Erase una Vez Bolivia).',
    duracion_min: 90,
    publico_objetivo: 'Gala Académica / Todo Público',
    afiche_url: '/galeria/afiche-muestras-teatro-alumnos.jpg',
    sala_nombre: 'Teatro de Cámara',
    estado: 'Finalizada',
  },
  {
    id_obra: 'hist-encanto',
    titulo: 'Tributo Musical “Encanto”',
    descripcion:
      'Puesta en escena musical inspirada en la familia Madrigal (Mirabel, Isabela, Luisa y Bruno) con coreografías en vivo, vestuario colorido e interacción directa con niñas, niños y familias paceñas.',
    duracion_min: 80,
    publico_objetivo: 'Infantil y Familiar',
    afiche_url: '/galeria/musical-encanto-familia.jpg',
    sala_nombre: 'Escenario Abierto / Giras Culturales La Paz',
    estado: 'Finalizada',
  },
  {
    id_obra: 'hist-gala-municipal',
    titulo: 'Gala Navideña y El Grinch en el Teatro Municipal',
    descripcion:
      'Gran montaje navideño con elenco completo, cuerpo de baile y personajes clásicos presentado a sala llena en el histórico Teatro Municipal Alberto Saavedra Pérez.',
    duracion_min: 95,
    publico_objetivo: 'Familiar',
    afiche_url: '/galeria/gala-navidena-teatro-municipal.jpg',
    sala_nombre: 'Teatro Municipal Alberto Saavedra Pérez',
    estado: 'Finalizada',
  },
  {
    id_obra: 'hist-jack',
    titulo: 'El Extraño Mundo de Jack — Fantasía Musical',
    descripcion:
      'Montaje escénico y musical de fantasía con caracterización profesional, maquillaje artístico y participación conjunta del elenco oficial y estudiantes de la academia.',
    duracion_min: 85,
    publico_objetivo: 'Familiar y Juvenil',
    afiche_url: '/galeria/elenco-extrano-mundo-jack.jpg',
    sala_nombre: 'Teatro Municipal 6 de Agosto / Sopocachi',
    estado: 'Finalizada',
  },
  {
    id_obra: 'hist-patrulla',
    titulo: 'Show Infantil: Patrulla Canina al Rescate',
    descripcion:
      'Obra infantil interactiva centrada en el trabajo en equipo, la solidaridad y el cuidado del entorno, diseñada especialmente para la primera infancia.',
    duracion_min: 65,
    publico_objetivo: 'Infantil',
    afiche_url: '/galeria/show-patrulla-canina.jpg',
    sala_nombre: 'Sala Principal Érase una Vez',
    estado: 'Finalizada',
  },
  {
    id_obra: 'hist-solidaria',
    titulo: 'Obra y Acción Solidaria por Navidad',
    descripcion:
      'Intervención escénica comunitaria y jornada de teatroterapia llevando alegría, dinámicas grupales y regalos navideños a niñas y niños de barrios altos de La Paz.',
    duracion_min: 90,
    publico_objetivo: 'Acción Social y Comunitaria',
    afiche_url: '/galeria/obra-solidaria-navidad.jpg',
    sala_nombre: 'Barrios y Comunidades de La Paz',
    estado: 'Finalizada',
  },
];

export default function Cartelera({ alSeleccionarFuncion }) {
  const { usuario } = useAuth();
  const [funciones, setFunciones] = useState([]);
  const [obras, setObras] = useState([]);
  const [filtroVista, setFiltroVista] = useState('cartelera'); // 'cartelera' | 'proximamente' | 'archivo'
  const [obraDetalle, setObraDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const [dataFunciones, dataObras] = await Promise.all([
          api.obtenerFunciones().catch(() => []),
          api.obtenerObras().catch(() => []),
        ]);
        setFunciones(Array.isArray(dataFunciones) ? dataFunciones : []);
        setObras(Array.isArray(dataObras) ? dataObras : []);
      } catch {
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
      (f.publico_objetivo && f.publico_objetivo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (f.sala && f.sala.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const obrasProximas = obras.filter(
    (o) =>
      (o.estado === 'Próximamente' || o.estado === 'En cartelera') &&
      (o.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (o.publico_objetivo && o.publico_objetivo.toLowerCase().includes(busqueda.toLowerCase())))
  );

  const obrasAntiguasBase = [
    ...obras.filter((o) => o.estado === 'Finalizada' || o.estado === 'INACTIVA'),
    ...ARCHIVO_HISTORICO_LOCAL.filter(
      (loc) => !obras.some((o) => o.titulo?.toLowerCase().trim() === loc.titulo.toLowerCase().trim())
    ),
  ];

  const obrasAntiguas = obrasAntiguasBase.filter(
    (o) =>
      o.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (o.publico_objetivo && o.publico_objetivo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (o.descripcion && o.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const imagenPorDefecto =
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teatro-900/60 border border-teatro-700/50 text-teatro-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-oro-400" />
          Repertorio y Cartelera Oficial
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-theater text-white">
          Obras en Cartelera y Archivo Histórico Teatral
        </h1>
        <p className="text-slate-300 text-sm">
          Adquiere boletos para nuestras próximas funciones o explora el archivo histórico de puestas en escena de la compañía para estudio de alumnos y personal administrativo.
        </p>

        {/* Selector Dinámico de Secciones */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setFiltroVista('cartelera')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              filtroVista === 'cartelera'
                ? 'bg-teatro-700 text-white border-teatro-500 shadow-lg shadow-teatro-900/50'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4 text-oro-400" />
            Funciones en Cartelera ({funciones.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroVista('proximamente')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              filtroVista === 'proximamente'
                ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-lg'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4 text-amber-400" />
            Repertorio Actual & Próximos Estrenos ({obrasProximas.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroVista('archivo')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              filtroVista === 'archivo'
                ? 'bg-indigo-700 text-white border-indigo-400 shadow-lg'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-indigo-300" />
            Archivo de Obras Antiguas ({obrasAntiguas.length})
          </button>
        </div>

        {/* Buscador */}
        <div className="pt-2 max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, público o teatro..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teatro-500 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Estados */}
      {cargando ? (
        <div className="text-center py-20 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-teatro-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Cargando repertorio teatral...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/60 border border-red-800 rounded-2xl text-center text-red-200 text-sm max-w-md mx-auto flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>{error}</span>
        </div>
      ) : filtroVista === 'cartelera' ? (
        /* VISTA 1: FUNCIONES PROGRAMADAS CON COMPRA DE ASIENTOS */
        funcionesFiltradas.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl max-w-lg mx-auto space-y-3">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-white font-medium text-sm">No se encontraron funciones programadas</p>
            <p className="text-xs text-slate-400">
              Puedes explorar el repertorio de obras antiguas o próximos estrenos en las pestañas superiores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {funcionesFiltradas.map((f) => (
              <div
                key={f.id_presentacion || f.id_funcion}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between hover:border-teatro-700/60 transition group"
              >
                <div className="relative h-56 overflow-hidden bg-slate-950">
                  <img
                    src={f.afiche_url || imagenPorDefecto}
                    alt={f.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/70 text-right shadow-lg">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                      Desde
                    </span>
                    <span className="text-base font-bold text-oro-400">Bs. {f.precio}</span>
                  </div>

                  <div className="absolute bottom-3 left-4">
                    <span className="text-[11px] font-semibold text-teatro-200 bg-teatro-900/90 px-3 py-1 rounded-full border border-teatro-700/60 shadow-sm">
                      {f.publico_objetivo || 'Público General'}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-theater text-xl font-bold text-white group-hover:text-teatro-300 transition">
                      {f.titulo}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {f.descripcion}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-oro-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {new Date(f.fecha).toLocaleDateString('es-BO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </span>
                      <span className="text-slate-500">&bull;</span>
                      <Clock className="w-4 h-4 text-oro-400 shrink-0 ml-1" />
                      <span>{f.hora_inicio} hrs</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teatro-400 shrink-0" />
                      <span className="truncate">
                        {f.sala} ({f.sala_direccion || 'La Paz'})
                      </span>
                    </div>

                    <button
                      onClick={() => alSeleccionarFuncion(f)}
                      className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-teatro-900/40 flex items-center justify-center gap-2 group/btn"
                    >
                      <Ticket className="w-4 h-4 text-oro-400 group-hover/btn:scale-110 transition-transform" />
                      Seleccionar Sector y Butacas
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* VISTA 2 y 3: ARCHIVO HISTÓRICO DE OBRAS ANTIGUAS O PRÓXIMOS ESTRENOS */
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-slate-900/90 border border-indigo-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-oro-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {filtroVista === 'archivo'
                    ? 'Archivo Histórico de Puestas en Escena (Acceso para Alumnos, Docentes y Administración)'
                    : 'Obras en Preparación y Repertorio Vigente'}
                </h3>
                <p className="text-xs text-slate-400">
                  {filtroVista === 'archivo'
                    ? 'Consulta la memoria escénica de Érase una Vez: obras musicales, infantiles y dramáticas presentadas en temporadas anteriores.'
                    : 'Conoce las obras que forman parte de la temporada actual y próximos montajes.'}
                </p>
              </div>
            </div>
            {usuario && (
              <span className="text-[11px] px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold self-start sm:self-auto">
                Vista habilitada para: {usuario.rol}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(filtroVista === 'archivo' ? obrasAntiguas : obrasProximas).map((o) => {
              const funcionActivaDeObra = funciones.find((f) => Number(f.id_obra) === Number(o.id_obra));
              return (
                <div
                  key={o.id_obra}
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between hover:border-oro-500/50 transition group"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-950">
                    <img
                      src={o.afiche_url || imagenPorDefecto}
                      alt={o.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                    <div className="absolute top-4 right-4">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-lg ${
                          o.estado === 'Finalizada'
                            ? 'bg-indigo-950/90 text-indigo-200 border-indigo-600'
                            : o.estado === 'Próximamente'
                            ? 'bg-amber-950/90 text-amber-300 border-amber-600'
                            : 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
                        }`}
                      >
                        {o.estado === 'Finalizada' ? '🏛️ Obra Histórica' : o.estado}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4">
                      <span className="text-[11px] font-semibold text-slate-200 bg-slate-950/85 px-3 py-1 rounded-full border border-slate-700">
                        {o.publico_objetivo || 'Familiar'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-theater text-xl font-bold text-white group-hover:text-oro-400 transition">
                        {o.titulo}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                        {o.descripcion ||
                          'Producción original de la Compañía de Teatro Érase una Vez presentada en los principales escenarios de La Paz.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-oro-400" />
                          Duración: <strong className="text-white">{o.duracion_min || 90} min</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-teatro-400" />
                          {o.publico_objetivo || 'Todo Público'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setObraDetalle(o)}
                          className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition border border-slate-700 flex items-center justify-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-oro-400" />
                          Ver Ficha de Obra
                        </button>
                        {funcionActivaDeObra && (
                          <button
                            type="button"
                            onClick={() => alSeleccionarFuncion(funcionActivaDeObra)}
                            className="py-2.5 px-3 bg-teatro-700 hover:bg-teatro-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1"
                          >
                            <Ticket className="w-3.5 h-3.5 text-oro-400" />
                            Boletos
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Ficha Artística y Pedagógica de Obra */}
      {obraDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative h-64 bg-slate-950">
              <img
                src={obraDetalle.afiche_url || imagenPorDefecto}
                alt={obraDetalle.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <button
                type="button"
                onClick={() => setObraDetalle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teatro-900/90 text-oro-400 border border-teatro-700">
                  {obraDetalle.estado === 'Finalizada'
                    ? 'Archivo Histórico • Temporada Anterior'
                    : obraDetalle.estado}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-theater text-white mt-2">
                  {obraDetalle.titulo}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3 text-center p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Duración</span>
                  <span className="font-bold text-white">{obraDetalle.duracion_min || 90} minutos</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Clasificación</span>
                  <span className="font-bold text-oro-400">
                    {obraDetalle.publico_objetivo || 'Familiar'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Estado en Repertorio</span>
                  <span className="font-bold text-emerald-400">{obraDetalle.estado}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-oro-400 uppercase tracking-wider">
                  Sinopsis y Memoria Escénica
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {obraDetalle.descripcion ||
                    'Puesta en escena de la Compañía de Teatro Érase una Vez, disponible en el repositorio histórico para consulta de nuestros alumnos de formación artística, docentes y dirección.'}
                </p>
              </div>

              <div className="p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl text-xs text-indigo-200 space-y-1">
                <strong className="text-white block">
                  📚 Material de Consulta para Alumnos y Plantel Docente:
                </strong>
                <p>
                  Esta obra forma parte del repertorio oficial de <strong>Érase una Vez</strong> y se utiliza como referencia de montaje, expresión corporal, caracterización de personajes y producción escénica en nuestros talleres de Sopocachi.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setObraDetalle(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
