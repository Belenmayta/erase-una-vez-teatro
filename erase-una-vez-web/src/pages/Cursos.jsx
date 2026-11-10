import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Heart,
} from 'lucide-react';

const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ETIQUETA_PUBLICO = {
  NINOS: 'Niños',
  JOVENES: 'Jóvenes y Mayores',
  ADULTOS: 'Adultos',
};

function formatearHora(horaStr) {
  if (!horaStr) return '';
  return horaStr.slice(0, 5);
}

export default function Cursos({ alAbrirLogin, alIrAMisEstudiantes }) {
  const { usuario, esAdmin, esRecepcion } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Modal de inscripción
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [misEstudiantes, setMisEstudiantes] = useState([]);
  const [idEstudianteElegido, setIdEstudianteElegido] = useState('');
  const [modoNuevoEstudiante, setModoNuevoEstudiante] = useState(false);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [ci, setCi] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [guardandoInscripcion, setGuardandoInscripcion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const cargarCursos = async () => {
    try {
      const data = await api.obtenerCursos();
      setCursos(data);
    } catch (err) {
      setError('Error al cargar catálogo de cursos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const abrirModalInscripcion = async (curso) => {
    if (!usuario) {
      alAbrirLogin();
      return;
    }
    setCursoSeleccionado(curso);
    setMensajeExito('');
    setError('');
    setModoNuevoEstudiante(false);

    try {
      const ests = await api.obtenerEstudiantes();
      setMisEstudiantes(ests);
      if (ests.length > 0) {
        setIdEstudianteElegido(ests[0].id_estudiante);
      } else {
        setModoNuevoEstudiante(true);
      }
    } catch (err) {
      setModoNuevoEstudiante(true);
    }
  };

  const manejarInscribir = async (e) => {
    e.preventDefault();
    setGuardandoInscripcion(true);
    setError('');
    try {
      let idEst = idEstudianteElegido;

      // Si es un nuevo estudiante, crearlo primero
      if (modoNuevoEstudiante) {
        const nuevo = await api.crearEstudiante({
          nombres,
          apellidos,
          ci,
          fecha_nacimiento: fechaNacimiento,
          telefono,
          tutor_nombre: tutorNombre,
          tutor_telefono: tutorTelefono,
        });
        idEst = nuevo.id_estudiante;
      }

      await api.inscribirEstudiante(cursoSeleccionado.id_curso, idEst);
      setMensajeExito('¡Inscripción confirmada exitosamente! Tu cupo en la Sala de Ensayos ha sido reservado.');
      await cargarCursos();
      setTimeout(() => {
        setCursoSeleccionado(null);
        setNombres('');
        setApellidos('');
        setCi('');
        setFechaNacimiento('');
        setTelefono('');
        setTutorNombre('');
        setTutorTelefono('');
        if (esAdmin) {
          alIrAMisEstudiantes();
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'No se pudo realizar la inscripción');
    } finally {
      setGuardandoInscripcion(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teatro-900/60 border border-teatro-700/50 text-teatro-300 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5 text-oro-400" />
          Academia y Formación Actoral
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-theater text-white">
          Talleres Artísticos y Teatroterapia
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          Nuestros cursos promueven el autoconocimiento, la desinhibición, la imaginación y la empatía.
          Diseñados para niñas, niños, adolescentes y adultos en nuestra sede de Sopocachi.
        </p>
      </div>

      {cargando ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          <div className="animate-spin w-8 h-8 border-2 border-teatro-500 border-t-transparent rounded-full mx-auto mb-3" />
          Cargando oferta académica...
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/60 border border-red-800 rounded-2xl text-center text-red-200 text-sm max-w-md mx-auto">
          {error}
        </div>
      ) : cursos.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto text-slate-400 text-sm">
          No hay cursos abiertos a inscripción actualmente.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cursos.map((c) => (
            <div
              key={c.id_curso}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-6 hover:border-teatro-700/60 transition group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teatro-300 bg-teatro-950/80 px-3 py-1 rounded-full border border-teatro-800">
                    Público: {ETIQUETA_PUBLICO[c.publico] || c.publico}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Mensualidad</span>
                    <span className="text-lg font-bold text-oro-400">Bs. {c.mensualidad} / mes</span>
                  </div>
                </div>

                <h3 className="font-theater text-xl font-bold text-white group-hover:text-teatro-300 transition">
                  {c.nombre}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {c.descripcion}
                </p>

                {/* Horarios y Sala */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                  <span className="text-[11px] font-semibold text-oro-400 block uppercase tracking-wider">
                    Horarios y Lugar de Clases:
                  </span>
                  {c.horarios?.length > 0 ? (
                    c.horarios.map((h) => (
                      <div key={h.id_horario} className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-oro-400 shrink-0" />
                        <span className="font-medium text-white">
                          {DIAS_SEMANA[h.dia_semana] || `Día ${h.dia_semana}`}: {formatearHora(h.hora_inicio)} a {formatearHora(h.hora_fin)} hrs
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">Horarios a coordinar</span>
                  )}
                  <div className="flex items-center gap-2 pt-1 text-teatro-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-teatro-400 shrink-0" />
                    <span>Sala de Ensayos (Sede Sopocachi)</span>
                  </div>
                </div>

                {/* Cupos */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Cupo disponible:</span>
                    <span className="font-semibold text-white">
                      {c.cupos_disponibles} de {c.cupo_maximo} cupos
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-oro-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((c.cupo_maximo - c.cupos_disponibles) / c.cupo_maximo) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {esRecepcion ? (
                <div className="w-full py-3 px-4 bg-slate-800 text-slate-400 rounded-xl text-xs text-center border border-slate-700 italic">
                  Modo Recepción — Consulta de horarios y cupos
                </div>
              ) : (
                <button
                  onClick={() => abrirModalInscripcion(c)}
                  disabled={c.cupos_disponibles <= 0}
                  className="w-full py-3 px-4 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-teatro-900/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {c.cupos_disponibles > 0 ? (
                    <>
                      <GraduationCap className="w-4 h-4 text-oro-400" />
                      {esAdmin ? 'Registrar / Inscribir Estudiante' : 'Inscribirme a este Taller'}
                    </>
                  ) : (
                    'Cupos Agotados'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Inscripción */}
      {cursoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Cabecera modal */}
            <div className="p-6 bg-gradient-to-r from-teatro-900 via-teatro-800 to-slate-900 border-b border-slate-700/60">
              <span className="text-[10px] text-oro-400 font-bold uppercase tracking-wider block">
                Inscripción de Estudiante
              </span>
              <h3 className="text-xl font-bold font-theater text-white mt-0.5">
                {cursoSeleccionado.nombre}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Mensualidad: <strong className="text-oro-400">Bs. {cursoSeleccionado.mensualidad}</strong> &bull; Público: {cursoSeleccionado.publico}
              </p>
            </div>

            {/* Contenido / Form */}
            <form onSubmit={manejarInscribir} className="p-6 overflow-y-auto space-y-4">
              {mensajeExito ? (
                <div className="p-4 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-sm rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{mensajeExito}</span>
                </div>
              ) : null}

              {error && (
                <div className="p-4 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Selector de estudiante o registrar nuevo */}
              {!modoNuevoEstudiante && misEstudiantes.length > 0 ? (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Seleccionar estudiante registrado:
                  </label>
                  <select
                    value={idEstudianteElegido}
                    onChange={(e) => setIdEstudianteElegido(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teatro-500"
                  >
                    {misEstudiantes.map((e) => (
                      <option key={e.id_estudiante} value={e.id_estudiante}>
                        {e.apellidos}, {e.nombres} {e.ci ? `(CI: ${e.ci})` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setModoNuevoEstudiante(true)}
                    className="text-xs text-oro-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> O registrar un nuevo participante / hijo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Datos del Estudiante / Participante
                    </span>
                    {misEstudiantes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setModoNuevoEstudiante(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ← Volver a lista
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Nombres *</label>
                      <input
                        type="text"
                        required
                        value={nombres}
                        onChange={(e) => setNombres(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                        placeholder="Ej. Mateo"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Apellidos *</label>
                      <input
                        type="text"
                        required
                        value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                        placeholder="Ej. Perez"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">CI</label>
                      <input
                        type="text"
                        value={ci}
                        onChange={(e) => setCi(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                        placeholder="Ej. 1234567 LP"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                      />
                    </div>
                  </div>

                  {cursoSeleccionado.publico === 'NINOS' || cursoSeleccionado.publico === 'JOVENES' ? (
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <span className="text-[11px] font-semibold text-oro-400 block uppercase">
                        Datos del Tutor / Apoderado (Menor de edad)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">Nombre Completo Tutor</label>
                          <input
                            type="text"
                            value={tutorNombre}
                            onChange={(e) => setTutorNombre(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                            placeholder="Ej. Maria Perez Rocha"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">Teléfono Tutor</label>
                          <input
                            type="tel"
                            value={tutorTelefono}
                            onChange={(e) => setTutorTelefono(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                            placeholder="Ej. 71234567"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Nota sobre pago de mensualidad */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                Al confirmar la inscripción, se creará la matrícula activa y se registrará la primera cuota mensual de{' '}
                <strong className="text-white">Bs. {cursoSeleccionado.mensualidad}</strong> en estado pendiente para pago en administración.
              </div>

              {/* Botones */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCursoSeleccionado(null)}
                  className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoInscripcion}
                  className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
                >
                  {guardandoInscripcion ? 'Inscribiendo...' : 'Confirmar Inscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
