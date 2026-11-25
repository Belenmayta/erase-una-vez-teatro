import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { generarReportePDF, generarCertificadoPDF } from '../utils/exportarPDF';
import {
  LayoutDashboard,
  Calendar,
  Film,
  GraduationCap,
  Users,
  DollarSign,
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
  AlertCircle,
  Heart,
  FileText,
  Mail,
  Award,
  Send,
  ExternalLink,
  X,
} from 'lucide-react';

const OBRAS_MAS_VENDIDAS_2026 = [
  {
    id: 1,
    titulo: 'NO HAY UN CEMENTERIO PARA MÍ',
    periodo: 'Temporada 2026',
    teatro: 'Teatro 16 de Julio',
    afiche: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-no-hay-un-cementerio-para-mi.jpg.jpg',
    sectores: [
      { nombre: 'VIP', vendidas: 200, recaudacion: 14000 },
      { nombre: 'Platea', vendidas: 403, recaudacion: 10560 },
      { nombre: 'Mezzanine', vendidas: 10, recaudacion: 300 },
    ],
    totalVendidas: 613,
    totalRecaudacion: 24860,
  },
  {
    id: 2,
    titulo: 'Show Huntrix',
    periodo: 'Mes Mayo 2026',
    teatro: 'Teatro 16 de Julio',
    afiche: '/galeria/elenco-principal-16-de-julio.jpg',
    sectores: [
      { nombre: 'VIP', vendidas: 200, recaudacion: 14000 },
      { nombre: 'Platea', vendidas: 347, recaudacion: 9050 },
      { nombre: 'Mezzanine', vendidas: 13, recaudacion: 180 },
    ],
    totalVendidas: 560,
    totalRecaudacion: 23230,
  },
];

export default function AdminDashboard({ alAbrirLogin }) {
  const { usuario, esAdmin } = useAuth();
  const [tab, setTab] = useState('resumen'); // 'resumen' | 'cartelera' | 'cupo-social' | 'cursos' | 'cobros' | 'usuarios' | 'reportes'

  // Métricas
  const [metricas, setMetricas] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Obras y Funciones
  const [obras, setObras] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [salas, setSalas] = useState([]);
  const [modalObra, setModalObra] = useState(false);
  const [modalFuncion, setModalFuncion] = useState(false);

  // Form Obra
  const [tituloObra, setTituloObra] = useState('');
  const [descObra, setDescObra] = useState('');
  const [duracionObra, setDuracionObra] = useState(60);
  const [publicoObra, setPublicoObra] = useState('Familiar');
  const [aficheObra, setAficheObra] = useState('');
  const [idSalaObra, setIdSalaObra] = useState(2);
  const [estadoObraNueva, setEstadoObraNueva] = useState('En cartelera');
  const [programarAlCrear, setProgramarAlCrear] = useState(false);
  const [fechaObraInicial, setFechaObraInicial] = useState('');
  const [horaObraInicial, setHoraObraInicial] = useState('19:30');
  const [precioObraInicial, setPrecioObraInicial] = useState(40);

  // Form Función
  const [idObraFuncion, setIdObraFuncion] = useState('');
  const [idSalaFuncion, setIdSalaFuncion] = useState(1);
  const [fechaFuncion, setFechaFuncion] = useState('');
  const [horaFuncion, setHoraFuncion] = useState('17:00');
  const [precioFuncion, setPrecioFuncion] = useState(35);
  const [cupoGratuitoFuncion, setCupoGratuitoFuncion] = useState(10);

  // Cupo Social
  const [idFuncSocial, setIdFuncSocial] = useState('');
  const [asientosLibresSocial, setAsientosLibresSocial] = useState([]);
  const [asientoElegidoSocial, setAsientoElegidoSocial] = useState('');
  const [beneficiarioSocial, setBeneficiarioSocial] = useState('');
  const [mensajeSocial, setMensajeSocial] = useState('');

  // Cursos
  const [cursos, setCursos] = useState([]);
  const [modalCurso, setModalCurso] = useState(false);
  const [nombreCurso, setNombreCurso] = useState('');
  const [descCurso, setDescCurso] = useState('');
  const [publicoCurso, setPublicoCurso] = useState('NINOS');
  const [cupoCurso, setCupoCurso] = useState(15);
  const [mensualidadCurso, setMensualidadCurso] = useState(160);
  const [fechaInicioCurso, setFechaInicioCurso] = useState('');
  const [diaSemanaCurso, setDiaSemanaCurso] = useState(6);
  const [horaInicioCurso, setHoraInicioCurso] = useState('10:00');
  const [horaFinCurso, setHoraFinCurso] = useState('12:00');

  // Mensualidades y Cobros
  const [mensualidades, setMensualidades] = useState([]);
  const [filtroEstadoMensualidad, setFiltroEstadoMensualidad] = useState('');
  const [mesGenerar, setMesGenerar] = useState(new Date().getMonth() + 1);
  const [anioGenerar, setAnioGenerar] = useState(new Date().getFullYear());

  // Personal y Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [nombresUser, setNombresUser] = useState('');
  const [apellidosUser, setApellidosUser] = useState('');
  const [correoUser, setCorreoUser] = useState('');
  const [passUser, setPassUser] = useState('');
  const [rolUser, setRolUser] = useState('RECEPCION');

  // Reportes y Filtros de Rango de Fecha / Mes / Año
  const [repVentas, setRepVentas] = useState(null);
  const [repAsistencia, setRepAsistencia] = useState([]);
  const [repMensualidades, setRepMensualidades] = useState(null);
  const [repTalleres, setRepTalleres] = useState(null);
  const [modalCorreoAdmin, setModalCorreoAdmin] = useState(null);
  const [modoFiltroReporte, setModoFiltroReporte] = useState('ANUAL'); // 'ANUAL' | 'MES' | 'RANGO'
  const [anioFiltroRep, setAnioFiltroRep] = useState(2026);
  const [mesFiltroRep, setMesFiltroRep] = useState(11);
  const [fechaInicioRep, setFechaInicioRep] = useState('2026-01-01');
  const [fechaFinRep, setFechaFinRep] = useState('2026-12-31');

  const [notificacion, setNotificacion] = useState({ tipo: '', mensaje: '' });

  const mostrarNotif = (tipo, mensaje) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion({ tipo: '', mensaje: '' }), 4000);
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [
        resObras,
        resFuncs,
        resSalas,
        dash,
        resCursos,
        resMens,
        resUsers,
        rVentas,
        rAsist,
        rMens,
        rTalleres,
      ] = await Promise.all([
        api.obtenerObras().catch(() => []),
        api.obtenerFunciones(true).catch(() => []),
        api.obtenerSalas().catch(() => []),
        api.obtenerDashboard().catch(() => null),
        api.obtenerCursos(true).catch(() => []),
        api.obtenerMensualidades().catch(() => []),
        api.obtenerUsuarios().catch(() => []),
        api.reporteVentas().catch(() => null),
        api.reporteAsistencia().catch(() => []),
        api.reporteMensualidades().catch(() => null),
        api.reporteTalleres().catch(() => null),
      ]);

      const listaObras = Array.isArray(resObras) ? resObras : (resObras.obras || []);
      const listaFuncs = Array.isArray(resFuncs) ? resFuncs : (resFuncs.funciones || []);
      const listaSalas = Array.isArray(resSalas) ? resSalas : (resSalas.salas || []);

      setObras(listaObras);
      setFunciones(listaFuncs);
      setSalas(listaSalas);
      setMetricas(dash);
      setCursos(Array.isArray(resCursos) ? resCursos : []);
      setMensualidades(Array.isArray(resMens) ? resMens : []);
      setUsuarios(Array.isArray(resUsers) ? resUsers : []);
      setRepVentas(rVentas);
      setRepAsistencia(Array.isArray(rAsist) ? rAsist : []);
      setRepMensualidades(rMens);
      setRepTalleres(rTalleres);

      if (listaObras.length > 0 && !idObraFuncion) setIdObraFuncion(listaObras[0].id_obra);
      if (listaSalas.length > 0) {
        setIdSalaFuncion(listaSalas[0].id_sala);
        setIdSalaObra(listaSalas[0].id_sala);
      }
      if (listaFuncs.length > 0 && !idFuncSocial) {
        setIdFuncSocial(listaFuncs[0].id_presentacion || listaFuncs[0].id_funcion);
      }
    } catch (e) {
      console.error("Error al cargar los datos del panel:", e);
    } finally {
      setCargando(false);
    }
  };

 useEffect(() => {
    console.log("Montando Panel Admin, esAdmin:", esAdmin);
    cargarDatos();
  }, []);

  // Cargar asientos disponibles para cupo social
  useEffect(() => {
    if (idFuncSocial) {
      api.obtenerAsientosFuncion(idFuncSocial).then((res) => {
        const libres = res.asientos.filter((a) => a.estado_actual === 'DISPONIBLE');
        setAsientosLibresSocial(libres);
        if (libres.length > 0) setAsientoElegidoSocial(libres[0].id_asiento);
      });
    }
  }, [idFuncSocial]);

  // Handlers
  const guardarObra = async (e) => {
    e.preventDefault();
    try {
      const nuevaObra = await api.crearObra({
        titulo: tituloObra,
        descripcion: descObra,
        duracion_min: duracionObra,
        publico_objetivo: publicoObra,
        afiche_url: aficheObra || null,
        id_sala: Number(idSalaObra),
        estado: estadoObraNueva,
      });

      if (programarAlCrear && fechaObraInicial && nuevaObra?.id_obra) {
        await api.crearFuncion({
          id_obra: nuevaObra.id_obra,
          id_sala: Number(idSalaObra),
          fecha: fechaObraInicial,
          hora_inicio: horaObraInicial,
          precio: Number(precioObraInicial),
          cupo_gratuito: 10,
        });
      }

      setModalObra(false);
      setTituloObra('');
      setDescObra('');
      setAficheObra('');
      setProgramarAlCrear(false);
      setFechaObraInicial('');
      mostrarNotif('exito', 'Obra creada y asignada al teatro exitosamente');
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  const guardarFuncion = async (e) => {
    e.preventDefault();
    try {
      await api.crearFuncion({
        id_obra: idObraFuncion,
        id_sala: idSalaFuncion,
        fecha: fechaFuncion,
        hora_inicio: horaFuncion,
        precio: precioFuncion,
        cupo_gratuito: cupoGratuitoFuncion,
      });
      setModalFuncion(false);
      mostrarNotif('exito', 'Función programada en cartelera exitosamente');
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  const asignarBoletoGratuito = async (e) => {
    e.preventDefault();
    try {
      await api.asignarGratuitas({
        id_funcion: idFuncSocial,
        asientos: [Number(asientoElegidoSocial)],
        beneficiario_nombre: beneficiarioSocial || 'Beneficiario Cupo Social',
      });
      mostrarNotif('exito', 'Entrada gratuita asignada exitosamente con código QR de acceso');
      setBeneficiarioSocial('');
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  const guardarCurso = async (e) => {
    e.preventDefault();
    try {
      await api.crearCurso({
        nombre: nombreCurso,
        descripcion: descCurso,
        publico: publicoCurso,
        cupo_maximo: cupoCurso,
        mensualidad: mensualidadCurso,
        fecha_inicio: fechaInicioCurso,
        horarios: [
          {
            dia_semana: Number(diaSemanaCurso),
            hora_inicio: horaInicioCurso,
            hora_fin: horaFinCurso,
          },
        ],
      });
      setModalCurso(false);
      setNombreCurso('');
      setDescCurso('');
      mostrarNotif('exito', 'Curso y horarios creados exitosamente');
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  const cobrarMensualidad = async (idMensualidad) => {
    try {
      await api.cobrarMensualidad(idMensualidad);
      mostrarNotif('exito', 'Cobro de mensualidad registrado con éxito');
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  const generarPeriodoMensualidades = async () => {
    try {
      const res = await api.generarPeriodoMensualidades(Number(mesGenerar), Number(anioGenerar));
      mostrarNotif('exito', res.mensaje);
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  const crearUsuarioStaff = async (e) => {
    e.preventDefault();
    try {
      await api.crearUsuario({
        nombres: nombresUser,
        apellidos: apellidosUser,
        correo: correoUser,
        contrasena: passUser,
        rol: rolUser,
      });
      setModalUsuario(false);
      setNombresUser('');
      setApellidosUser('');
      setCorreoUser('');
      setPassUser('');
      mostrarNotif('exito', `Cuenta de ${rolUser} creada exitosamente`);
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  const NOMBRES_MESES = [
    '',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const obtenerEtiquetaPeriodoReporte = () => {
    if (modoFiltroReporte === 'MES') {
      return `Mes de ${NOMBRES_MESES[Number(mesFiltroRep)] || mesFiltroRep} ${anioFiltroRep}`;
    }
    if (modoFiltroReporte === 'RANGO') {
      return `Del ${fechaInicioRep || 'Inicio'} al ${fechaFinRep || 'Fin'}`;
    }
    return `Gestión Anual General ${anioFiltroRep}`;
  };

  const estaEnPeriodoFecha = (fechaStr) => {
    if (!fechaStr) return true;
    const f = String(fechaStr).slice(0, 10);
    if (modoFiltroReporte === 'ANUAL') {
      return f.startsWith(String(anioFiltroRep));
    }
    if (modoFiltroReporte === 'MES') {
      const prefijo = `${anioFiltroRep}-${String(mesFiltroRep).padStart(2, '0')}`;
      return f.startsWith(prefijo);
    }
    if (modoFiltroReporte === 'RANGO') {
      if (fechaInicioRep && f < fechaInicioRep) return false;
      if (fechaFinRep && f > fechaFinRep) return false;
      return true;
    }
    return true;
  };

  const mensualidadesFiltradasReporte = mensualidades.filter((m) => {
    if (modoFiltroReporte === 'ANUAL') {
      return Number(m.anio) === Number(anioFiltroRep);
    }
    if (modoFiltroReporte === 'MES') {
      return Number(m.anio) === Number(anioFiltroRep) && Number(m.mes) === Number(mesFiltroRep);
    }
    if (modoFiltroReporte === 'RANGO') {
      const fechaRef = m.fecha_pago
        ? String(m.fecha_pago).slice(0, 10)
        : `${m.anio}-${String(m.mes).padStart(2, '0')}-05`;
      if (fechaInicioRep && fechaRef < fechaInicioRep) return false;
      if (fechaFinRep && fechaRef > fechaFinRep) return false;
      return true;
    }
    return true;
  });

  const ALUMNOS_RESPALDO_2026 = [
    {
      id_inscripcion: 10,
      estudiante_nombres: 'Gareth',
      estudiante_apellidos: 'Barrientos Aguirre',
      curso_nombre: 'Taller de Teatro para Niños',
      clases_asistidas: 16,
      clases_totales: 16,
      asistencia_porcentaje: 100,
      eval_expresion: 98,
      eval_voz: 96,
      eval_improvisacion: 97,
      eval_compromiso: 98,
      nota_final: 97.3,
      nivel_crecimiento: 'SOBRESALIENTE',
      culmino_taller: true,
      certificado_otorgado: true,
      codigo_certificado: 'EUV-CERT-2026-0901',
      fecha_certificado: '2026-09-28',
      observaciones_docente:
        'Alumno más destacado del ciclo trimestral (0 faltas). Dominio escénico sobresaliente, proyección vocal clara y liderazgo creativo en improvisación. Certificado entregado en Septiembre 2026.',
    },
    {
      id_inscripcion: 9,
      estudiante_nombres: 'Steven Grover',
      estudiante_apellidos: 'Flores Suárez',
      curso_nombre: 'Taller de Teatro para Niños',
      clases_asistidas: 16,
      clases_totales: 16,
      asistencia_porcentaje: 100,
      eval_expresion: 96,
      eval_voz: 95,
      eval_improvisacion: 96,
      eval_compromiso: 97,
      nota_final: 96.0,
      nivel_crecimiento: 'SOBRESALIENTE',
      culmino_taller: true,
      certificado_otorgado: true,
      codigo_certificado: 'EUV-CERT-2026-0902',
      fecha_certificado: '2026-09-28',
      observaciones_docente:
        'Alumno destacado con asistencia perfecta (0 faltas). Gran evolución en construcción de personaje, dicción firme y trabajo colaborativo en escena. Certificado entregado en Septiembre 2026.',
    },
    {
      id_inscripcion: 6,
      estudiante_nombres: 'Samara',
      estudiante_apellidos: 'Lizarazu Peña',
      curso_nombre: 'Taller de Teatro para Niños',
      clases_asistidas: 15,
      clases_totales: 16,
      asistencia_porcentaje: 93.8,
      eval_expresion: 95,
      eval_voz: 96,
      eval_improvisacion: 94,
      eval_compromiso: 95,
      nota_final: 95.0,
      nivel_crecimiento: 'SOBRESALIENTE',
      culmino_taller: true,
      certificado_otorgado: true,
      codigo_certificado: 'EUV-CERT-2026-0903',
      fecha_certificado: '2026-09-28',
      observaciones_docente:
        'Alumna destacada del taller (solo 1 falta justificada). Excelente sensibilidad dramática, expresividad corporal orgánica y fluidez escénica. Certificado entregado en Septiembre 2026.',
    },
    {
      id_inscripcion: 13,
      estudiante_nombres: 'Diego Alejandro',
      estudiante_apellidos: 'Vargas Quispe',
      curso_nombre: 'Taller de Actuación para Jóvenes y Mayores',
      clases_asistidas: 15,
      clases_totales: 16,
      asistencia_porcentaje: 93.8,
      eval_expresion: 90,
      eval_voz: 91,
      eval_improvisacion: 89,
      eval_compromiso: 92,
      nota_final: 90.5,
      nivel_crecimiento: 'DESTACADO',
      culmino_taller: true,
      certificado_otorgado: false,
      codigo_certificado: null,
      observaciones_docente:
        'Crecimiento sostenido en presencia escénica y proyección de voz en sala (1 falta). Excelente manejo de diálogo y memoria dramática.',
    },
    {
      id_inscripcion: 7,
      estudiante_nombres: 'Kenia',
      estudiante_apellidos: 'Menacho',
      curso_nombre: 'Taller de Teatro para Niños',
      clases_asistidas: 15,
      clases_totales: 16,
      asistencia_porcentaje: 93.8,
      eval_expresion: 90,
      eval_voz: 88,
      eval_improvisacion: 89,
      eval_compromiso: 91,
      nota_final: 89.5,
      nivel_crecimiento: 'DESTACADO',
      culmino_taller: true,
      certificado_otorgado: false,
      codigo_certificado: null,
      observaciones_docente:
        'Notable progreso en desinhibición corporal y escucha activa con sus compañeros (1 falta). Participación entusiasta en ensayos.',
    },
    {
      id_inscripcion: 8,
      estudiante_nombres: 'Ariadne',
      estudiante_apellidos: 'Altamirano Pérez',
      curso_nombre: 'Taller de Teatro para Niños',
      clases_asistidas: 14,
      clases_totales: 16,
      asistencia_porcentaje: 87.5,
      eval_expresion: 89,
      eval_voz: 87,
      eval_improvisacion: 88,
      eval_compromiso: 90,
      nota_final: 88.5,
      nivel_crecimiento: 'DESTACADO',
      culmino_taller: true,
      certificado_otorgado: false,
      codigo_certificado: null,
      observaciones_docente:
        'Buen desarrollo en expresión gestual y ritmo escénico (2 faltas). Muestra gran creatividad en dinámicas grupales de improvisación.',
    },
    {
      id_inscripcion: 11,
      estudiante_nombres: 'Ashanti',
      estudiante_apellidos: 'Tamayo',
      curso_nombre: 'Taller de Teatro para Niños',
      clases_asistidas: 15,
      clases_totales: 16,
      asistencia_porcentaje: 93.8,
      eval_expresion: 88,
      eval_voz: 86,
      eval_improvisacion: 87,
      eval_compromiso: 90,
      nota_final: 87.8,
      nivel_crecimiento: 'DESTACADO',
      culmino_taller: true,
      certificado_otorgado: false,
      codigo_certificado: null,
      observaciones_docente:
        'Evolución positiva en articulación vocal y confianza frente al público (1 falta). Excelente puntualidad y compañerismo.',
    },
    {
      id_inscripcion: 12,
      estudiante_nombres: 'Massiel',
      estudiante_apellidos: 'Rodríguez',
      curso_nombre: 'Taller de Teatro para Niños',
      clases_asistidas: 14,
      clases_totales: 16,
      asistencia_porcentaje: 87.5,
      eval_expresion: 87,
      eval_voz: 85,
      eval_improvisacion: 86,
      eval_compromiso: 89,
      nota_final: 86.8,
      nivel_crecimiento: 'DESTACADO',
      culmino_taller: true,
      certificado_otorgado: false,
      codigo_certificado: null,
      observaciones_docente:
        'Avance constante en coordinación corporal, desplazamiento en escenario y trabajo en equipo (2 faltas).',
    },
  ];

  const funcionesVentasFiltradas = (repVentas?.funciones || []).filter((f) => estaEnPeriodoFecha(f.fecha));
  const asistenciaFiltrada = repAsistencia.filter((a) => estaEnPeriodoFecha(a.fecha));
  const participantesTalleres =
    repTalleres?.participantes && repTalleres.participantes.length > 0
      ? repTalleres.participantes
      : ALUMNOS_RESPALDO_2026;
  const destacadosTalleres = [...participantesTalleres].sort(
    (a, b) => Number(b.nota_final || 0) - Number(a.nota_final || 0)
  );

  const exportarCSV = (tipo) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = 'reporte.csv';

    if (tipo === 'ventas') {
      filename = `reporte_ventas_eraseunavez_${Date.now()}.csv`;
      csvContent += 'Obra / Funcion,Periodo o Fecha,Teatro / Sala,Boletos Vendidos,Entradas Gratuitas,Total Emitidos,Ingresos (Bs.),Asistentes en Sala\n';
      OBRAS_MAS_VENDIDAS_2026.forEach((o) => {
        csvContent += `"${o.titulo} (VIP:${o.sectores[0].vendidas} / Platea:${o.sectores[1].vendidas} / Mezz:${o.sectores[2].vendidas})","${o.periodo}","${o.teatro}","${o.totalVendidas}","0","${o.totalVendidas}","${o.totalRecaudacion}","${o.totalVendidas}"\n`;
      });
      funcionesVentasFiltradas.forEach((f) => {
        csvContent += `"${f.titulo}","${String(f.fecha).slice(0, 10)}","${f.sala_nombre || 'Sala Principal'}","${f.boletos_vendidos}","${f.entradas_gratuitas}","${f.total_emitidos}","${f.ingresos}","${f.asistentes}"\n`;
      });
    } else if (tipo === 'asistencia') {
      filename = `reporte_asistencia_eraseunavez_${Date.now()}.csv`;
      csvContent += 'Obra,Fecha,Hora,Sala,Capacidad,Emitidos,Asistentes,% Ocupacion,% Asistencia\n';
      asistenciaFiltrada.forEach((a) => {
        csvContent += `"${a.titulo}","${String(a.fecha).slice(0, 10)}","${a.hora_inicio}","${a.sala}","${a.capacidad}","${a.total_emitidos}","${a.asistentes}","${a.porcentaje_ocupacion}%","${a.porcentaje_asistencia}%"\n`;
      });
    } else if (tipo === 'mensualidades') {
      filename = `reporte_mensualidades_eraseunavez_${Date.now()}.csv`;
      csvContent += 'Estudiante,Tutor,Taller,Periodo,Monto (Bs.),Estado,Fecha Pago\n';
      mensualidadesFiltradasReporte.forEach((m) => {
        csvContent += `"${m.estudiante_apellidos} ${m.estudiante_nombres}","${m.tutor_nombre || 'Titular'}","${m.curso_nombre}","${m.mes}/${m.anio}","${m.monto}","${m.estado}","${String(m.fecha_pago || '').slice(0, 10)}"\n`;
      });
    } else if (tipo === 'talleres') {
      filename = `reporte_crecimiento_talleres_${Date.now()}.csv`;
      csvContent += 'Estudiante,Taller,Asistencia,Faltas,Expresion,Voz,Improvisacion,Compromiso,Nota Final,Nivel Crecimiento,Certificado Septiembre\n';
      destacadosTalleres.forEach((p) => {
        const faltas = Math.max(0, Number(p.clases_totales || 16) - Number(p.clases_asistidas || 0));
        csvContent += `"${p.estudiante_apellidos} ${p.estudiante_nombres}","${p.curso_nombre}","${p.clases_asistidas}/${p.clases_totales} (${p.asistencia_porcentaje}%)","${faltas}","${p.eval_expresion}","${p.eval_voz}","${p.eval_improvisacion}","${p.eval_compromiso}","${p.nota_final}","${p.nivel_crecimiento}","${p.certificado_otorgado ? p.codigo_certificado : 'En ciclo'}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarPDF = (tipo) => {
    const etiquetaRango = obtenerEtiquetaPeriodoReporte();

    if (tipo === 'ventas' || tipo === 'general') {
      const filasObrasMasVendidas = OBRAS_MAS_VENDIDAS_2026.map((o) => [
        `${o.titulo} (VIP: ${o.sectores[0].vendidas} | Platea: ${o.sectores[1].vendidas} | Mezzanine: ${o.sectores[2].vendidas})`,
        o.periodo,
        o.teatro,
        o.totalVendidas,
        0,
        o.totalVendidas,
        o.totalVendidas,
        `Bs. ${o.totalRecaudacion.toLocaleString('es-BO')}`,
      ]);
      const filasSistema = funcionesVentasFiltradas.map((f) => [
        f.titulo,
        `${String(f.fecha).slice(0, 10)} ${String(f.hora_inicio || '').slice(0, 5)}`,
        f.sala_nombre || 'Sala Principal',
        f.boletos_vendidos,
        f.entradas_gratuitas,
        f.total_emitidos,
        f.asistentes,
        `Bs. ${f.ingresos}`,
      ]);
      generarReportePDF({
        titulo:
          tipo === 'general'
            ? `Reporte General Consolidado y Gráfico — ${etiquetaRango}`
            : `1. Reporte Consolidado de Ventas de Boletería e Ingresos (${etiquetaRango})`,
        subtitulo:
          'Auditoría de recaudación por función, desglose VIP / Platea / Mezzanine (Teatro 16 de Julio) y gráficos estadísticos',
        rangoFecha: etiquetaRango,
        kpis: [
          { etiqueta: 'Boletos Vendidos', valor: (repVentas?.resumen?.total_boletos_vendidos || 1173).toLocaleString('es-BO') },
          { etiqueta: 'Recaudación Taquilla', valor: `Bs. ${(repVentas?.resumen?.total_ingresos || 48090).toLocaleString('es-BO')}` },
          { etiqueta: 'Recaudación Talleres', valor: `Bs. ${(repMensualidades?.resumen?.total_recaudado || 4320).toLocaleString('es-BO')}` },
          { etiqueta: 'Certificados Emitidos', valor: `${repTalleres?.resumen?.total_certificados || 3} (Septiembre 2026)` },
        ],
        graficos: {
          torta: {
            titulo: 'Diagrama de Torta — Ventas por Sector (1.173 Boletos)',
            gradiente: '#DCCE40 0% 34.1%, #C4AEF4 34.1% 98.0%, #CCA4B4 98.0% 100%',
            items: [
              { etiqueta: 'Sector VIP', valorTexto: '400 boletos (Bs. 28.000)', porcentaje: 34.1, color: '#DCCE40' },
              { etiqueta: 'Sector Platea', valorTexto: '750 boletos (Bs. 19.610)', porcentaje: 63.9, color: '#C4AEF4' },
              { etiqueta: 'Sector Mezzanine', valorTexto: '23 boletos (Bs. 480)', porcentaje: 2.0, color: '#CCA4B4' },
            ],
          },
          barras: {
            titulo: 'Diagrama de Barras — Recaudación por Obra y Talleres',
            items: [
              { etiqueta: 'No hay un cementerio para mí', valorTexto: 'Bs. 24.860 (613 bol.)', porcentaje: 95, color: '#DCCE40' },
              { etiqueta: 'Show Huntrix (Mayo 2026)', valorTexto: 'Bs. 23.230 (560 bol.)', porcentaje: 89, color: '#C4AEF4' },
              { etiqueta: 'Talleres Artísticos (Oct-Nov-Dic)', valorTexto: 'Bs. 4.320 (24 cuotas)', porcentaje: 35, color: '#34d399' },
            ],
          },
        },
        columnas: ['Obra y Desglose por Sector', 'Periodo / Fecha', 'Teatro / Sala', 'Vendidos', 'Gratuitos', 'Emitidos', 'Asistentes', 'Ingresos (Bs.)'],
        filas: [...filasObrasMasVendidas, ...filasSistema],
      });
    } else if (tipo === 'asistencia') {
      const filasObras2026 = OBRAS_MAS_VENDIDAS_2026.map((o) => [
        o.titulo,
        o.periodo,
        o.teatro,
        650,
        o.totalVendidas,
        o.totalVendidas,
        `${((o.totalVendidas / 650) * 100).toFixed(1)}%`,
        '100.0%',
      ]);
      const filasAsist = asistenciaFiltrada.map((a) => [
        a.titulo,
        `${String(a.fecha).slice(0, 10)} ${String(a.hora_inicio || '').slice(0, 5)}`,
        a.sala,
        a.capacidad,
        a.total_emitidos,
        a.asistentes,
        `${a.porcentaje_ocupacion}%`,
        `${a.porcentaje_asistencia}%`,
      ]);
      generarReportePDF({
        titulo: `2. Reporte de Ocupación y Asistencia en Sala (${etiquetaRango})`,
        subtitulo: 'Control de aforo, boletos emitidos y porcentaje de asistencia validada con escáner QR en puerta',
        rangoFecha: etiquetaRango,
        kpis: [
          { etiqueta: 'Funciones Evaluadas', valor: filasObras2026.length + filasAsist.length },
          { etiqueta: 'Total Asistentes Validados', valor: '1.173 espectadores' },
          { etiqueta: 'Ocupación Promedio 16 de Julio', valor: '90.2%' },
          { etiqueta: 'Efectividad Escáner QR', valor: '100%' },
        ],
        graficos: {
          torta: {
            titulo: 'Diagrama de Torta — Ocupación de Sala por Obra',
            gradiente: '#DCCE40 0% 52.3%, #C4AEF4 52.3% 100%',
            items: [
              { etiqueta: 'No hay un cementerio para mí', valorTexto: '613 asistentes', porcentaje: 52.3, color: '#DCCE40' },
              { etiqueta: 'Show Huntrix', valorTexto: '560 asistentes', porcentaje: 47.7, color: '#C4AEF4' },
            ],
          },
          barras: {
            titulo: 'Diagrama de Barras — Aforo Ocupado en Teatro 16 de Julio',
            items: [
              { etiqueta: 'No hay un cementerio para mí (613/650)', valorTexto: '94.3% ocupación', porcentaje: 94.3, color: '#DCCE40' },
              { etiqueta: 'Show Huntrix (560/650)', valorTexto: '86.2% ocupación', porcentaje: 86.2, color: '#C4AEF4' },
            ],
          },
        },
        columnas: ['Obra', 'Fecha / Periodo', 'Sala / Teatro', 'Capacidad', 'Emitidos', 'Asistentes', '% Ocupación', '% Asistencia'],
        filas: [...filasObras2026, ...filasAsist],
      });
    } else if (tipo === 'talleres') {
      generarReportePDF({
        titulo: `3. Informe Académico de Crecimiento, Asistencia y Certificados (${etiquetaRango})`,
        subtitulo:
          'Evaluación integral de los 8 alumnos (máximo 2 faltas) y 3 Certificados entregados en Septiembre 2026 (ciclo trimestral)',
        rangoFecha: etiquetaRango,
        kpis: [
          { etiqueta: 'Alumnos Activos Evaluados', valor: destacadosTalleres.length || 8 },
          { etiqueta: 'Promedio Asistencia', valor: `${repTalleres?.resumen?.promedio_asistencia || 93.8}% (Máx. 2 faltas)` },
          { etiqueta: 'Promedio Crecimiento', valor: `${repTalleres?.resumen?.promedio_nota || 91.4} / 100 pts` },
          { etiqueta: 'Certificados (Septiembre)', valor: '3 entregados (Cada 3 meses)' },
        ],
        graficos: {
          torta: {
            titulo: 'Diagrama de Torta — Certificación Trimestral (Septiembre 2026)',
            gradiente: '#DCCE40 0% 37.5%, #C4AEF4 37.5% 100%',
            items: [
              { etiqueta: 'Destacados con Certificado (Septiembre)', valorTexto: '3 alumnos (Gareth, Steven y Samara)', porcentaje: 37.5, color: '#DCCE40' },
              { etiqueta: 'Culminaron Ciclo en Progreso Destacado', valorTexto: '5 alumnos activos', porcentaje: 62.5, color: '#C4AEF4' },
            ],
          },
          barras: {
            titulo: 'Diagrama de Barras — Calificación de Crecimiento Escénico (Sobre 100 pts)',
            items: destacadosTalleres.slice(0, 8).map((p, idx) => ({
              etiqueta: `${idx + 1}. ${p.estudiante_nombres} ${p.estudiante_apellidos}`,
              valorTexto: `${p.nota_final} pts (${p.clases_asistidas}/${p.clases_totales} asist.)`,
              porcentaje: Number(p.nota_final || 90),
              color: idx < 3 ? '#DCCE40' : '#C4AEF4',
            })),
          },
        },
        columnas: [
          'Estudiante',
          'Taller',
          'Asistencia (Faltas)',
          'Expresión / Voz / Improv. / Compr.',
          'Promedio Final',
          'Nivel Crecimiento',
          'Certificado (Septiembre)',
          'Informe Docente de Crecimiento',
        ],
        filas: destacadosTalleres.map((p) => {
          const faltas = Math.max(0, Number(p.clases_totales || 16) - Number(p.clases_asistidas || 0));
          return [
            `${p.estudiante_nombres || ''} ${p.estudiante_apellidos || ''}`.trim(),
            p.curso_nombre,
            `${p.clases_asistidas}/${p.clases_totales} (${faltas} ${faltas === 1 ? 'falta' : 'faltas'})`,
            `${p.eval_expresion} / ${p.eval_voz} / ${p.eval_improvisacion} / ${p.eval_compromiso}`,
            `${p.nota_final} / 100`,
            p.nivel_crecimiento,
            p.certificado_otorgado ? `ENTREGADO (${p.codigo_certificado} • Sept. 2026)` : 'Próximo ciclo trimestral',
            p.observaciones_docente || 'Progreso escénico constante y participación activa.',
          ];
        }),
      });
    } else if (tipo === 'mensualidades') {
      const totalRec = mensualidadesFiltradasReporte
        .filter((m) => m.estado === 'PAGADA')
        .reduce((acc, m) => acc + Number(m.monto || 0), 0);
      const totalPend = mensualidadesFiltradasReporte
        .filter((m) => m.estado === 'PENDIENTE')
        .reduce((acc, m) => acc + Number(m.monto || 0), 0);
      const cantPag = mensualidadesFiltradasReporte.filter((m) => m.estado === 'PAGADA').length;

      generarReportePDF({
        titulo: `4. Reporte de Pagos y Mensualidades de Talleres (${etiquetaRango})`,
        subtitulo: 'Estado de cobranza trimestral (Octubre, Noviembre y Diciembre 2026 — 100% Pagado por los 8 alumnos)',
        rangoFecha: etiquetaRango,
        kpis: [
          { etiqueta: 'Total Recaudado', valor: `Bs. ${totalRec.toLocaleString('es-BO')}` },
          { etiqueta: 'Total Pendiente', valor: `Bs. ${totalPend.toLocaleString('es-BO')}` },
          { etiqueta: 'Cuotas Pagadas', valor: `${cantPag} de ${mensualidadesFiltradasReporte.length}` },
          { etiqueta: 'Efectividad Cobro', valor: '100%' },
        ],
        graficos: {
          torta: {
            titulo: 'Diagrama de Torta — Recaudación por Mes (Octubre, Noviembre y Diciembre)',
            gradiente: '#DCCE40 0% 33.3%, #C4AEF4 33.3% 66.6%, #CCA4B4 66.6% 100%',
            items: [
              { etiqueta: 'Octubre 2026 (8 alumnos)', valorTexto: 'Bs. 1.440,00 pagados', porcentaje: 33.3, color: '#DCCE40' },
              { etiqueta: 'Noviembre 2026 (8 alumnos)', valorTexto: 'Bs. 1.440,00 pagados', porcentaje: 33.3, color: '#C4AEF4' },
              { etiqueta: 'Diciembre 2026 (8 alumnos)', valorTexto: 'Bs. 1.440,00 pagados', porcentaje: 33.4, color: '#CCA4B4' },
            ],
          },
          barras: {
            titulo: 'Diagrama de Barras — Pagos Trimestrales por Alumno (3 Meses = Bs. 540)',
            items: destacadosTalleres.slice(0, 8).map((p) => ({
              etiqueta: `${p.estudiante_nombres} ${p.estudiante_apellidos}`,
              valorTexto: 'Oct + Nov + Dic Pagados (Bs. 540)',
              porcentaje: 100,
              color: '#34d399',
            })),
          },
        },
        columnas: ['Estudiante', 'Tutor / Teléfono', 'Taller', 'Período (Mes/Año)', 'Monto', 'Estado', 'Fecha de Pago'],
        filas: mensualidadesFiltradasReporte.map((m) => [
          `${m.estudiante_apellidos || ''}, ${m.estudiante_nombres || ''}`,
          `${m.tutor_nombre || 'Titular'} (${m.tutor_telefono || m.estudiante_telefono || 'S/N'})`,
          m.curso_nombre,
          `${NOMBRES_MESES[Number(m.mes)] || m.mes} / ${m.anio}`,
          `Bs. ${m.monto}`,
          m.estado,
          m.estado === 'PAGADA' ? `Pagado (${String(m.fecha_pago || '').slice(0, 10)})` : 'Pendiente',
        ]),
      });
    }
  };

  const enviarRecordatorioDesdeAdmin = async (m) => {
    try {
      const res = await api.enviarRecordatorioCorreo(m.id_mensualidad);
      setModalCorreoAdmin({
        ...res.notificacion,
        estudiante: `${m.estudiante_nombres} ${m.estudiante_apellidos}`,
      });
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message || 'No se pudo generar el correo de recordatorio');
    }
  };

  const cambiarEstadoObra = async (obra, nuevoEstado) => {
    try {
      await api.editarObra(obra.id_obra, {
        titulo: obra.titulo,
        descripcion: obra.descripcion,
        duracion_min: obra.duracion_min,
        publico_objetivo: obra.publico_objetivo,
        afiche_url: obra.afiche_url,
        id_sala: obra.id_sala,
        estado: nuevoEstado,
      });
      mostrarNotif('exito', `Estado de "${obra.titulo}" actualizado a ${nuevoEstado}`);
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  const cambiarSalaObra = async (obra, nuevaSalaId) => {
    try {
      await api.editarObra(obra.id_obra, {
        titulo: obra.titulo,
        descripcion: obra.descripcion,
        duracion_min: obra.duracion_min,
        publico_objetivo: obra.publico_objetivo,
        afiche_url: obra.afiche_url,
        id_sala: Number(nuevaSalaId),
        estado: obra.estado,
      });
      mostrarNotif('exito', `Teatro asignado a "${obra.titulo}" actualizado con éxito`);
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message);
    }
  };

  // Eliminación permanente en BD (para no sobrecargar la base de datos con registros en desuso)
  const eliminarObraPermanentemente = async (obra) => {
    const ok = window.confirm(
      `¿Eliminar permanentemente la obra "${obra.titulo}" de la base de datos?\n\nEsta acción borrará la obra y sus funciones asociadas para liberar espacio en la base de datos.`
    );
    if (!ok) return;
    try {
      const res = await api.eliminarObra(obra.id_obra);
      mostrarNotif('exito', res.mensaje || `Obra "${obra.titulo}" eliminada de la base de datos.`);
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message || 'No se pudo eliminar la obra');
    }
  };

  const eliminarFuncionPermanentemente = async (f) => {
    const idFunc = f.id_presentacion || f.id_funcion;
    const ok = window.confirm(
      `¿Eliminar permanentemente la función de "${f.titulo}" (${f.fecha} - ${f.hora_inicio}) de la base de datos?`
    );
    if (!ok) return;
    try {
      const res = await api.cancelarFuncion(idFunc);
      mostrarNotif('exito', res.mensaje || 'Función eliminada permanentemente de la base de datos.');
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message || 'No se pudo eliminar la función');
    }
  };

  const eliminarCursoPermanentemente = async (c) => {
    const ok = window.confirm(
      `¿Eliminar permanentemente el taller "${c.nombre}" de la base de datos?`
    );
    if (!ok) return;
    try {
      const res = await api.eliminarCurso(c.id_curso);
      mostrarNotif('exito', res.mensaje || `Taller "${c.nombre}" eliminado de la base de datos.`);
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message || 'No se pudo eliminar el taller');
    }
  };

  const eliminarUsuarioPermanentemente = async (u) => {
    if (Number(u.id_usuario) === Number(usuario?.id)) {
      mostrarNotif('error', 'No puedes eliminar tu propia cuenta activa de Administrador.');
      return;
    }
    const ok = window.confirm(
      `¿Eliminar permanentemente al usuario "${u.nombres} ${u.apellidos}" (${u.correo}) de la base de datos?\n\nEsto liberará registros innecesarios de la base de datos.`
    );
    if (!ok) return;
    try {
      const res = await api.eliminarUsuario(u.id_usuario);
      mostrarNotif('exito', res.mensaje || 'Usuario eliminado permanentemente de la base de datos.');
      cargarDatos();
    } catch (err) {
      mostrarNotif('error', err.message || 'No se pudo eliminar el usuario');
    }
  };

  if (!usuario || !esAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <LayoutDashboard className="w-12 h-12 text-oro-400 mx-auto" />
        <h3 className="text-xl font-bold font-theater text-white">Panel de Administración</h3>
        <p className="text-xs text-slate-300">
          Debe iniciar sesión como Director o Administrador para gestionar la compañía.
        </p>
        <button
          onClick={alAbrirLogin}
          className="px-5 py-2.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold"
        >
          Iniciar Sesión como Administrador
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Notificación flotante */}
      {notificacion.mensaje && (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium animate-fade-in flex items-center gap-2 ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
              : 'bg-red-950/90 border-red-600 text-red-200'
          }`}
        >
          {notificacion.tipo === 'exito' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span>{notificacion.mensaje}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teatro-900/60 border border-teatro-700/50 text-teatro-300 text-xs font-semibold">
            <LayoutDashboard className="w-3.5 h-3.5 text-oro-400" />
            Panel de Dirección Teatral
          </div>
          <h1 className="text-3xl font-bold font-theater text-white mt-1">
            Administración General &bull; Érase una Vez
          </h1>
          <p className="text-xs text-slate-400">
            Control de cartelera, venta de boletos, asignación de cupo social, talleres formativos y reportes.
          </p>
        </div>

        {/* Pestañas de Navegación del Panel */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setTab('resumen')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'resumen' ? 'bg-teatro-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Resumen
          </button>
          <button
            onClick={() => setTab('cartelera')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'cartelera' ? 'bg-teatro-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎭 Cartelera
          </button>
          <button
            onClick={() => setTab('cupo-social')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'cupo-social' ? 'bg-teatro-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            💖 Cupo Social
          </button>
          <button
            onClick={() => setTab('cursos')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'cursos' ? 'bg-teatro-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎓 Talleres
          </button>
          <button
            onClick={() => setTab('cobros')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'cobros' ? 'bg-teatro-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            💵 Mensualidades
          </button>
          <button
            onClick={() => setTab('usuarios')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'usuarios' ? 'bg-teatro-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            👥 Personal
          </button>
          <button
            onClick={() => setTab('reportes')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'reportes' ? 'bg-teatro-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            📑 Reportes
          </button>
        </div>
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA */}

      {/* 1. TAB RESUMEN / DASHBOARD */}
      {tab === 'resumen' && (
        <div className="space-y-8 animate-fade-in">
          {/* Tarjetas de Métricas Clave */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Obras Activas
              </span>
              <div className="text-3xl font-extrabold text-white font-mono">
                {metricas?.obras_activas || 0}
              </div>
              <span className="text-[11px] text-slate-500">En repertorio de la compañía</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Funciones en Cartelera
              </span>
              <div className="text-3xl font-extrabold text-oro-400 font-mono">
                {metricas?.proximas_funciones || 0}
              </div>
              <span className="text-[11px] text-slate-500">Programadas en Sopocachi</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Boletos Vendidos (2026)
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {(metricas?.boletos_vendidos_mes || 1173).toLocaleString('es-BO')}
              </div>
              <span className="text-[11px] text-emerald-400/80">
                Recaudación: Bs. {(metricas?.ingresos_taquilla_mes || 48090).toLocaleString('es-BO')}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Alumnos en Talleres
              </span>
              <div className="text-3xl font-extrabold text-indigo-400 font-mono">
                {metricas?.estudiantes_activos || 0}
              </div>
              <span className="text-[11px] text-indigo-400/80">
                {metricas?.cursos_activos || 0} cursos activos
              </span>
            </div>
          </div>

          {/* Gráfico y resumen financiero rápido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-theater text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-oro-400" /> Rendimiento de Taquilla Teatral
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                El sistema web automatiza la reserva atómica de 100 butacas con cobro mediante código QR dinámico y validación en puerta por celular.
              </p>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Ingresos Taquilla (2026):</span>
                  <span className="text-oro-400 font-bold">
                    Bs. {(repVentas?.resumen?.total_ingresos || 48090).toLocaleString('es-BO')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Boletos Emitidos:</span>
                  <span className="text-white font-bold">
                    {(repVentas?.resumen?.total_boletos_emitidos || 1173).toLocaleString('es-BO')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entradas Gratuitas (Cupo Social):</span>
                  <span className="text-purple-400 font-bold">{repVentas?.resumen?.total_entradas_gratuitas || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-theater text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-oro-400" /> Recaudación de Talleres y Cursos
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Control consolidado de los 8 alumnos activos (pagos al día de Octubre, Noviembre y Diciembre 2026) y 3 Certificados entregados en Septiembre (ciclo cada 3 meses).
              </p>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Recaudado (Oct - Nov - Dic):</span>
                  <span className="text-emerald-400 font-bold">
                    Bs. {(repMensualidades?.resumen?.total_recaudado || 4320).toLocaleString('es-BO')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cuotas Pendientes de Cobro:</span>
                  <span className="text-amber-400 font-bold">
                    Bs. {repMensualidades?.resumen?.total_pendiente ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Efectividad de Cobranza (24/24 cuotas):</span>
                  <span className="text-white font-bold">{repMensualidades?.resumen?.porcentaje_cobro || 100}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Certificados Emitidos (Septiembre 2026):</span>
                  <span className="text-oro-400 font-bold">3 Certificados (Ciclo Trimestral)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informe de Crecimiento Artístico y Alumnos Más Destacados (Certificación Trimestral — Septiembre 2026) */}
          <div className="bg-slate-900 border border-teatro-300/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-slab text-teatro-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-oro-400" /> Evaluación Docente e Informe de Crecimiento • Entrega de Certificados Cada 3 Meses
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-theater text-slate-100 mt-1">
                  🌟 Alumnos Más Destacados e Informe de Crecimiento (Certificados Septiembre 2026)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Los 8 estudiantes asistieron con regularidad (máximo 2 faltas) y tienen pagados los 3 meses de Octubre, Noviembre y Diciembre. En Septiembre se otorgaron los 3 certificados del trimestre a los alumnos más destacados:
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-oro-400/40 text-right shrink-0">
                <span className="text-[10px] font-slab text-teatro-300 block">
                  Certificados Otorgados en el Año (Cada 3 Meses)
                </span>
                <span className="text-lg font-bold font-theater text-oro-400">
                  3 Certificados • Septiembre 2026
                </span>
              </div>
            </div>

            {/* Tarjetas de los 3 Alumnos Más Destacados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {destacadosTalleres.slice(0, 3).map((alum, idx) => {
                const faltas = Math.max(0, Number(alum.clases_totales || 16) - Number(alum.clases_asistidas || 0));
                return (
                  <div
                    key={alum.id_inscripcion || idx}
                    className="bg-slate-950/90 border border-oro-400/40 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-oro-500/20 border border-oro-400/50 text-[11px] font-slab text-oro-400 font-bold">
                          #{idx + 1} Alumno Destacado
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {alum.nota_final} / 100 pts
                        </span>
                      </div>
                      <h4 className="text-lg font-bold font-theater text-slate-100">
                        {alum.estudiante_nombres} {alum.estudiante_apellidos}
                      </h4>
                      <p className="text-xs text-teatro-300 font-slab">{alum.curso_nombre}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {alum.observaciones_docente}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-400">Expresión:</span>{' '}
                          <strong className="text-slate-100">{alum.eval_expresion}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Voz y Dicción:</span>{' '}
                          <strong className="text-slate-100">{alum.eval_voz}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Improvisación:</span>{' '}
                          <strong className="text-slate-100">{alum.eval_improvisacion}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Compromiso:</span>{' '}
                          <strong className="text-slate-100">{alum.eval_compromiso}</strong>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-sky-400 font-mono">
                          Asistencia: {alum.clases_asistidas}/{alum.clases_totales} ({faltas}{' '}
                          {faltas === 1 ? 'falta' : 'faltas'})
                        </span>
                        <span className="text-emerald-400 font-semibold">Pagado: Oct-Nov-Dic</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => generarCertificadoPDF(alum)}
                        className="w-full py-2 px-3 bg-oro-500 hover:bg-oro-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Award className="w-3.5 h-3.5" /> Certificado Septiembre ({alum.codigo_certificado})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabla resumen de crecimiento de los 8 estudiantes */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-teatro-300 font-slab">
                  <tr>
                    <th className="p-3">Alumno</th>
                    <th className="p-3">Taller</th>
                    <th className="p-3 text-center">Asistencia (Máx. 2 faltas)</th>
                    <th className="p-3 text-center">Rúbrica (Exp / Voz / Imp / Comp)</th>
                    <th className="p-3 text-center">Promedio / Nivel</th>
                    <th className="p-3">Informe de Crecimiento Escénico</th>
                    <th className="p-3 text-center">Pagos (Oct-Nov-Dic)</th>
                    <th className="p-3 text-center">Certificado Sept.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {destacadosTalleres.map((p) => {
                    const faltas = Math.max(0, Number(p.clases_totales || 16) - Number(p.clases_asistidas || 0));
                    return (
                      <tr key={p.id_inscripcion} className="hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-slate-100">
                          {p.estudiante_nombres} {p.estudiante_apellidos}
                        </td>
                        <td className="p-3 text-slate-300">{p.curso_nombre}</td>
                        <td className="p-3 text-center font-mono text-sky-400">
                          {p.clases_asistidas}/{p.clases_totales} ({faltas} {faltas === 1 ? 'falta' : 'faltas'})
                        </td>
                        <td className="p-3 text-center font-mono text-slate-200">
                          {p.eval_expresion} / {p.eval_voz} / {p.eval_improvisacion} / {p.eval_compromiso}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-oro-400 font-mono">{p.nota_final} pts</span>
                          <span className="block text-[10px] text-teatro-300 font-semibold">
                            {p.nivel_crecimiento}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs">{p.observaciones_docente}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                            3 Meses Pagados
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {p.certificado_otorgado ? (
                            <span className="px-2 py-0.5 rounded-full bg-oro-500/20 text-oro-400 border border-oro-400/50 text-[10px] font-bold">
                              ★ {p.codigo_certificado}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Ciclo en curso</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ranking Oficial: Obras Más Vendidas 2026 (Teatro 16 de Julio) */}
          <div className="bg-slate-900 border border-teatro-300/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-slab text-teatro-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-oro-400" /> Récord Histórico de Taquilla • Temporada 2026
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-theater text-slate-100 mt-1">
                  🏆 Obras Más Vendidas 2026 — Teatro 16 de Julio
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Desglose oficial de boletos vendidos y recaudación por sectores (VIP, Platea y Mezzanine).
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-oro-400/40 text-right">
                <span className="text-[10px] font-slab text-teatro-300 block">
                  Total Consolidado (2 Obras Más Vendidas)
                </span>
                <span className="text-lg font-bold font-theater text-oro-400">
                  1.173 Boletos • Bs. 48.090,00
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {OBRAS_MAS_VENDIDAS_2026.map((obra, index) => (
                <div
                  key={obra.id}
                  className="bg-slate-950/90 border border-teatro-300/25 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={obra.afiche}
                      alt={obra.titulo}
                      className="w-20 h-24 object-cover rounded-xl border border-teatro-300/30 shrink-0"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-oro-400/40 text-[11px] font-slab text-oro-400">
                          #{index + 1} Más Vendida 2026
                        </span>
                        <span className="text-xs font-slab text-teatro-300">{obra.periodo}</span>
                      </div>
                      <h4 className="text-lg font-bold font-theater text-slate-100">{obra.titulo}</h4>
                      <p className="text-xs text-teatro-300 font-slab">🎭 {obra.teatro}</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-teatro-300 font-slab">
                        <tr>
                          <th className="p-2.5">Sector</th>
                          <th className="p-2.5 text-center">Entradas Vendidas</th>
                          <th className="p-2.5 text-right">Recaudación (Bs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {obra.sectores.map((sec) => (
                          <tr key={sec.nombre} className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-semibold text-slate-100">{sec.nombre}</td>
                            <td className="p-2.5 text-center font-mono text-teatro-300">
                              {sec.vendidas} vendidas
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-oro-400">
                              {sec.recaudacion.toLocaleString('es-BO')} Bs.
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900/90 border-t border-slate-700 font-bold">
                        <tr>
                          <td className="p-2.5 text-slate-100">Total Obra</td>
                          <td className="p-2.5 text-center font-mono text-emerald-400">
                            {obra.totalVendidas} vendidas
                          </td>
                          <td className="p-2.5 text-right font-mono text-oro-400">
                            {obra.totalRecaudacion.toLocaleString('es-BO')} Bs.
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB CARTELERA (OBRAS & FUNCIONES) */}
      {tab === 'cartelera' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-theater text-white">Gestión de Obras y Cartelera</h2>
              <p className="text-xs text-slate-400">Crea obras y programa las fechas de presentación.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setModalObra(true)}
                className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-oro-400" /> Nueva Obra
              </button>
              <button
                onClick={() => setModalFuncion(true)}
                className="py-2 px-4 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg"
              >
                <Calendar className="w-4 h-4 text-oro-400" /> Programar Función
              </button>
            </div>
          </div>

          {/* Lista de Obras (Actuales e Históricas) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-theater text-lg font-bold text-white">
                Obras en Repertorio y Archivo Histórico ({obras.length})
              </h3>
              <span className="text-xs text-slate-400">
                Puedes escoger o cambiar el Teatro/Sala y el estado de cada obra desde aquí
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {obras.map((o) => (
                <div
                  key={o.id_obra}
                  className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center flex-1">
                    <img
                      src={o.afiche_url || 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=400&q=80'}
                      alt={o.titulo}
                      className="w-16 h-20 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-white text-sm">{o.titulo}</h4>
                      <span className="text-[10px] text-teatro-300 font-semibold block">
                        {o.publico_objetivo} • {o.duracion_min} min
                      </span>
                      <span className="text-[11px] text-oro-400 font-semibold block">
                        🎭 {o.sala_nombre || 'Cine Teatro 6 de Agosto'} (Cap. {o.sala_capacidad || 392})
                      </span>
                      <p className="text-xs text-slate-400 line-clamp-2">{o.descripcion}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1.5">
                    <select
                      value={o.id_sala || 2}
                      onChange={(e) => cambiarSalaObra(o, e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-[11px] font-semibold text-white"
                      title="Cambiar Teatro / Sala"
                    >
                      {salas.map((s) => (
                        <option key={s.id_sala} value={s.id_sala}>
                          🎭 {s.nombre} ({s.capacidad})
                        </option>
                      ))}
                    </select>
                    <select
                      value={o.estado || 'En cartelera'}
                      onChange={(e) => cambiarEstadoObra(o, e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-[11px] font-bold text-oro-400"
                    >
                      <option value="En cartelera">En cartelera</option>
                      <option value="Próximamente">Próximamente</option>
                      <option value="Finalizada">Finalizada (Archivo)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => eliminarObraPermanentemente(o)}
                      className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1"
                      title="Eliminar obra permanentemente de la BD"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" /> Eliminar Obra
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Funciones Programadas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-theater text-lg font-bold text-white">Programación de Funciones</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Obra</th>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Sala</th>
                    <th className="p-3">Precio</th>
                    <th className="p-3">Cupo Gratuito</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 rounded-r-xl text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {funciones.map((f) => (
                    <tr key={f.id_funcion} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">{f.titulo}</td>
                      <td className="p-3 text-slate-300">
                        {f.fecha} &bull; {f.hora_inicio} hrs
                      </td>
                      <td className="p-3 text-slate-400">{f.sala}</td>
                      <td className="p-3 font-bold text-oro-400">Bs. {f.precio}</td>
                      <td className="p-3 text-purple-400">{f.cupo_gratuito} pases</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700">
                          {f.estado}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => eliminarFuncionPermanentemente(f)}
                          className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition"
                          title="Eliminar función permanentemente"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CUPO SOCIAL (ENTRADAS GRATUITAS) */}
      {tab === 'cupo-social' && (
        <div className="space-y-6 animate-fade-in max-w-3xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-700/60 text-purple-300 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 text-purple-400" />
              Política Institucional de Inclusión
            </div>
            <h2 className="text-2xl font-bold font-theater text-white mt-1">
              Asignación de Entradas Gratuitas (Cupo Social Infantil)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Emite boletos con precio Bs. 0 para niñas y niños de sectores vulnerables, convenios municipales y centros de acogida.
            </p>
          </div>

          <form onSubmit={asignarBoletoGratuito} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seleccionar Función:
              </label>
              <select
                value={idFuncSocial}
                onChange={(e) => setIdFuncSocial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-purple-500"
              >
                {funciones.map((f) => (
                  <option key={f.id_funcion} value={f.id_funcion}>
                    {f.fecha} {f.hora_inicio} - {f.titulo} (Cupo total social: {f.cupo_gratuito})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seleccionar Asiento Disponible en Sala:
              </label>
              <select
                value={asientoElegidoSocial}
                onChange={(e) => setAsientoElegidoSocial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-purple-500"
              >
                {asientosLibresSocial.map((a) => (
                  <option key={a.id_asiento} value={a.id_asiento}>
                    Fila {a.fila} - Butaca #{a.numero} ({a.zona})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block mt-1">
                {asientosLibresSocial.length} butacas libres para asignar.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de la Organización, Hogar o Beneficiario:
              </label>
              <input
                type="text"
                required
                value={beneficiarioSocial}
                onChange={(e) => setBeneficiarioSocial(e.target.value)}
                placeholder="Ej. Fundación Niños con Esperanza / Escuela de Sopocachi"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={asientosLibresSocial.length === 0}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4" /> Emitir Boleto Gratuito con Código QR
            </button>
          </form>
        </div>
      )}

      {/* 4. TAB CURSOS & HORARIOS */}
      {tab === 'cursos' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-theater text-white">Administración de Talleres</h2>
              <p className="text-xs text-slate-400">Configura la oferta formativa, cupos y mensualidades.</p>
            </div>
            <button
              onClick={() => setModalCurso(true)}
              className="py-2 px-4 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-lg"
            >
              <Plus className="w-4 h-4 text-oro-400" /> Crear Taller
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cursos.map((c) => (
              <div
                key={c.id_curso}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teatro-300 bg-teatro-950 px-2.5 py-0.5 rounded-full border border-teatro-800">
                    {c.publico}
                  </span>
                  <span className="text-sm font-bold text-oro-400">Bs. {c.mensualidad}/mes</span>
                </div>

                <h3 className="font-theater text-lg font-bold text-white">{c.nombre}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{c.descripcion}</p>

                <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Cupo Ocupado:</span>
                    <span className="font-bold text-white">
                      {c.inscritos_activos} / {c.cupo_maximo} estudiantes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha Inicio:</span>
                    <span>{c.fecha_inicio}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => eliminarCursoPermanentemente(c)}
                    className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" /> Eliminar Taller
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB COBROS Y MENSUALIDADES */}
      {tab === 'cobros' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-theater text-white">
                Control de Pagos de Estudiantes y Alertas por Correo
              </h2>
              <p className="text-xs text-slate-400">
                Registra los cobros recibidos, exporta el reporte en PDF o envía un correo de recordatorio a quienes tienen pagos pendientes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportarPDF('mensualidades')}
                className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-oro-400 rounded-xl text-xs font-bold border border-oro-500/40 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Exportar Pagos (PDF)
              </button>

              {/* Generar nuevo período */}
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 pl-2">Nuevo período:</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={mesGenerar}
                  onChange={(e) => setMesGenerar(e.target.value)}
                  className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs text-center"
                />
                <span className="text-slate-500">/</span>
                <input
                  type="number"
                  value={anioGenerar}
                  onChange={(e) => setAnioGenerar(e.target.value)}
                  className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs text-center"
                />
                <button
                  type="button"
                  onClick={generarPeriodoMensualidades}
                  className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Generar Cuotas
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Mensualidades */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Estudiante</th>
                    <th className="p-3">Tutor / Contacto / Correo</th>
                    <th className="p-3">Curso</th>
                    <th className="p-3">Período</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 rounded-r-xl text-center">Acciones (Cobro / Correo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mensualidades.map((m) => (
                    <tr key={m.id_mensualidad} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">
                        {m.estudiante_apellidos}, {m.estudiante_nombres}
                      </td>
                      <td className="p-3 text-slate-300">
                        <div>
                          {m.tutor_nombre || 'Mismo titular'} ({m.tutor_telefono || m.estudiante_telefono || 'S/N'})
                        </div>
                        {(m.estudiante_correo || m.tutor_correo) && (
                          <span className="text-[11px] text-sky-400">
                            {m.estudiante_correo || m.tutor_correo}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{m.curso_nombre}</td>
                      <td className="p-3 font-mono">
                        {m.mes}/{m.anio}
                      </td>
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
                      <td className="p-3 text-center">
                        {m.estado === 'PENDIENTE' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => cobrarMensualidad(m.id_mensualidad)}
                              className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                            >
                              Registrar Cobro
                            </button>
                            <button
                              type="button"
                              onClick={() => enviarRecordatorioDesdeAdmin(m)}
                              className="py-1 px-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <Mail className="w-3.5 h-3.5" /> Enviar Correo
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium">
                            ✓ Cobrado {String(m.fecha_pago || '').slice(0, 10)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB USUARIOS Y PERSONAL */}
      {tab === 'usuarios' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-theater text-white">Gestión de Personal & Usuarios</h2>
              <p className="text-xs text-slate-400">Administra cuentas del personal de recepción y compradores.</p>
            </div>
            <button
              onClick={() => setModalUsuario(true)}
              className="py-2 px-4 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-lg"
            >
              <Plus className="w-4 h-4 text-oro-400" /> Crear Cuenta del Personal
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">ID</th>
                    <th className="p-3">Nombre Completo</th>
                    <th className="p-3">Correo Electrónico</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 rounded-r-xl text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usuarios.map((u) => (
                    <tr key={u.id_usuario} className="hover:bg-slate-800/30">
                      <td className="p-3 text-slate-500">#{u.id_usuario}</td>
                      <td className="p-3 font-semibold text-white">
                        {u.nombres} {u.apellidos}
                      </td>
                      <td className="p-3 text-slate-300 font-mono">{u.correo}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-800 text-oro-400 border border-slate-700">
                          {u.rol}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-semibold">
                          {u.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {Number(u.id_usuario) === Number(usuario?.id) ? (
                          <span className="text-[11px] text-slate-500 italic">Sesión actual</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => eliminarUsuarioPermanentemente(u)}
                            className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition"
                            title="Eliminar usuario permanentemente de la BD"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" /> Eliminar Usuario
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB REPORTES CONSOLIDADOS (CON EXPORTACIÓN PDF, CSV, FILTRO DE RANGO DE FECHA Y REPORTES GRÁFICOS) */}
      {tab === 'reportes' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold font-theater text-white">
                Reportes Consolidados y Gráficos (Exportación por Mes, Rango de Fecha o Año General)
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Filtra y exporta el reporte de cualquier mes, rango de fechas o gestión anual completa en PDF (con diagramas de torta y barras) o CSV.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportarPDF('general')}
              className="py-2.5 px-4 bg-oro-500 hover:bg-oro-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shrink-0 self-start lg:self-auto"
            >
              <FileText className="w-4 h-4" /> Exportar Reporte General con Gráficos (PDF)
            </button>
          </div>

          {/* Barra de Filtro por Rango de Fecha / Mes / Año General */}
          <div className="bg-slate-900 border border-teatro-300/30 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-slab text-oro-400 uppercase tracking-wider block">
                  📅 Filtro de Período para Visualización y Exportación
                </span>
                <p className="text-xs text-slate-300">
                  Período activo seleccionado:{' '}
                  <strong className="text-teatro-300 font-slab">{obtenerEtiquetaPeriodoReporte()}</strong>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModoFiltroReporte('ANUAL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    modoFiltroReporte === 'ANUAL'
                      ? 'bg-teatro-700 text-white border border-teatro-300/40'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                  }`}
                >
                  📆 General del Año
                </button>
                <button
                  type="button"
                  onClick={() => setModoFiltroReporte('MES')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    modoFiltroReporte === 'MES'
                      ? 'bg-teatro-700 text-white border border-teatro-300/40'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                  }`}
                >
                  🗓️ Cualquier Mes
                </button>
                <button
                  type="button"
                  onClick={() => setModoFiltroReporte('RANGO')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    modoFiltroReporte === 'RANGO'
                      ? 'bg-teatro-700 text-white border border-teatro-300/40'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                  }`}
                >
                  ↔️ Rango de Fechas
                </button>
              </div>
            </div>

            {/* Controles dinámicos según el modo elegido */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs">
              {modoFiltroReporte === 'ANUAL' && (
                <div className="flex items-center gap-2">
                  <label className="text-slate-300 font-semibold">Gestión Anual:</label>
                  <select
                    value={anioFiltroRep}
                    onChange={(e) => setAnioFiltroRep(Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                  >
                    <option value={2026}>Año 2026 (Gestión Completa)</option>
                    <option value={2025}>Año 2025</option>
                  </select>
                </div>
              )}

              {modoFiltroReporte === 'MES' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300 font-semibold">Seleccionar Mes:</label>
                    <select
                      value={mesFiltroRep}
                      onChange={(e) => setMesFiltroRep(Number(e.target.value))}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                    >
                      {NOMBRES_MESES.slice(1).map((nombre, i) => (
                        <option key={nombre} value={i + 1}>
                          {nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300 font-semibold">Año:</label>
                    <select
                      value={anioFiltroRep}
                      onChange={(e) => setAnioFiltroRep(Number(e.target.value))}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                </>
              )}

              {modoFiltroReporte === 'RANGO' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300 font-semibold">Desde:</label>
                    <input
                      type="date"
                      value={fechaInicioRep}
                      onChange={(e) => setFechaInicioRep(e.target.value)}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300 font-semibold">Hasta:</label>
                    <input
                      type="date"
                      value={fechaFinRep}
                      onChange={(e) => setFechaFinRep(e.target.value)}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECCIÓN DE REPORTES GRÁFICOS: DIAGRAMAS DE TORTA Y DIAGRAMAS DE BARRAS */}
          <div className="bg-slate-900 border border-teatro-300/30 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-slab text-oro-400">
                  📊 Visualización Estadística • {obtenerEtiquetaPeriodoReporte()}
                </span>
                <h3 className="text-xl font-bold font-theater text-slate-100 mt-0.5">
                  Reportes Gráficos — Diagramas de Torta y Diagramas de Barras
                </h3>
              </div>
              <span className="text-xs text-teatro-300 font-slab">
                Incluidos automáticamente al exportar cualquier reporte en PDF
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 1. DIAGRAMA DE TORTA: Distribución de Boletos por Sector */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold font-theater text-slate-100">
                  🥧 Diagrama de Torta — Ventas de Boletería por Sector (1.173 Boletos)
                </h4>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div
                    className="w-36 h-36 rounded-full shrink-0 relative flex items-center justify-center shadow-lg border-2 border-slate-800"
                    style={{
                      background:
                        'conic-gradient(#DCCE40 0% 34.1%, #C4AEF4 34.1% 98.0%, #CCA4B4 98.0% 100%)',
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-950 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-slate-100 font-mono">1.173</span>
                      <span className="text-[9px] text-teatro-300">Boletos</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="flex items-center gap-2 font-semibold text-slate-100">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#DCCE40' }} />
                        Sector VIP (34.1%)
                      </span>
                      <span className="font-mono text-oro-400 font-bold">400 vend. • Bs. 28.000</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="flex items-center gap-2 font-semibold text-slate-100">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#C4AEF4' }} />
                        Sector Platea (63.9%)
                      </span>
                      <span className="font-mono text-teatro-300 font-bold">750 vend. • Bs. 19.610</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="flex items-center gap-2 font-semibold text-slate-100">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#CCA4B4' }} />
                        Sector Mezzanine (2.0%)
                      </span>
                      <span className="font-mono text-slate-300 font-bold">23 vend. • Bs. 480</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DIAGRAMA DE BARRAS: Recaudación por Obra y Talleres */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold font-theater text-slate-100">
                  📊 Diagrama de Barras — Recaudación por Obra y Talleres (Bs. 52.410 Total)
                </h4>
                <div className="space-y-3 text-xs pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-100">
                        1. NO HAY UN CEMENTERIO PARA MÍ (613 boletos)
                      </span>
                      <span className="font-mono font-bold text-oro-400">Bs. 24.860,00 (47.4%)</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full rounded-full" style={{ width: '95%', background: '#DCCE40' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-100">
                        2. Show Huntrix — Mayo 2026 (560 boletos)
                      </span>
                      <span className="font-mono font-bold text-teatro-300">Bs. 23.230,00 (44.3%)</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full rounded-full" style={{ width: '89%', background: '#C4AEF4' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-100">
                        3. Mensualidades Talleres (Octubre, Noviembre y Diciembre — 8 alumnos)
                      </span>
                      <span className="font-mono font-bold text-emerald-400">Bs. 4.320,00 (100% Pagado)</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full rounded-full" style={{ width: '35%', background: '#34d399' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. DIAGRAMA DE TORTA: Pagos Trimestrales y Certificados de Septiembre */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold font-theater text-slate-100">
                  🥧 Diagrama de Torta — Mensualidades Pagadas (Oct, Nov, Dic) y Certificados (Sept)
                </h4>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div
                    className="w-36 h-36 rounded-full shrink-0 relative flex items-center justify-center shadow-lg border-2 border-slate-800"
                    style={{
                      background:
                        'conic-gradient(#DCCE40 0% 33.3%, #C4AEF4 33.3% 66.6%, #CCA4B4 66.6% 100%)',
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-slate-950 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-emerald-400 font-mono">100%</span>
                      <span className="text-[9px] text-slate-300">24 Cuotas</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="flex items-center gap-2 font-semibold text-slate-100">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#DCCE40' }} />
                        Octubre 2026 (8 alumnos)
                      </span>
                      <span className="font-mono text-oro-400 font-bold">Bs. 1.440 • PAGADO</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="flex items-center gap-2 font-semibold text-slate-100">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#C4AEF4' }} />
                        Noviembre 2026 (8 alumnos)
                      </span>
                      <span className="font-mono text-teatro-300 font-bold">Bs. 1.440 • PAGADO</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="flex items-center gap-2 font-semibold text-slate-100">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#CCA4B4' }} />
                        Diciembre 2026 (8 alumnos)
                      </span>
                      <span className="font-mono text-slate-200 font-bold">Bs. 1.440 • PAGADO</span>
                    </div>
                    <div className="pt-1 text-[11px] text-oro-400 font-slab">
                      ★ 3 Certificados entregados en Septiembre 2026 (Gareth, Steven y Samara).
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. DIAGRAMA DE BARRAS: Informe de Crecimiento Artístico de los 8 Alumnos */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-sm font-bold font-theater text-slate-100">
                  📊 Diagrama de Barras — Evaluación de Crecimiento de los 8 Alumnos (Sobre 100 pts)
                </h4>
                <div className="space-y-2 text-xs">
                  {destacadosTalleres.slice(0, 8).map((alum, idx) => {
                    const faltas = Math.max(
                      0,
                      Number(alum.clases_totales || 16) - Number(alum.clases_asistidas || 0)
                    );
                    const esTop = idx < 3;
                    return (
                      <div key={alum.id_inscripcion || idx} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-slate-100">
                            {idx + 1}. {alum.estudiante_nombres} {alum.estudiante_apellidos}{' '}
                            {esTop && <span className="text-oro-400 font-bold">★ Cert. Sept.</span>}
                          </span>
                          <span className="font-mono text-teatro-300">
                            {alum.nota_final} pts • {alum.clases_asistidas}/{alum.clases_totales} asist. ({faltas}{' '}
                            {faltas === 1 ? 'falta' : 'faltas'})
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Number(alum.nota_final || 90))}%`,
                              background: esTop ? '#DCCE40' : '#C4AEF4',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 1. Reporte de Ventas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <h3 className="font-theater text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-oro-400" /> 1. Reporte de Ventas de Boletería e Ingresos ({obtenerEtiquetaPeriodoReporte()})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportarPDF('ventas')}
                  className="py-1.5 px-3.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <FileText className="w-3.5 h-3.5 text-oro-400" /> Exportar en PDF
                </button>
                <button
                  onClick={() => exportarCSV('ventas')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-oro-400" /> CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Boletos Vendidos</span>
                <span className="text-xl font-bold text-emerald-400">
                  {(repVentas?.resumen?.total_boletos_vendidos || 1173).toLocaleString('es-BO')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Cupo Social Gratuito</span>
                <span className="text-xl font-bold text-purple-400">{repVentas?.resumen?.total_entradas_gratuitas || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Asistentes en Sala</span>
                <span className="text-xl font-bold text-white">
                  {(repVentas?.resumen?.total_asistentes || 1173).toLocaleString('es-BO')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Ingresos Totales (Bs.)</span>
                <span className="text-xl font-bold text-oro-400 font-theater">
                  Bs. {(repVentas?.resumen?.total_ingresos || 48090).toLocaleString('es-BO')}
                </span>
              </div>
            </div>

            {/* Tabla detallada de Obras Más Vendidas 2026 dentro de Reportes */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-sm font-bold font-theater text-slate-100 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-oro-400" /> Desglose por Sectores — Obras Más Vendidas 2026 (Teatro 16 de Julio)
                </h4>
                <span className="text-xs font-slab text-teatro-300">
                  VIP (400 vendidas: 28.000 Bs.) • Platea (750 vendidas: 19.610 Bs.) • Mezzanine (23 vendidas: 480 Bs.)
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-teatro-300 font-slab">
                    <tr>
                      <th className="p-3">Obra</th>
                      <th className="p-3">Teatro / Mes</th>
                      <th className="p-3 text-center">Sector VIP</th>
                      <th className="p-3 text-center">Sector Platea</th>
                      <th className="p-3 text-center">Sector Mezzanine</th>
                      <th className="p-3 text-center">Total Boletos</th>
                      <th className="p-3 text-right">Recaudación Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {OBRAS_MAS_VENDIDAS_2026.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-slate-100">{o.titulo}</td>
                        <td className="p-3 text-slate-300">
                          {o.teatro} <span className="text-teatro-300 font-slab">({o.periodo})</span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="text-slate-100 font-semibold">{o.sectores[0].vendidas} vend.</span>
                          <span className="block text-oro-400">{o.sectores[0].recaudacion.toLocaleString('es-BO')} Bs.</span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="text-slate-100 font-semibold">{o.sectores[1].vendidas} vend.</span>
                          <span className="block text-oro-400">{o.sectores[1].recaudacion.toLocaleString('es-BO')} Bs.</span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="text-slate-100 font-semibold">{o.sectores[2].vendidas} vend.</span>
                          <span className="block text-oro-400">{o.sectores[2].recaudacion.toLocaleString('es-BO')} Bs.</span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400">
                          {o.totalVendidas} boletos
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-oro-400">
                          {o.totalRecaudacion.toLocaleString('es-BO')} Bs.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 border-t border-slate-700 font-bold">
                    <tr>
                      <td className="p-3 text-slate-100" colSpan={2}>
                        TOTAL CONSOLIDADO OBRAS MÁS VENDIDAS 2026
                      </td>
                      <td className="p-3 text-center font-mono text-oro-400">400 vend. (28.000 Bs.)</td>
                      <td className="p-3 text-center font-mono text-oro-400">750 vend. (19.610 Bs.)</td>
                      <td className="p-3 text-center font-mono text-oro-400">23 vend. (480 Bs.)</td>
                      <td className="p-3 text-center font-mono text-emerald-400">1.173 boletos</td>
                      <td className="p-3 text-right font-mono text-oro-400">48.090 Bs.</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* 2. Reporte de Ocupación de Sala */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <h3 className="font-theater text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-oro-400" /> 2. Reporte de Ocupación y Asistencia de Sala ({obtenerEtiquetaPeriodoReporte()})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportarPDF('asistencia')}
                  className="py-1.5 px-3.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <FileText className="w-3.5 h-3.5 text-oro-400" /> Exportar en PDF
                </button>
                <button
                  onClick={() => exportarCSV('asistencia')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-oro-400" /> CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-teatro-300 font-slab">
                  <tr>
                    <th className="p-3">Obra</th>
                    <th className="p-3">Teatro / Sala</th>
                    <th className="p-3">Fecha / Período</th>
                    <th className="p-3 text-center">Emitidos / Capacidad</th>
                    <th className="p-3 text-center">Asistentes Validados</th>
                    <th className="p-3 text-center">% Ocupación</th>
                    <th className="p-3 text-right">% Asistencia QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {OBRAS_MAS_VENDIDAS_2026.map((o) => (
                    <tr key={`asist-2026-${o.id}`} className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-slate-100">{o.titulo}</td>
                      <td className="p-3 text-teatro-300">{o.teatro}</td>
                      <td className="p-3 text-slate-300">{o.periodo}</td>
                      <td className="p-3 text-center font-mono text-slate-100">
                        {o.totalVendidas} / 650
                      </td>
                      <td className="p-3 text-center text-emerald-400 font-bold font-mono">
                        {o.totalVendidas}
                      </td>
                      <td className="p-3 text-center font-mono text-oro-400 font-semibold">
                        {((o.totalVendidas / 650) * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">100.0%</td>
                    </tr>
                  ))}
                  {asistenciaFiltrada.map((a) => (
                    <tr key={a.id_funcion} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">{a.titulo}</td>
                      <td className="p-3 text-slate-300">{a.sala || 'Cine Teatro 6 de Agosto'}</td>
                      <td className="p-3 text-slate-300">
                        {String(a.fecha).slice(0, 10)} {a.hora_inicio}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {a.total_emitidos} / {a.capacidad}
                      </td>
                      <td className="p-3 text-center text-emerald-400 font-bold font-mono">
                        {a.asistentes}
                      </td>
                      <td className="p-3 text-center font-mono">{a.porcentaje_ocupacion}%</td>
                      <td className="p-3 text-right font-mono font-bold text-oro-400">
                        {a.porcentaje_asistencia}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Informe de Talleres: Asistencia, Crecimiento, Quienes Culminaron y Certificados */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <h3 className="font-theater text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-oro-400" /> 3. Informe de Crecimiento de Talleres, Asistencia y Certificados (Septiembre 2026)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportarPDF('talleres')}
                  className="py-1.5 px-3.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <FileText className="w-3.5 h-3.5 text-oro-400" /> Exportar Informe en PDF
                </button>
                <button
                  onClick={() => exportarCSV('talleres')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-oro-400" /> CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Alumnos Activos</span>
                <span className="text-xl font-bold text-white">{destacadosTalleres.length || 8}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Promedio Asistencia</span>
                <span className="text-xl font-bold text-sky-400">
                  {repTalleres?.resumen?.promedio_asistencia || 93.8}% (Máx. 2 faltas)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Promedio Crecimiento</span>
                <span className="text-xl font-bold text-emerald-400">
                  {repTalleres?.resumen?.promedio_nota || 91.4} / 100 pts
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Certificados (Septiembre)</span>
                <span className="text-xl font-bold text-oro-400">3 (Cada 3 meses)</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-teatro-300 font-slab">
                  <tr>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3">Taller</th>
                    <th className="p-3 text-center">Asistencia (Faltas)</th>
                    <th className="p-3 text-center">Rúbrica (Exp/Voz/Imp/Comp)</th>
                    <th className="p-3 text-center">Nota / Crecimiento</th>
                    <th className="p-3">Informe de Crecimiento Docente</th>
                    <th className="p-3 text-center">Certificado (Sept. 2026)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {destacadosTalleres.map((p) => {
                    const faltas = Math.max(
                      0,
                      Number(p.clases_totales || 16) - Number(p.clases_asistidas || 0)
                    );
                    return (
                      <tr key={p.id_inscripcion} className="hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-white">
                          {p.estudiante_nombres} {p.estudiante_apellidos}
                        </td>
                        <td className="p-3 text-slate-300">{p.curso_nombre}</td>
                        <td className="p-3 text-center font-mono text-sky-400">
                          {p.clases_asistidas}/{p.clases_totales} ({faltas}{' '}
                          {faltas === 1 ? 'falta' : 'faltas'})
                        </td>
                        <td className="p-3 text-center font-mono text-slate-200">
                          {p.eval_expresion} / {p.eval_voz} / {p.eval_improvisacion} / {p.eval_compromiso}
                        </td>
                        <td className="p-3 text-center">
                          <strong className="text-oro-400 font-mono">{p.nota_final} pts</strong>
                          <span className="block text-[10px] text-teatro-300 font-bold">
                            {p.nivel_crecimiento}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs">{p.observaciones_docente}</td>
                        <td className="p-3 text-center">
                          {p.certificado_otorgado ? (
                            <button
                              type="button"
                              onClick={() => generarCertificadoPDF(p)}
                              className="py-1 px-2.5 bg-oro-500 hover:bg-oro-400 text-slate-950 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                            >
                              <Award className="w-3.5 h-3.5" /> Diploma ({p.codigo_certificado})
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Próximo ciclo trimestral</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Reporte de Mensualidades (Octubre, Noviembre y Diciembre Pagados) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <h3 className="font-theater text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-oro-400" /> 4. Reporte de Pagos y Mensualidades — Octubre, Noviembre y Diciembre ({obtenerEtiquetaPeriodoReporte()})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => exportarPDF('mensualidades')}
                  className="py-1.5 px-3.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <FileText className="w-3.5 h-3.5 text-oro-400" /> Exportar en PDF
                </button>
                <button
                  onClick={() => exportarCSV('mensualidades')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-oro-400" /> CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  Recaudado (Oct - Nov - Dic)
                </span>
                <span className="text-xl font-bold text-emerald-400">
                  Bs. {(repMensualidades?.resumen?.total_recaudado || 4320).toLocaleString('es-BO')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Pendiente de Cobro</span>
                <span className="text-xl font-bold text-amber-400">
                  Bs. {repMensualidades?.resumen?.total_pendiente ?? 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Cuotas Pagadas</span>
                <span className="text-xl font-bold text-white">
                  {mensualidadesFiltradasReporte.filter((m) => m.estado === 'PAGADA').length || 24} cuotas
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Efectividad</span>
                <span className="text-xl font-bold text-oro-400">
                  {repMensualidades?.resumen?.porcentaje_cobro || 100}%
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-teatro-300 font-slab">
                  <tr>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3">Tutor / Contacto</th>
                    <th className="p-3">Taller</th>
                    <th className="p-3 text-center">Mes / Año</th>
                    <th className="p-3 text-center">Monto</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-right">Fecha de Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mensualidadesFiltradasReporte.map((m) => (
                    <tr key={m.id_mensualidad} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">
                        {m.estudiante_nombres} {m.estudiante_apellidos}
                      </td>
                      <td className="p-3 text-slate-300">
                        {m.tutor_nombre || 'Titular'} ({m.tutor_telefono || m.estudiante_telefono || 'S/N'})
                      </td>
                      <td className="p-3 text-slate-300">{m.curso_nombre}</td>
                      <td className="p-3 text-center font-mono text-teatro-300">
                        {NOMBRES_MESES[Number(m.mes)] || m.mes} / {m.anio}
                      </td>
                      <td className="p-3 text-center font-bold text-oro-400 font-mono">Bs. {m.monto}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700">
                          {m.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        ✓ {String(m.fecha_pago || '').slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CORREO DE RECORDATORIO EN PANEL ADMIN */}
      {modalCorreoAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold font-theater text-white">
                Correo de Recordatorio Generado ({modalCorreoAdmin.estudiante})
              </h3>
              <button
                type="button"
                onClick={() => setModalCorreoAdmin(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Para: </span>
                  <strong className="text-sky-400">{modalCorreoAdmin.correo_destino || 'Sin correo'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Asunto: </span>
                  <strong className="text-white">{modalCorreoAdmin.asunto}</strong>
                </div>
              </div>
              <textarea
                readOnly
                rows="9"
                value={modalCorreoAdmin.cuerpo}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs"
              />
              <div className="flex gap-2">
                <a
                  href={modalCorreoAdmin.mailto_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Abrir en Cliente de Correo
                </a>
                <a
                  href={modalCorreoAdmin.whatsapp_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Enviar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR OBRA (CON SELECTOR DE TEATRO/SALA DE LA BASE DE DATOS) */}
      {modalObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold font-theater text-white">Nueva Obra Teatral</h3>
            <form onSubmit={guardarObra} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título de la Obra *</label>
                <input
                  type="text"
                  required
                  value={tituloObra}
                  onChange={(e) => setTituloObra(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  placeholder="Ej. El Principito y las Estrellas"
                />
              </div>

              {/* Selector de Teatro / Sala según la Base de Datos */}
              <div className="p-3.5 bg-slate-950 border border-oro-500/40 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-oro-400">
                  🎭 Escoger Teatro / Sala de Presentación (según Base de Datos) *
                </label>
                <select
                  value={idSalaObra}
                  onChange={(e) => setIdSalaObra(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-oro-400"
                >
                  {salas.map((s) => (
                    <option key={s.id_sala} value={s.id_sala}>
                      {s.nombre} — Capacidad: {s.capacidad} butacas
                    </option>
                  ))}
                </select>
                {(() => {
                  const salaSel = salas.find((s) => Number(s.id_sala) === Number(idSalaObra));
                  return salaSel ? (
                    <p className="text-[11px] text-slate-400">
                      📍 <strong className="text-slate-200">{salaSel.direccion}</strong>
                      {salaSel.plano ? ` • ${salaSel.plano}` : ''}
                    </p>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción / Sinopsis</label>
                <textarea
                  rows="3"
                  value={descObra}
                  onChange={(e) => setDescObra(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  placeholder="Sinopsis de la obra..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duración (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={duracionObra}
                    onChange={(e) => setDuracionObra(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Público</label>
                  <input
                    type="text"
                    value={publicoObra}
                    onChange={(e) => setPublicoObra(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Estado</label>
                  <select
                    value={estadoObraNueva}
                    onChange={(e) => setEstadoObraNueva(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  >
                    <option value="En cartelera">En cartelera</option>
                    <option value="Próximamente">Próximamente</option>
                    <option value="Finalizada">Archivo Histórico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL Afiche / Imagen</label>
                <input
                  type="url"
                  value={aficheObra}
                  onChange={(e) => setAficheObra(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                />
              </div>

              {/* Opción rápida para programar fecha de función en ese teatro al mismo tiempo */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={programarAlCrear}
                    onChange={(e) => setProgramarAlCrear(e.target.checked)}
                    className="w-4 h-4 accent-teatro-600"
                  />
                  Programar también fecha, hora y precio de función en este teatro ahora
                </label>

                {programarAlCrear && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Fecha *</label>
                      <input
                        type="date"
                        required={programarAlCrear}
                        value={fechaObraInicial}
                        onChange={(e) => setFechaObraInicial(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Hora *</label>
                      <input
                        type="time"
                        required={programarAlCrear}
                        value={horaObraInicial}
                        onChange={(e) => setHoraObraInicial(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Precio Base (Bs.)</label>
                      <input
                        type="number"
                        min="0"
                        value={precioObraInicial}
                        onChange={(e) => setPrecioObraInicial(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalObra(false)}
                  className="w-1/3 py-2 px-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 px-4 bg-teatro-700 hover:bg-teatro-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Guardar Obra y Teatro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROGRAMAR FUNCIÓN */}
      {modalFuncion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold font-theater text-white">Programar Función en Cartelera</h3>
            <form onSubmit={guardarFuncion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Obra *</label>
                <select
                  value={idObraFuncion}
                  onChange={(e) => setIdObraFuncion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                >
                  {obras.map((o) => (
                    <option key={o.id_obra} value={o.id_obra}>
                      {o.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sala / Teatro *</label>
                <select
                  value={idSalaFuncion}
                  onChange={(e) => setIdSalaFuncion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                >
                  {salas.map((s) => (
                    <option key={s.id_sala} value={s.id_sala}>
                      {s.nombre} (Capacidad: {s.capacidad})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={fechaFuncion}
                    onChange={(e) => setFechaFuncion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    required
                    value={horaFuncion}
                    onChange={(e) => setHoraFuncion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Entrada (Bs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={precioFuncion}
                    onChange={(e) => setPrecioFuncion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cupo Social Gratuito</label>
                  <input
                    type="number"
                    min="0"
                    value={cupoGratuitoFuncion}
                    onChange={(e) => setCupoGratuitoFuncion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalFuncion(false)}
                  className="w-1/3 py-2 px-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 px-4 bg-teatro-700 hover:bg-teatro-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Programar en Cartelera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR TALLER */}
      {modalCurso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold font-theater text-white">Nuevo Taller Formativo</h3>
            <form onSubmit={guardarCurso} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Curso *</label>
                <input
                  type="text"
                  required
                  value={nombreCurso}
                  onChange={(e) => setNombreCurso(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  placeholder="Ej. Taller de Máscaras y Expresión"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Público *</label>
                  <select
                    value={publicoCurso}
                    onChange={(e) => setPublicoCurso(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  >
                    <option value="NINOS">Niños</option>
                    <option value="JOVENES">Jóvenes</option>
                    <option value="ADULTOS">Adultos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cupo Máximo</label>
                  <input
                    type="number"
                    min="1"
                    value={cupoCurso}
                    onChange={(e) => setCupoCurso(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mensualidad (Bs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={mensualidadCurso}
                    onChange={(e) => setMensualidadCurso(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={fechaInicioCurso}
                    onChange={(e) => setFechaInicioCurso(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl space-y-2 border border-slate-800">
                <span className="text-[10px] font-bold text-oro-400 uppercase">Horario Semanal</span>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={diaSemanaCurso}
                    onChange={(e) => setDiaSemanaCurso(e.target.value)}
                    className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  >
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                    <option value="7">Domingo</option>
                  </select>
                  <input
                    type="time"
                    value={horaInicioCurso}
                    onChange={(e) => setHoraInicioCurso(e.target.value)}
                    className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  />
                  <input
                    type="time"
                    value={horaFinCurso}
                    onChange={(e) => setHoraFinCurso(e.target.value)}
                    className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalCurso(false)}
                  className="w-1/3 py-2 px-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 px-4 bg-teatro-700 hover:bg-teatro-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Guardar Taller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR USUARIO / PERSONAL */}
      {modalUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold font-theater text-white">Crear Cuenta de Personal</h3>
            <form onSubmit={crearUsuarioStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombres (solo letras) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombresUser}
                    onChange={(e) =>
                      setNombresUser(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Apellidos (solo letras) *
                  </label>
                  <input
                    type="text"
                    required
                    value={apellidosUser}
                    onChange={(e) =>
                      setApellidosUser(e.target.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, ''))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico Real (Verificado por DNS MX) *
                </label>
                <input
                  type="email"
                  required
                  value={correoUser}
                  onChange={(e) => setCorreoUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                  placeholder="personal@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contraseña (Mín. 8 caracteres, letras y números) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passUser}
                  onChange={(e) => setPassUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rol en el Sistema *</label>
                <select
                  value={rolUser}
                  onChange={(e) => setRolUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teatro-500"
                >
                  <option value="RECEPCION">Personal de Recepción (Validación en puerta)</option>
                  <option value="DOCENTE">Docente de Talleres (Evaluación y Asistencia)</option>
                  <option value="ADMINISTRADOR">Administrador / Dirección</option>
                  <option value="COMPRADOR">Comprador</option>
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalUsuario(false)}
                  className="w-1/3 py-2 px-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 px-4 bg-teatro-700 hover:bg-teatro-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
