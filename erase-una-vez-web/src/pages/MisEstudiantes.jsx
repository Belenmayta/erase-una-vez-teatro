import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  AlertCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';

export default function MisEstudiantes({ alAbrirLogin, alIrACursos }) {
  const { usuario, esAdmin } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [mensualidades, setMensualidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  // Form nuevo estudiante
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [ci, setCi] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [idCursoInicial, setIdCursoInicial] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    if (!usuario || !esAdmin) {
      setCargando(false);
      return;
    }
    try {
      setError('');
      const [dataEst, dataInsc, dataMens, dataCursos] = await Promise.all([
        api.obtenerEstudiantes(),
        api.obtenerInscripciones(),
        api.obtenerMensualidades(),
        api.obtenerCursos(),
      ]);
      setEstudiantes(dataEst);
      setInscripciones(dataInsc);
      setMensualidades(dataMens);
      setCursos(dataCursos);
    } catch (err) {
      if (err.status === 401) {
        alAbrirLogin();
      } else {
        setError(err.message || 'Error al cargar información de estudiantes');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [usuario, esAdmin]);

  const crearEstudiante = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const nuevo = await api.crearEstudiante({
        nombres,
        apellidos,
        ci,
        fecha_nacimiento: fechaNacimiento,
        telefono,
        tutor_nombre: tutorNombre,
        tutor_telefono: tutorTelefono,
      });

      if (idCursoInicial) {
        await api.inscribirEstudiante(Number(idCursoInicial), nuevo.id_estudiante);
      }

      setMostrarModalNuevo(false);
      setNombres('');
      setApellidos('');
      setCi('');
      setFechaNacimiento('');
      setTelefono('');
      setTutorNombre('');
      setTutorTelefono('');
      setIdCursoInicial('');
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error al registrar estudiante');
    } finally {
      setGuardando(false);
    }
  };

  const cobrarCuota = async (idMensualidad) => {
    try {
      await api.cobrarMensualidad(idMensualidad);
      cargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el cobro');
    }
  };

  if (!usuario || !esAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-oro-400 mx-auto" />
        <h3 className="text-xl font-bold font-theater text-white">Acceso Exclusivo de Administración</h3>
        <p className="text-xs text-slate-300">
          El registro de estudiantes e inscripción a talleres está reservado únicamente para la Administración del teatro.
        </p>
        {!usuario ? (
          <button
            onClick={alAbrirLogin}
            className="px-5 py-2.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold"
          >
            Iniciar Sesión como Administrador
          </button>
        ) : (
          <button
            onClick={alIrACursos}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
          >
            Ver Catálogo de Talleres
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teatro-900/60 border border-teatro-700/50 text-teatro-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-oro-400" />
            Gestión Académica (Administrador)
          </div>
          <h1 className="text-3xl font-bold font-theater text-white mt-1">
            Estudiantes Inscritos y Mensualidades
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Registra nuevos estudiantes, inscríbelos en los talleres de formación artística y controla sus pagos mensuales.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="px-4 py-2 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-teatro-900/40"
          >
            <Plus className="w-4 h-4" /> Registrar Participante
          </button>
          <button
            onClick={alIrACursos}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            Ver Talleres
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl text-center text-red-200 text-sm max-w-md mx-auto">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          <div className="animate-spin w-8 h-8 border-2 border-teatro-500 border-t-transparent rounded-full mx-auto mb-3" />
          Cargando estudiantes y mensualidades...
        </div>
      ) : estudiantes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-md mx-auto space-y-4">
          <User className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white font-theater">No hay estudiantes registrados</h3>
          <p className="text-xs text-slate-400">
            Registra participantes para inscribirlos en los talleres de Formación Artística en la Sala de Ensayos.
          </p>
          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="px-4 py-2 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold"
          >
            Registrar Primer Estudiante
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {estudiantes.map((est) => {
            const inscs = inscripciones.filter((i) => i.id_estudiante === est.id_estudiante);
            const mens = mensualidades.filter((m) => m.id_estudiante === est.id_estudiante);

            return (
              <div
                key={est.id_estudiante}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
              >
                {/* Cabecera Estudiante */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teatro-900/80 border border-teatro-700/60 flex items-center justify-center text-teatro-300 font-bold text-lg">
                      {est.nombres.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-theater text-white">
                        {est.nombres} {est.apellidos}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                        {est.ci && <span>CI: {est.ci}</span>}
                        {est.fecha_nacimiento && (
                          <span>F. Nac: {String(est.fecha_nacimiento).slice(0, 10)}</span>
                        )}
                        {est.tutor_nombre && (
                          <span className="text-teatro-300">Tutor: {est.tutor_nombre}</span>
                        )}
                        {est.tutor_telefono && (
                          <span>Tel: {est.tutor_telefono}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 self-start sm:self-auto">
                    {inscs.length} taller(es) matriculado(s)
                  </span>
                </div>

                {/* Cursos Matriculados */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-oro-400 uppercase tracking-wider">
                    Talleres Activos:
                  </h4>
                  {inscs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Aún no está inscrito en ningún taller.{' '}
                      <button onClick={alIrACursos} className="text-oro-400 hover:underline">
                        Inscribir desde catálogo de talleres
                      </button>
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {inscs.map((i) => (
                        <div
                          key={i.id_inscripcion}
                          className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between"
                        >
                          <div>
                            <span className="text-sm font-bold text-white block">{i.curso_nombre}</span>
                            <span className="text-xs text-slate-400">
                              Matrícula desde: {String(i.fecha_inscripcion).slice(0, 10)} &bull; Bs. {i.mensualidad}/mes
                            </span>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                            {i.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mensualidades */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-oro-400 uppercase tracking-wider">
                    Control de Cuotas Mensuales:
                  </h4>
                  {mens.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No hay cuotas registradas.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                          <tr>
                            <th className="p-3 rounded-l-xl">Período</th>
                            <th className="p-3">Taller</th>
                            <th className="p-3">Monto</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 rounded-r-xl">Fecha de Pago / Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {mens.map((m) => (
                            <tr key={m.id_mensualidad} className="hover:bg-slate-800/30">
                              <td className="p-3 font-semibold text-white">
                                Mes {m.mes}/{m.anio}
                              </td>
                              <td className="p-3 text-slate-300">{m.curso_nombre}</td>
                              <td className="p-3 font-bold text-oro-400">Bs. {m.monto}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                    m.estado === 'PAGADA'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                                  }`}
                                >
                                  {m.estado}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">
                                {m.estado === 'PAGADA' ? (
                                  <span>Pagado ({String(m.fecha_pago).slice(0, 10)})</span>
                                ) : (
                                  <button
                                    onClick={() => cobrarCuota(m.id_mensualidad)}
                                    className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition"
                                  >
                                    Registrar Cobro
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Nuevo Estudiante */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold font-theater text-white">
              Registrar Nuevo Estudiante / Participante
            </h3>
            <form onSubmit={crearEstudiante} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                    placeholder="Ej. Lucas"
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
                    placeholder="Ej. Mamani"
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
                    placeholder="Ej. 1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Tutor / Apoderado</label>
                <input
                  type="text"
                  value={tutorNombre}
                  onChange={(e) => setTutorNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  placeholder="Ej. Roberto Mamani"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono Tutor / Contacto</label>
                <input
                  type="tel"
                  value={tutorTelefono}
                  onChange={(e) => setTutorTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  placeholder="Ej. 70000000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-oro-400 mb-1">
                  Inscribir directamente a un Taller (Opcional)
                </label>
                <select
                  value={idCursoInicial}
                  onChange={(e) => setIdCursoInicial(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                >
                  <option value="">-- Solo registrar estudiante --</option>
                  {cursos.map((c) => (
                    <option key={c.id_curso} value={c.id_curso}>
                      {c.nombre} (Bs. {c.mensualidad}/mes)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="w-1/3 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-2/3 py-2 px-4 bg-teatro-700 hover:bg-teatro-600 text-white font-bold rounded-xl text-xs transition"
                >
                  {guardando ? 'Guardando...' : 'Guardar Estudiante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
