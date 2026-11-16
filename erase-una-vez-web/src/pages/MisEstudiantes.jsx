import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { generarReportePDF, generarCertificadoPDF } from '../utils/exportarPDF';
import {
  GraduationCap,
  User,
  Plus,
  ShieldCheck,
  Award,
  FileText,
  Mail,
  CheckCircle2,
  TrendingUp,
  Search,
  Send,
  Copy,
  ExternalLink,
  X,
  ClipboardCheck,
} from 'lucide-react';

export default function MisEstudiantes({ alAbrirLogin, alIrACursos }) {
  const { usuario, esAdmin, esDocente } = useAuth();
  const puedeGestionar = esAdmin || esDocente;

  const [estudiantes, setEstudiantes] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [mensualidades, setMensualidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Filtros dinámicos
  const [busqueda, setBusqueda] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('TODOS');
  const [filtroVista, setFiltroVista] = useState('TODOS'); // 'TODOS' | 'CULMINADOS' | 'CON_CERTIFICADO' | 'MORA'

  // Modal nuevo estudiante
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [ci, setCi] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [tutorNombre, setTutorNombre] = useState('');
  const [tutorTelefono, setTutorTelefono] = useState('');
  const [idCursoInicial, setIdCursoInicial] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Modal de Evaluación de Crecimiento, Asistencia y Certificado
  const [inscripcionEvaluar, setInscripcionEvaluar] = useState(null);
  const [evalForm, setEvalForm] = useState({
    clases_asistidas: 0,
    clases_totales: 16,
    eval_expresion: 80,
    eval_voz: 80,
    eval_improvisacion: 80,
    eval_compromiso: 85,
    nivel_crecimiento: 'EN PROCESO',
    observaciones_docente: '',
    culmino_taller: false,
    certificado_otorgado: false,
  });
  const [guardandoEval, setGuardandoEval] = useState(false);

  // Modal de Correo de Recordatorio de Pago
  const [modalCorreo, setModalCorreo] = useState(null); // { notificacion, estudiante, periodo, monto }
  const [modalMasivo, setModalMasivo] = useState(null); // { recordatorios }

  const notificar = (msg) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(''), 4500);
  };

  const cargarDatos = async () => {
    if (!usuario || !puedeGestionar) {
      setCargando(false);
      return;
    }
    try {
      setError('');
      const [dataEst, dataInsc, dataMens, dataCursos] = await Promise.all([
        api.obtenerEstudiantes(),
        api.obtenerInscripciones(),
        api.obtenerMensualidades(),
        api.obtenerCursos(true),
      ]);
      setEstudiantes(Array.isArray(dataEst) ? dataEst : []);
      setInscripciones(Array.isArray(dataInsc) ? dataInsc : []);
      setMensualidades(Array.isArray(dataMens) ? dataMens : []);
      setCursos(Array.isArray(dataCursos) ? dataCursos : []);
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
  }, [usuario, puedeGestionar]);

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
        correo,
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
      setCorreo('');
      setTutorNombre('');
      setTutorTelefono('');
      setIdCursoInicial('');
      notificar('Participante registrado exitosamente');
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error al registrar estudiante');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEvaluacion = (insc) => {
    setInscripcionEvaluar(insc);
    setEvalForm({
      clases_asistidas: Number(insc.clases_asistidas || 0),
      clases_totales: Number(insc.clases_totales || 16),
      eval_expresion: Number(insc.eval_expresion || 80),
      eval_voz: Number(insc.eval_voz || 80),
      eval_improvisacion: Number(insc.eval_improvisacion || 80),
      eval_compromiso: Number(insc.eval_compromiso || 85),
      nivel_crecimiento: insc.nivel_crecimiento || 'EN PROCESO',
      observaciones_docente: insc.observaciones_docente || '',
      culmino_taller: Boolean(insc.culmino_taller),
      certificado_otorgado: Boolean(insc.certificado_otorgado),
    });
  };

  const guardarEvaluacion = async (e) => {
    e.preventDefault();
    if (!inscripcionEvaluar) return;
    setGuardandoEval(true);
    try {
      await api.actualizarSeguimientoInscripcion(inscripcionEvaluar.id_inscripcion, evalForm);
      setInscripcionEvaluar(null);
      notificar('Evaluación de crecimiento, asistencia y certificación guardada con éxito');
      cargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la evaluación');
    } finally {
      setGuardandoEval(false);
    }
  };

  const marcarAsistenciaRapida = async (idInscripcion, delta) => {
    try {
      await api.registrarAsistenciaRapida(idInscripcion, delta);
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error al actualizar asistencia');
    }
  };

  const cobrarCuota = async (idMensualidad, metodo = 'EFECTIVO / QR') => {
    try {
      await api.cobrarMensualidad(idMensualidad, { metodo_pago: metodo });
      notificar('Cobro de mensualidad registrado exitosamente');
      cargarDatos();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el cobro');
    }
  };

  const generarRecordatorioIndividual = async (m) => {
    try {
      const res = await api.enviarRecordatorioCorreo(m.id_mensualidad);
      setModalCorreo({
        notificacion: res.notificacion,
        estudiante: `${m.estudiante_nombres} ${m.estudiante_apellidos}`,
        curso: m.curso_nombre,
        periodo: `${m.mes}/${m.anio}`,
        monto: m.monto,
      });
      cargarDatos();
    } catch (err) {
      setError(err.message || 'Error al generar el correo de recordatorio');
    }
  };

  const generarRecordatorioTodos = async () => {
    try {
      const res = await api.enviarRecordatorioMasivo();
      if (res.recordatorios?.length > 0) {
        setModalMasivo(res.recordatorios);
        notificar(res.mensaje);
        cargarDatos();
      } else {
        notificar('Todos los estudiantes están al día con sus pagos.');
      }
    } catch (err) {
      setError(err.message || 'Error al generar recordatorios masivos');
    }
  };

  const exportarInformeTalleresPDF = () => {
    const totalInsc = inscripciones.length;
    const culminados = inscripciones.filter((i) => i.culmino_taller).length;
    const certificados = inscripciones.filter((i) => i.certificado_otorgado).length;
    const promAsist =
      totalInsc > 0
        ? (
            inscripciones.reduce((s, i) => s + Number(i.asistencia_porcentaje || 0), 0) / totalInsc
          ).toFixed(1)
        : 0;

    generarReportePDF({
      titulo: 'Informe Académico de Talleres: Asistencia, Evaluaciones y Certificados',
      subtitulo:
        'Control de asistencia, crecimiento escénico, alumnos que culminaron y certificados otorgados',
      kpis: [
        { etiqueta: 'Matrículas Totales', valor: totalInsc },
        { etiqueta: 'Promedio Asistencia', valor: `${promAsist}%` },
        { etiqueta: 'Culminaron Taller', valor: culminados },
        { etiqueta: 'Certificados Emitidos', valor: certificados },
      ],
      columnas: [
        'Estudiante',
        'CI',
        'Taller Artístico',
        'Asistencia',
        'Nota Crecimiento',
        'Nivel Alcanzado',
        '¿Culminó?',
        'Certificado Otorgado',
      ],
      filas: inscripciones.map((i) => [
        `${i.estudiante_apellidos || ''} ${i.estudiante_nombres || ''}`.trim(),
        i.estudiante_ci || 'S/N',
        i.curso_nombre,
        `${i.clases_asistidas || 0}/${i.clases_totales || 16} (${i.asistencia_porcentaje || 0}%)`,
        `${i.nota_final || 0} / 100`,
        i.nivel_crecimiento || 'EN PROCESO',
        i.culmino_taller ? 'SÍ CULMINÓ' : 'En curso',
        i.certificado_otorgado ? `SÍ (${i.codigo_certificado || 'Emitido'})` : 'Pendiente',
      ]),
    });
  };

  const exportarPagosEstudiantesPDF = () => {
    const pagadas = mensualidades.filter((m) => m.estado === 'PAGADA');
    const pendientes = mensualidades.filter((m) => m.estado === 'PENDIENTE');
    const totalRecaudado = pagadas.reduce((s, m) => s + Number(m.monto || 0), 0).toFixed(2);
    const totalPorCobrar = pendientes.reduce((s, m) => s + Number(m.monto || 0), 0).toFixed(2);

    generarReportePDF({
      titulo: 'Reporte de Control de Pagos y Mensualidades de Estudiantes',
      subtitulo: 'Estado de cuotas mensuales, cobros realizados y seguimiento de pagos pendientes',
      kpis: [
        { etiqueta: 'Total Cuotas', valor: mensualidades.length },
        { etiqueta: 'Cuotas Pagadas', valor: pagadas.length },
        { etiqueta: 'En Retraso / Pendientes', valor: pendientes.length },
        { etiqueta: 'Recaudado / Por Cobrar', valor: `Bs. ${totalRecaudado} / Bs. ${totalPorCobrar}` },
      ],
      columnas: [
        'Estudiante',
        'Tutor / Contacto',
        'Correo',
        'Taller',
        'Período',
        'Monto',
        'Estado',
        'Fecha Pago / Recordatorios',
      ],
      filas: mensualidades.map((m) => [
        `${m.estudiante_apellidos || ''} ${m.estudiante_nombres || ''}`.trim(),
        `${m.tutor_nombre || 'Titular'} (${m.tutor_telefono || m.estudiante_telefono || 'S/N'})`,
        m.estudiante_correo || m.tutor_correo || 'Sin correo',
        m.curso_nombre,
        `${m.mes}/${m.anio}`,
        `Bs. ${m.monto}`,
        m.estado,
        m.estado === 'PAGADA'
          ? `Pagado (${String(m.fecha_pago || '').slice(0, 10)})`
          : `${m.cantidad_recordatorios || 0} recordatorio(s)`,
      ]),
    });
  };

  if (!usuario || !puedeGestionar) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-oro-400 mx-auto" />
        <h3 className="text-xl font-bold font-theater text-white">
          Acceso Exclusivo Docente y Administración
        </h3>
        <p className="text-xs text-slate-300">
          El control académico de talleres, evaluación de crecimiento, certificados y pagos está reservado para el plantel docente y la dirección del teatro.
        </p>
        {!usuario ? (
          <button
            onClick={alAbrirLogin}
            className="px-5 py-2.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold"
          >
            Iniciar Sesión
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

  // Filtrado dinámico de estudiantes
  const estudiantesFiltrados = estudiantes.filter((est) => {
    const inscs = inscripciones.filter((i) => i.id_estudiante === est.id_estudiante);
    const mens = mensualidades.filter((m) => m.id_estudiante === est.id_estudiante);

    const coincideTexto =
      !busqueda.trim() ||
      `${est.nombres} ${est.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(est.ci || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      String(est.tutor_nombre || '').toLowerCase().includes(busqueda.toLowerCase());

    const coincideCurso =
      filtroCurso === 'TODOS' || inscs.some((i) => String(i.id_curso) === String(filtroCurso));

    let coincideVista = true;
    if (filtroVista === 'CULMINADOS') {
      coincideVista = inscs.some((i) => i.culmino_taller);
    } else if (filtroVista === 'CON_CERTIFICADO') {
      coincideVista = inscs.some((i) => i.certificado_otorgado);
    } else if (filtroVista === 'MORA') {
      coincideVista = mens.some((m) => m.estado === 'PENDIENTE');
    }

    return coincideTexto && coincideCurso && coincideVista;
  });

  const totalCulminados = inscripciones.filter((i) => i.culmino_taller).length;
  const totalCertificados = inscripciones.filter((i) => i.certificado_otorgado).length;
  const totalPendientesPago = mensualidades.filter((m) => m.estado === 'PENDIENTE').length;
  const promedioAsistenciaGeneral =
    inscripciones.length > 0
      ? Math.round(
          inscripciones.reduce((acc, i) => acc + Number(i.asistencia_porcentaje || 0), 0) /
            inscripciones.length
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teatro-900/60 border border-teatro-700/50 text-teatro-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-oro-400" />
            Control Académico, Crecimiento Escénico y Mensualidades
          </div>
          <h1 className="text-3xl font-bold font-theater text-white mt-1">
            Seguimiento de Estudiantes, Certificados y Pagos
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Evalúa el progreso de cada alumno, controla su asistencia, emite certificados oficiales y envía recordatorios de pago por correo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportarInformeTalleresPDF}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-oro-400 rounded-xl text-xs font-bold border border-oro-500/40 transition flex items-center gap-1.5 shadow"
          >
            <FileText className="w-4 h-4" /> Informe Talleres (PDF)
          </button>

          <button
            type="button"
            onClick={exportarPagosEstudiantesPDF}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/40 transition flex items-center gap-1.5 shadow"
          >
            <FileText className="w-4 h-4" /> Reporte Pagos (PDF)
          </button>

          {esAdmin && totalPendientesPago > 0 && (
            <button
              type="button"
              onClick={generarRecordatorioTodos}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg"
            >
              <Mail className="w-4 h-4" /> Recordar Pagos ({totalPendientesPago})
            </button>
          )}

          <button
            type="button"
            onClick={() => setMostrarModalNuevo(true)}
            className="px-4 py-2 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-teatro-900/40"
          >
            <Plus className="w-4 h-4" /> Registrar Participante
          </button>
        </div>
      </div>

      {/* Resumen de Indicadores Académicos y Financieros */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Alumnos Registrados
          </span>
          <span className="text-2xl font-black text-white font-mono">{estudiantes.length}</span>
          <span className="text-[11px] text-slate-500 block">En formación artística</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Asistencia Promedio
          </span>
          <span className="text-2xl font-black text-sky-400 font-mono">
            {promedioAsistenciaGeneral}%
          </span>
          <span className="text-[11px] text-slate-500 block">En Sala de Ensayos</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Culminaron Taller
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono">{totalCulminados}</span>
          <span className="text-[11px] text-slate-500 block">Módulos aprobados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Certificados Otorgados
          </span>
          <span className="text-2xl font-black text-oro-400 font-mono">{totalCertificados}</span>
          <span className="text-[11px] text-slate-500 block">Con código oficial</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 col-span-2 md:col-span-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Cuotas Pendientes
          </span>
          <span className="text-2xl font-black text-amber-400 font-mono">{totalPendientesPago}</span>
          <span className="text-[11px] text-slate-500 block">Por cobrar / recordar</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar alumno por nombre, CI o tutor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-oro-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
          >
            <option value="TODOS">Todos los Talleres</option>
            {cursos.map((c) => (
              <option key={c.id_curso} value={c.id_curso}>
                {c.nombre}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'CULMINADOS', label: '✓ Culminaron' },
              { id: 'CON_CERTIFICADO', label: '🎓 Con Certificado' },
              { id: 'MORA', label: '⚠️ Pago Pendiente' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroVista(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filtroVista === f.id
                    ? 'bg-teatro-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-600 rounded-2xl text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl text-center text-red-200 text-sm">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          <div className="animate-spin w-8 h-8 border-2 border-teatro-500 border-t-transparent rounded-full mx-auto mb-3" />
          Cargando estudiantes, evaluaciones y mensualidades...
        </div>
      ) : estudiantesFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-md mx-auto space-y-4">
          <User className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white font-theater">
            No se encontraron estudiantes con este filtro
          </h3>
          <button
            onClick={() => {
              setFiltroVista('TODOS');
              setFiltroCurso('TODOS');
              setBusqueda('');
            }}
            className="px-4 py-2 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold"
          >
            Ver Todos los Estudiantes
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {estudiantesFiltrados.map((est) => {
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
                        {est.correo && <span className="text-sky-400">✉️ {est.correo}</span>}
                        {est.tutor_nombre && (
                          <span className="text-teatro-300">Tutor: {est.tutor_nombre}</span>
                        )}
                        {(est.tutor_telefono || est.telefono) && (
                          <span>📞 {est.tutor_telefono || est.telefono}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {inscs.length} taller(es)
                    </span>
                  </div>
                </div>

                {/* Talleres, Asistencia, Evaluación de Crecimiento y Certificados */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-oro-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Seguimiento Académico, Asistencia y Certificados:
                  </h4>

                  {inscs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Aún no está inscrito en ningún taller.{' '}
                      <button onClick={alIrACursos} className="text-oro-400 hover:underline">
                        Inscribir desde catálogo de talleres
                      </button>
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {inscs.map((i) => {
                        const porcAsist = Number(i.asistencia_porcentaje || 0);
                        const nota = Number(i.nota_final || 0);
                        return (
                          <div
                            key={i.id_inscripcion}
                            className="p-5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-4"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-base font-bold text-white">
                                    {i.curso_nombre}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                      i.culmino_taller
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                        : 'bg-sky-950 text-sky-300 border-sky-700'
                                    }`}
                                  >
                                    {i.culmino_taller ? '✓ TALLER CULMINADO' : i.estado}
                                  </span>
                                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-oro-400 border border-amber-700/60">
                                    Nivel: {i.nivel_crecimiento || 'EN PROCESO'}
                                  </span>
                                  {i.certificado_otorgado && (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-oro-400 text-slate-950">
                                      🎓 Certificado: {i.codigo_certificado}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 block mt-1">
                                  Matrícula: {String(i.fecha_inscripcion).slice(0, 10)} &bull; Mensualidad: Bs. {i.mensualidad}/mes
                                  {i.evaluado_por ? ` • Evaluado por: ${i.evaluado_por}` : ''}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => abrirModalEvaluacion(i)}
                                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                                >
                                  <ClipboardCheck className="w-4 h-4" /> Evaluar Crecimiento / Certificado
                                </button>

                                {(i.certificado_otorgado || i.culmino_taller) && (
                                  <button
                                    type="button"
                                    onClick={() => generarCertificadoPDF(i)}
                                    className="px-3.5 py-2 bg-oro-500 hover:bg-oro-400 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow"
                                  >
                                    <Award className="w-4 h-4" /> Imprimir Certificado PDF
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Métricas de Asistencia y 4 Dimensiones de Crecimiento */}
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                              {/* Control de Asistencia */}
                              <div className="md:col-span-2 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-semibold">
                                    Asistencia a Clases:
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => marcarAsistenciaRapida(i.id_inscripcion, -1)}
                                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono font-bold text-white px-1">
                                      {i.clases_asistidas || 0}/{i.clases_totales || 16}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => marcarAsistenciaRapida(i.id_inscripcion, 1)}
                                      className="w-6 h-6 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, porcAsist)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-emerald-400 font-bold block">
                                  {porcAsist}% de asistencia cumplida
                                </span>
                              </div>

                              {/* 4 Criterios de Evaluación Escénica */}
                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-400 uppercase block">
                                  Expresión Corporal
                                </span>
                                <span className="text-lg font-extrabold text-white font-mono">
                                  {i.eval_expresion || 0}
                                </span>
                                <span className="text-[10px] text-slate-500 block">/ 100 pts</span>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-400 uppercase block">
                                  Voz y Dicción
                                </span>
                                <span className="text-lg font-extrabold text-white font-mono">
                                  {i.eval_voz || 0}
                                </span>
                                <span className="text-[10px] text-slate-500 block">/ 100 pts</span>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-400 uppercase block">
                                  Improvisación
                                </span>
                                <span className="text-lg font-extrabold text-white font-mono">
                                  {i.eval_improvisacion || 0}
                                </span>
                                <span className="text-[10px] text-slate-500 block">/ 100 pts</span>
                              </div>

                              <div className="p-3 bg-slate-900 rounded-xl border border-oro-500/40 text-center">
                                <span className="text-[10px] text-oro-400 uppercase font-bold block">
                                  Promedio Final
                                </span>
                                <span className="text-xl font-black text-oro-400 font-mono">
                                  {nota}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  Compromiso: {i.eval_compromiso || 0}
                                </span>
                              </div>
                            </div>

                            {i.observaciones_docente && (
                              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-300">
                                <strong className="text-oro-400">Observación del Docente: </strong>
                                {i.observaciones_docente}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mensualidades y Control de Pagos con Envío de Correo */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-oro-400 uppercase tracking-wider">
                    Control de Pagos Mensuales y Alertas por Correo:
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
                            <th className="p-3">Recordatorios</th>
                            <th className="p-3 rounded-r-xl">Acciones de Cobro / Correo</th>
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
                                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                    m.estado === 'PAGADA'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                                  }`}
                                >
                                  {m.estado === 'PAGADA' ? 'PAGADA' : 'PENDIENTE / RETRASO'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">
                                {m.cantidad_recordatorios > 0 ? (
                                  <span className="text-amber-300 font-semibold">
                                    {m.cantidad_recordatorios} enviado(s)
                                  </span>
                                ) : (
                                  <span>Sin avisos</span>
                                )}
                              </td>
                              <td className="p-3">
                                {m.estado === 'PAGADA' ? (
                                  <span className="text-emerald-400 font-medium">
                                    ✓ Pagado el {String(m.fecha_pago).slice(0, 10)} ({m.metodo_pago || 'QR/Efectivo'})
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {esAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => cobrarCuota(m.id_mensualidad, 'EFECTIVO / QR')}
                                        className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition"
                                      >
                                        💵 Registrar Cobro
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => generarRecordatorioIndividual(m)}
                                      className="py-1.5 px-3 bg-amber-600/90 hover:bg-amber-500 text-slate-950 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1"
                                    >
                                      <Mail className="w-3.5 h-3.5" /> Enviar Correo por Retraso
                                    </button>
                                  </div>
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

      {/* MODAL DE EVALUACIÓN DE CRECIMIENTO, ASISTENCIA Y CERTIFICADO */}
      {inscripcionEvaluar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-oro-400">
                  Ficha Docente / Administrativa
                </span>
                <h3 className="text-xl font-bold font-theater text-white">
                  Evaluar Crecimiento: {inscripcionEvaluar.estudiante_nombres}{' '}
                  {inscripcionEvaluar.estudiante_apellidos}
                </h3>
                <p className="text-xs text-slate-400">{inscripcionEvaluar.curso_nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setInscripcionEvaluar(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEvaluacion} className="space-y-4 text-xs">
              {/* Asistencia */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Clases Asistidas
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={evalForm.clases_totales}
                    value={evalForm.clases_asistidas}
                    onChange={(e) =>
                      setEvalForm({ ...evalForm, clases_asistidas: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Total Clases del Módulo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={evalForm.clases_totales}
                    onChange={(e) =>
                      setEvalForm({ ...evalForm, clases_totales: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* 4 Dimensiones de Evaluación */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="font-bold text-oro-400 uppercase block">
                  Evaluación de Crecimiento Artístico (0 a 100 pts)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">
                      1. Expresión Corporal ({evalForm.eval_expresion} pts)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={evalForm.eval_expresion}
                      onChange={(e) =>
                        setEvalForm({ ...evalForm, eval_expresion: Number(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">
                      2. Voz, Dicción y Proyección ({evalForm.eval_voz} pts)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={evalForm.eval_voz}
                      onChange={(e) =>
                        setEvalForm({ ...evalForm, eval_voz: Number(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">
                      3. Improvisación y Creatividad ({evalForm.eval_improvisacion} pts)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={evalForm.eval_improvisacion}
                      onChange={(e) =>
                        setEvalForm({ ...evalForm, eval_improvisacion: Number(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">
                      4. Compromiso y Trabajo en Equipo ({evalForm.eval_compromiso} pts)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={evalForm.eval_compromiso}
                      onChange={(e) =>
                        setEvalForm({ ...evalForm, eval_compromiso: Number(e.target.value) })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-slate-400">
                    Promedio Calculado:{' '}
                    <strong className="text-oro-400 text-sm">
                      {(
                        (Number(evalForm.eval_expresion) +
                          Number(evalForm.eval_voz) +
                          Number(evalForm.eval_improvisacion) +
                          Number(evalForm.eval_compromiso)) /
                        4
                      ).toFixed(1)}{' '}
                      / 100
                    </strong>
                  </span>
                  <select
                    value={evalForm.nivel_crecimiento}
                    onChange={(e) =>
                      setEvalForm({ ...evalForm, nivel_crecimiento: e.target.value })
                    }
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  >
                    <option value="INICIAL">Nivel Inicial</option>
                    <option value="EN PROCESO">En Proceso</option>
                    <option value="DESTACADO">Destacado</option>
                    <option value="SOBRESALIENTE">Sobresaliente</option>
                  </select>
                </div>
              </div>

              {/* Observaciones del Docente */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Observaciones sobre el Crecimiento y Desempeño del Estudiante
                </label>
                <textarea
                  rows="3"
                  value={evalForm.observaciones_docente}
                  onChange={(e) =>
                    setEvalForm({ ...evalForm, observaciones_docente: e.target.value })
                  }
                  placeholder="Ej. Excelente evolución en proyección vocal y pérdida de pánico escénico..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* Culminación y Certificado */}
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalForm.culmino_taller}
                    onChange={(e) =>
                      setEvalForm({ ...evalForm, culmino_taller: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="font-bold text-white">
                    El estudiante culminó satisfactoriamente el taller
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evalForm.certificado_otorgado}
                    onChange={(e) =>
                      setEvalForm({
                        ...evalForm,
                        certificado_otorgado: e.target.checked,
                        culmino_taller: e.target.checked ? true : evalForm.culmino_taller,
                      })
                    }
                    className="w-4 h-4 accent-amber-400"
                  />
                  <span className="font-bold text-oro-400">
                    🎓 Otorgar Certificado Oficial de Culminación (habilita descarga en PDF)
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInscripcionEvaluar(null)}
                  className="w-1/3 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEval}
                  className="w-2/3 py-2.5 bg-teatro-700 hover:bg-teatro-600 text-white font-bold rounded-xl"
                >
                  {guardandoEval ? 'Guardando...' : 'Guardar Evaluación y Certificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CORREO GENERADO POR RETRASO DE PAGO */}
      {modalCorreo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-oro-400" />
                <h3 className="text-lg font-bold font-theater text-white">
                  Correo de Recordatorio de Pago Generado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCorreo(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-400">Para: </span>
                  <strong className="text-sky-400">
                    {modalCorreo.notificacion.correo_destino || 'Correo no registrado (puede enviarse por WhatsApp o ingresar correo en su cliente)'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Asunto: </span>
                  <strong className="text-white">{modalCorreo.notificacion.asunto}</strong>
                </div>
              </div>

              <textarea
                readOnly
                rows="10"
                value={modalCorreo.notificacion.cuerpo}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-sans text-xs leading-relaxed"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <a
                  href={modalCorreo.notificacion.mailto_url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Abrir en Correo
                </a>

                <a
                  href={modalCorreo.notificacion.whatsapp_url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Enviar WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${modalCorreo.notificacion.asunto}\n\n${modalCorreo.notificacion.cuerpo}`
                    );
                    notificar('Texto del correo copiado al portapapeles');
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Texto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECORDATORIOS MASIVOS */}
      {modalMasivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-theater text-white">
                Correos de Recordatorio Generados ({modalMasivo.length} pendientes)
              </h3>
              <button
                type="button"
                onClick={() => setModalMasivo(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {modalMasivo.map((r) => (
                <div
                  key={r.id_mensualidad}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <strong className="text-white text-sm block">{r.estudiante}</strong>
                    <span className="text-slate-400">
                      {r.curso} • Período {r.periodo} • <strong className="text-oro-400">Bs. {r.monto}</strong>
                    </span>
                    <span className="text-sky-400 block">
                      Destino: {r.correo_destino || r.telefono_destino || 'Sin correo'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={r.mailto_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                    >
                      Enviar Correo
                    </a>
                    <a
                      href={r.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fecha Nacimiento
                  </label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correo Electrónico (Para alertas de pago y certificados)
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  placeholder="estudiante@correo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre del Tutor
                  </label>
                  <input
                    type="text"
                    value={tutorNombre}
                    onChange={(e) => setTutorNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                    placeholder="Ej. Roberto Mamani"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={tutorTelefono}
                    onChange={(e) => setTutorTelefono(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                    placeholder="Ej. 70000000"
                  />
                </div>
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
