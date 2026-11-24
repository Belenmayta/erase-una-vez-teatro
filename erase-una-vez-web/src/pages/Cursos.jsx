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
  LogOut,
  MailCheck,
  RefreshCw,
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
  const [misInscripciones, setMisInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [notificacionGeneral, setNotificacionGeneral] = useState('');
  const [desinscribiendoId, setDesinscribiendoId] = useState(null);

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
  const [correoEstudiante, setCorreoEstudiante] = useState('');
  const [estadoCorreoEst, setEstadoCorreoEst] = useState(null);
  const [verificandoCorreoEst, setVerificandoCorreoEst] = useState(false);
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [guardandoInscripcion, setGuardandoInscripcion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const cargarCursos = async () => {
    try {
      const promesas = [api.obtenerCursos()];
      if (usuario) {
        promesas.push(api.obtenerInscripciones().catch(() => []));
      }
      const [dataCursos, dataInsc] = await Promise.all(promesas);
      setCursos(Array.isArray(dataCursos) ? dataCursos : []);
      if (usuario && Array.isArray(dataInsc)) {
        setMisInscripciones(dataInsc.filter((i) => i.estado === 'ACTIVA'));
      } else {
        setMisInscripciones([]);
      }
    } catch (err) {
      setError('Error al cargar catálogo de cursos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCursos();
  }, [usuario?.id]);

  // Módulo para Desinscribirse de un Taller
  const manejarDesinscribir = async (inscripcion) => {
    const nombreAlumno = `${inscripcion.estudiante_nombres || ''} ${inscripcion.estudiante_apellidos || ''}`.trim();
    const confirmar = window.confirm(
      `¿Estás seguro de desinscribir a "${nombreAlumno || 'este participante'}" del taller "${inscripcion.curso_nombre}"?\n\nTu cupo será liberado inmediatamente.`
    );
    if (!confirmar) return;

    setDesinscribiendoId(inscripcion.id_inscripcion);
    setError('');
    setNotificacionGeneral('');
    try {
      const res = await api.desinscribirTaller(inscripcion.id_inscripcion);
      setNotificacionGeneral(
        res.mensaje || `Te has desinscrito exitosamente del taller "${inscripcion.curso_nombre}".`
      );
      await cargarCursos();
    } catch (err) {
      setError(err.message || 'No se pudo procesar la desinscripción del taller.');
    } finally {
      setDesinscribiendoId(null);
    }
  };

  const verificarCorreoParticipante = async (correoEval = correoEstudiante) => {
    const limpio = String(correoEval || '').trim().toLowerCase();
    if (!limpio) return true;
    setVerificandoCorreoEst(true);
    setEstadoCorreoEst(null);
    try {
      const res = await api.verificarCorreo(limpio, false);
      setEstadoCorreoEst({
        valido: true,
        mensaje: res.mensaje || 'Correo verificado (servidor MX activo)',
      });
      return true;
    } catch (err) {
      setEstadoCorreoEst({
        valido: false,
        mensaje: err.message || 'El correo ingresado no existe o su dominio no es válido',
      });
      return false;
    } finally {
      setVerificandoCorreoEst(false);
    }
  };

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
    setError('');

    // Validación estricta de parámetros si se registra un nuevo participante
    if (modoNuevoEstudiante) {
      const regexLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
      if (!nombres.trim() || nombres.trim().length < 2 || !regexLetras.test(nombres.trim())) {
        setError('El campo Nombres solo permite letras y espacios (mínimo 2 caracteres, sin números ni símbolos).');
        return;
      }
      if (!apellidos.trim() || apellidos.trim().length < 2 || !regexLetras.test(apellidos.trim())) {
        setError('El campo Apellidos solo permite letras y espacios (mínimo 2 caracteres, sin números ni símbolos).');
        return;
      }
      if (ci.trim() && !/^\d{5,10}(?:-[0-9A-Za-z]{1,2})?(?:\s?(?:LP|CB|SC|OR|PT|TJ|CH|BE|PD))?$/i.test(ci.trim())) {
        setError('El C.I. debe contener entre 5 y 10 dígitos numéricos (ej. 6543210 LP).');
        return;
      }
      if (!fechaNacimiento) {
        setError('Debe indicar la fecha de nacimiento del participante.');
        return;
      }
      const fn = new Date(fechaNacimiento);
      const edadAnios = (Date.now() - fn.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (isNaN(fn.getTime()) || edadAnios < 3 || edadAnios > 95) {
        setError('Ingrese una fecha de nacimiento válida (edad permitida entre 3 y 95 años).');
        return;
      }

      const esMenor = cursoSeleccionado.publico === 'NINOS' || cursoSeleccionado.publico === 'JOVENES';
      const telContacto = (esMenor ? tutorTelefono || telefono : telefono || tutorTelefono)
        .replace(/[\s\-()]/g, '')
        .replace(/^\+?591/, '');

      if (!/^[67]\d{7}$/.test(telContacto)) {
        setError('Debe ingresar un número de celular válido de Bolivia (8 dígitos comenzando con 6 o 7).');
        return;
      }

      if (esMenor && tutorNombre.trim() && !regexLetras.test(tutorNombre.trim())) {
        setError('El nombre del tutor solo debe contener letras y espacios.');
        return;
      }

      if (correoEstudiante.trim()) {
        const okMail = await verificarCorreoParticipante(correoEstudiante);
        if (!okMail) {
          setError('El correo electrónico ingresado no existe o su dominio no recibe correos.');
          return;
        }
      }
    }

    setGuardandoInscripcion(true);
    try {
      let idEst = idEstudianteElegido;

      // Si es un nuevo estudiante, crearlo primero
      if (modoNuevoEstudiante) {
        const nuevo = await api.crearEstudiante({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          ci: ci.trim() || null,
          fecha_nacimiento: fechaNacimiento,
          telefono: telefono.trim() || tutorTelefono.trim(),
          correo: correoEstudiante.trim() || usuario?.correo || null,
          tutor_nombre: tutorNombre.trim() || null,
          tutor_telefono: tutorTelefono.trim() || telefono.trim() || null,
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
        setCorreoEstudiante('');
        setEstadoCorreoEst(null);
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

      {/* Afiches Oficiales Destacados: Taller para Adultos Mayores y Campaña Psicológica Gratuita */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-teatro-300/30 rounded-3xl overflow-hidden shadow-xl flex flex-col sm:flex-row">
          <img
            src="/galeria/afiche-taller-adultos-mayores.jpg"
            alt="Taller para Adultos Mayores - Érase una Vez"
            className="w-full sm:w-44 h-60 sm:h-auto object-cover bg-slate-950 shrink-0"
          />
          <div className="p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-slab text-oro-400">
                ¡Pensamos en ellos también!
              </span>
              <h3 className="text-lg font-bold font-theater text-white">
                Taller Especial para Adultos Mayores
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Incluye <strong>Zumba para la tercera edad</strong>, <strong>Teatro terapia</strong>, <strong>Canto</strong> y <strong>Danza</strong> en un ambiente cálido y seguro.
              </p>
            </div>
            <div className="text-[11px] font-slab text-teatro-300 space-y-0.5 pt-2 border-t border-slate-800">
              <div>📍 Aspiazu esq. 20 de Octubre, Edif. Aspiazu PB</div>
              <div>📞 Informes y WhatsApp: <strong className="text-oro-400">69995091</strong></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-teatro-300/30 rounded-3xl overflow-hidden shadow-xl flex flex-col sm:flex-row">
          <img
            src="/galeria/afiche-campana-psicologica.jpg"
            alt="Gran campaña de evaluación psicológica gratuita - Érase una Vez"
            className="w-full sm:w-44 h-60 sm:h-auto object-cover bg-slate-950 shrink-0"
          />
          <div className="p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-slab text-oro-400">
                Apoyo Psicológico y Teatroterapia
              </span>
              <h3 className="text-lg font-bold font-theater text-white">
                Campaña de Evaluación Psicológica Gratuita
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Atención a <strong>Niños</strong> (conducta, bullying), <strong>Jóvenes y Adultos</strong> (ansiedad, estrés, anorexia, bulimia) y <strong>Adultos Mayores</strong> (depresión, Alzheimer, terapia ocupacional).
              </p>
            </div>
            <div className="text-[11px] font-slab text-teatro-300 space-y-0.5 pt-2 border-t border-slate-800">
              <div>📍 Aspiazu esq. 20 de Octubre, Edif. Aspiazu PB</div>
              <div>📞 Solicita tu turno: <strong className="text-oro-400">69995091 - 60646087</strong></div>
            </div>
          </div>
        </div>
      </div>

      {notificacionGeneral && (
        <div className="max-w-4xl mx-auto p-4 bg-emerald-950/80 border border-emerald-600/80 text-emerald-200 text-sm rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notificacionGeneral}</span>
        </div>
      )}

      {/* Módulo de Mis Inscripciones Activas y Desinscripción de Talleres */}
      {usuario && misInscripciones.length > 0 && (
        <div className="max-w-5xl mx-auto bg-slate-900/95 border border-teatro-700/60 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-oro-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Módulo de Gestión y Desinscripción de Talleres
              </span>
              <h2 className="text-lg font-bold font-theater text-white">
                {esAdmin ? 'Inscripciones Activas en Talleres' : 'Mis Talleres Inscritos'} ({misInscripciones.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Puedes darte de baja / desinscribirte de un taller en cualquier momento para liberar el cupo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {misInscripciones.map((insc) => (
              <div
                key={insc.id_inscripcion}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white">{insc.curso_nombre}</div>
                  <div className="text-xs text-slate-300">
                    Participante:{' '}
                    <strong className="text-oro-400">
                      {insc.estudiante_nombres} {insc.estudiante_apellidos}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Inscrito el {String(insc.fecha_inscripcion).slice(0, 10)} &bull; Mensualidad: Bs. {insc.mensualidad}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => manejarDesinscribir(insc)}
                  disabled={desinscribiendoId === insc.id_inscripcion}
                  className="px-3 py-2 bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-700/70 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  {desinscribiendoId === insc.id_inscripcion ? 'Procesando...' : 'Desinscribirme'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nombres (solo letras) *
                      </label>
                      <input
                        type="text"
                        required
                        value={nombres}
                        onChange={(e) =>
                          setNombres(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''))
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                        placeholder="Ej. Mateo"
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
                        onChange={(e) =>
                          setApellidos(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''))
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                        placeholder="Ej. Pérez"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        C.I. (5 a 10 dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        value={ci}
                        onChange={(e) => setCi(e.target.value.replace(/[^0-9A-Za-z\-\s]/g, ''))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                        placeholder="Ej. 6543210 LP"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        required
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Celular Contacto (8 dígitos) *
                      </label>
                      <input
                        type="tel"
                        required={cursoSeleccionado.publico === 'ADULTOS'}
                        maxLength={8}
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                        placeholder="Ej. 71234567"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-300">
                          Correo Electrónico
                        </label>
                        {correoEstudiante && (
                          <button
                            type="button"
                            onClick={() => verificarCorreoParticipante(correoEstudiante)}
                            disabled={verificandoCorreoEst}
                            className="text-[10px] text-oro-400 hover:underline flex items-center gap-0.5"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${verificandoCorreoEst ? 'animate-spin' : ''}`} />
                            Verificar MX
                          </button>
                        )}
                      </div>
                      <input
                        type="email"
                        value={correoEstudiante}
                        onChange={(e) => {
                          setCorreoEstudiante(e.target.value);
                          setEstadoCorreoEst(null);
                        }}
                        onBlur={() => {
                          if (correoEstudiante.includes('@')) {
                            verificarCorreoParticipante(correoEstudiante);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                        placeholder="alumno@gmail.com"
                      />
                    </div>
                  </div>

                  {estadoCorreoEst && (
                    <div
                      className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                        estadoCorreoEst.valido
                          ? 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300'
                          : 'bg-red-950/70 border border-red-700/60 text-red-300'
                      }`}
                    >
                      <MailCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{estadoCorreoEst.mensaje}</span>
                    </div>
                  )}

                  {cursoSeleccionado.publico === 'NINOS' || cursoSeleccionado.publico === 'JOVENES' ? (
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <span className="text-[11px] font-semibold text-oro-400 block uppercase">
                        Datos del Tutor / Apoderado (Menor de edad)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Nombre Completo Tutor (solo letras) *
                          </label>
                          <input
                            type="text"
                            required
                            value={tutorNombre}
                            onChange={(e) =>
                              setTutorNombre(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''))
                            }
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                            placeholder="Ej. María Pérez Rocha"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Celular Tutor (8 dígitos: 6 o 7) *
                          </label>
                          <input
                            type="tel"
                            required
                            maxLength={8}
                            value={tutorTelefono}
                            onChange={(e) =>
                              setTutorTelefono(e.target.value.replace(/\D/g, '').slice(0, 8))
                            }
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
