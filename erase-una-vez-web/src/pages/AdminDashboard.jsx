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

  // Reportes
  const [repVentas, setRepVentas] = useState(null);
  const [repAsistencia, setRepAsistencia] = useState([]);
  const [repMensualidades, setRepMensualidades] = useState(null);
  const [repTalleres, setRepTalleres] = useState(null);
  const [modalCorreoAdmin, setModalCorreoAdmin] = useState(null);

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

  const exportarCSV = (tipo) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = 'reporte.csv';

    if (tipo === 'ventas' && repVentas?.funciones) {
      filename = `reporte_ventas_eraseunavez_${Date.now()}.csv`;
      csvContent += 'ID Funcion,Obra,Fecha,Boletos Vendidos,Entradas Gratuitas,Total Emitidos,Ingresos (Bs.),Asistentes en Sala\n';
      repVentas.funciones.forEach((f) => {
        csvContent += `"${f.id_funcion}","${f.titulo}","${f.fecha}","${f.boletos_vendidos}","${f.entradas_gratuitas}","${f.total_emitidos}","${f.ingresos}","${f.asistentes}"\n`;
      });
    } else if (tipo === 'asistencia') {
      filename = `reporte_asistencia_eraseunavez_${Date.now()}.csv`;
      csvContent += 'ID Funcion,Obra,Fecha,Hora,Sala,Capacidad,Emitidos,Asistentes,% Ocupacion,% Asistencia\n';
      repAsistencia.forEach((a) => {
        csvContent += `"${a.id_funcion}","${a.titulo}","${a.fecha}","${a.hora_inicio}","${a.sala}","${a.capacidad}","${a.total_emitidos}","${a.asistentes}","${a.porcentaje_ocupacion}%","${a.porcentaje_asistencia}%"\n`;
      });
    } else if (tipo === 'mensualidades' && repMensualidades?.cursos) {
      filename = `reporte_mensualidades_eraseunavez_${Date.now()}.csv`;
      csvContent += 'ID Curso,Nombre Taller,Costo Mensual,Total Cuotas,Cuotas Pagadas,Cuotas Pendientes,Total Recaudado (Bs.),Total Pendiente (Bs.)\n';
      repMensualidades.cursos.forEach((c) => {
        csvContent += `"${c.id_curso}","${c.curso_nombre}","${c.costo_mensual}","${c.total_cuotas}","${c.cuotas_pagadas}","${c.cuotas_pendientes}","${c.total_recaudado}","${c.total_pendiente}"\n`;
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
    if (tipo === 'ventas') {
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
      const filasSistema = (repVentas?.funciones || []).map((f) => [
        f.titulo,
        `${String(f.fecha).slice(0, 10)} ${f.hora_inicio || ''}`,
        f.sala_nombre || 'Sala Principal',
        f.boletos_vendidos,
        f.entradas_gratuitas,
        f.total_emitidos,
        f.asistentes,
        `Bs. ${f.ingresos}`,
      ]);
      generarReportePDF({
        titulo: '1. Reporte Consolidado de Ventas de Boletería e Ingresos (Incluye Obras Más Vendidas 2026)',
        subtitulo: 'Auditoría de recaudación por función, desglose VIP / Platea / Mezzanine (Teatro 16 de Julio) y asistencia',
        kpis: [
          { etiqueta: 'Boletos Vendidos', valor: repVentas?.resumen?.total_boletos_vendidos || 1173 },
          { etiqueta: 'Cupo Social Gratuito', valor: repVentas?.resumen?.total_entradas_gratuitas || 0 },
          { etiqueta: 'Asistentes en Sala', valor: repVentas?.resumen?.total_asistentes || 1173 },
          { etiqueta: 'Ingresos Totales', valor: `Bs. ${(repVentas?.resumen?.total_ingresos || 48090).toLocaleString('es-BO')}` },
        ],
        columnas: ['Obra y Desglose por Sector', 'Periodo / Fecha', 'Teatro / Sala', 'Vendidos', 'Gratuitos', 'Emitidos', 'Asistentes', 'Ingresos (Bs.)'],
        filas: [...filasObrasMasVendidas, ...filasSistema],
      });
    } else if (tipo === 'asistencia') {
      generarReportePDF({
        titulo: '2. Reporte de Ocupación y Asistencia en Sala',
        subtitulo: 'Control de aforo, boletos emitidos y porcentaje de asistencia validada en puerta',
        kpis: [
          { etiqueta: 'Funciones Evaluadas', valor: repAsistencia.length },
        ],
        columnas: ['Obra', 'Fecha y Hora', 'Sala', 'Capacidad', 'Emitidos', 'Asistentes', '% Ocupación', '% Asistencia'],
        filas: repAsistencia.map((a) => [
          a.titulo,
          `${String(a.fecha).slice(0, 10)} ${a.hora_inicio || ''}`,
          a.sala,
          a.capacidad,
          a.total_emitidos,
          a.asistentes,
          `${a.porcentaje_ocupacion}%`,
          `${a.porcentaje_asistencia}%`,
        ]),
      });
    } else if (tipo === 'talleres') {
      const part = repTalleres?.participantes || [];
      generarReportePDF({
        titulo: '3. Informe Académico de Talleres: Asistencia, Evaluaciones y Certificados',
        subtitulo: 'Crecimiento artístico de estudiantes, quiénes culminaron y certificados otorgados',
        kpis: [
          { etiqueta: 'Total Inscritos', valor: repTalleres?.resumen?.total_inscritos || 0 },
          { etiqueta: 'Promedio Asistencia', valor: `${repTalleres?.resumen?.promedio_asistencia || 0}%` },
          { etiqueta: 'Culminaron Taller', valor: repTalleres?.resumen?.total_culminaron || 0 },
          { etiqueta: 'Certificados Emitidos', valor: repTalleres?.resumen?.total_certificados || 0 },
        ],
        columnas: ['Estudiante', 'Taller', 'Asistencia', 'Nota Final', 'Nivel Crecimiento', '¿Culminó?', 'Certificado'],
        filas: part.map((p) => [
          `${p.estudiante_apellidos || ''} ${p.estudiante_nombres || ''}`.trim(),
          p.curso_nombre,
          `${p.clases_asistidas}/${p.clases_totales} (${p.asistencia_porcentaje}%)`,
          `${p.nota_final} / 100`,
          p.nivel_crecimiento,
          p.culmino_taller ? 'SÍ CULMINÓ' : 'En curso',
          p.certificado_otorgado ? `SÍ (${p.codigo_certificado})` : 'Pendiente',
        ]),
      });
    } else if (tipo === 'mensualidades') {
      generarReportePDF({
        titulo: '4. Reporte de Control de Pagos y Mensualidades de Talleres',
        subtitulo: 'Estado de cobranza mensual por estudiante y taller formativo',
        kpis: [
          { etiqueta: 'Total Recaudado', valor: `Bs. ${repMensualidades?.resumen?.total_recaudado || 0}` },
          { etiqueta: 'Total Pendiente', valor: `Bs. ${repMensualidades?.resumen?.total_pendiente || 0}` },
          { etiqueta: 'Cuotas Pagadas', valor: repMensualidades?.resumen?.cuotas_pagadas || 0 },
          { etiqueta: 'Efectividad Cobro', valor: `${repMensualidades?.resumen?.porcentaje_cobro || 0}%` },
        ],
        columnas: ['Estudiante', 'Tutor / Teléfono', 'Taller', 'Período', 'Monto', 'Estado', 'Pago / Avisos'],
        filas: mensualidades.map((m) => [
          `${m.estudiante_apellidos || ''}, ${m.estudiante_nombres || ''}`,
          `${m.tutor_nombre || 'Titular'} (${m.tutor_telefono || m.estudiante_telefono || 'S/N'})`,
          m.curso_nombre,
          `${m.mes}/${m.anio}`,
          `Bs. ${m.monto}`,
          m.estado,
          m.estado === 'PAGADA' ? `Cobrado ${String(m.fecha_pago || '').slice(0, 10)}` : `${m.cantidad_recordatorios || 0} aviso(s)`,
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
            📊 Resumen KPIs
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
                Control consolidado de cuotas mensuales y seguimiento de participantes infantiles, juveniles y adultos.
              </p>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Recaudado en Cuotas:</span>
                  <span className="text-emerald-400 font-bold">Bs. {repMensualidades?.resumen?.total_recaudado || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cuotas Pendientes de Cobro:</span>
                  <span className="text-amber-400 font-bold">Bs. {repMensualidades?.resumen?.total_pendiente || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Efectividad de Cobranza:</span>
                  <span className="text-white font-bold">{repMensualidades?.resumen?.porcentaje_cobro || 0}%</span>
                </div>
              </div>
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

      {/* 7. TAB REPORTES CONSOLIDADOS (CON EXPORTACIÓN PDF Y CSV) */}
      {tab === 'reportes' && (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold font-theater text-white">
              Reportes Consolidados de Gestión (Exportación en PDF y CSV)
            </h2>
            <p className="text-xs text-slate-400">
              Información oficial para dirección, plantel docente y auditoría del teatro.
            </p>
          </div>

          {/* 1. Reporte de Ventas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <h3 className="font-theater text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-oro-400" /> 1. Reporte de Ventas de Boletería e Ingresos
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
                <Users className="w-5 h-5 text-oro-400" /> 2. Reporte de Ocupación y Asistencia de Sala
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

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Obra</th>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Emitidos</th>
                    <th className="p-3">Asistentes</th>
                    <th className="p-3">% Ocupación</th>
                    <th className="p-3 rounded-r-xl">% Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {repAsistencia.map((a) => (
                    <tr key={a.id_funcion} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">{a.titulo}</td>
                      <td className="p-3 text-slate-300">{String(a.fecha).slice(0, 10)} {a.hora_inicio}</td>
                      <td className="p-3">{a.total_emitidos} / {a.capacidad}</td>
                      <td className="p-3 text-emerald-400 font-bold">{a.asistentes}</td>
                      <td className="p-3 font-mono">{a.porcentaje_ocupacion}%</td>
                      <td className="p-3 font-mono font-bold text-oro-400">{a.porcentaje_asistencia}%</td>
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
                <GraduationCap className="w-5 h-5 text-oro-400" /> 3. Informe de Talleres: Asistencia, Evaluaciones, Culminación y Certificados
              </h3>
              <button
                onClick={() => exportarPDF('talleres')}
                className="py-1.5 px-3.5 bg-teatro-700 hover:bg-teatro-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <FileText className="w-3.5 h-3.5 text-oro-400" /> Exportar Informe en PDF
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Inscritos</span>
                <span className="text-xl font-bold text-white">{repTalleres?.resumen?.total_inscritos || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Promedio Asistencia</span>
                <span className="text-xl font-bold text-sky-400">{repTalleres?.resumen?.promedio_asistencia || 0}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Culminaron Taller</span>
                <span className="text-xl font-bold text-emerald-400">{repTalleres?.resumen?.total_culminaron || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Certificados Otorgados</span>
                <span className="text-xl font-bold text-oro-400">{repTalleres?.resumen?.total_certificados || 0}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Estudiante</th>
                    <th className="p-3">Taller</th>
                    <th className="p-3">Asistencia</th>
                    <th className="p-3">Nota / Crecimiento</th>
                    <th className="p-3">¿Culminó?</th>
                    <th className="p-3 rounded-r-xl">Certificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(repTalleres?.participantes || []).map((p) => (
                    <tr key={p.id_inscripcion} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-white">
                        {p.estudiante_apellidos}, {p.estudiante_nombres}
                      </td>
                      <td className="p-3 text-slate-300">{p.curso_nombre}</td>
                      <td className="p-3 font-mono text-sky-400">
                        {p.clases_asistidas}/{p.clases_totales} ({p.asistencia_porcentaje}%)
                      </td>
                      <td className="p-3">
                        <strong className="text-oro-400">{p.nota_final} pts</strong> • {p.nivel_crecimiento}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            p.culmino_taller
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {p.culmino_taller ? 'SÍ CULMINÓ' : 'En proceso'}
                        </span>
                      </td>
                      <td className="p-3">
                        {p.certificado_otorgado ? (
                          <button
                            type="button"
                            onClick={() => generarCertificadoPDF(p)}
                            className="py-1 px-2.5 bg-oro-500 hover:bg-oro-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1"
                          >
                            <Award className="w-3.5 h-3.5" /> Diploma PDF ({p.codigo_certificado})
                          </button>
                        ) : (
                          <span className="text-slate-500">No emitido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Reporte de Mensualidades */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <h3 className="font-theater text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-oro-400" /> 4. Reporte de Pagos y Mensualidades de Estudiantes
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
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Recaudado</span>
                <span className="text-xl font-bold text-emerald-400">Bs. {repMensualidades?.resumen?.total_recaudado || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Pendiente de Cobro</span>
                <span className="text-xl font-bold text-amber-400">Bs. {repMensualidades?.resumen?.total_pendiente || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Cuotas Pagadas</span>
                <span className="text-xl font-bold text-white">{repMensualidades?.resumen?.cuotas_pagadas || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Efectividad</span>
                <span className="text-xl font-bold text-oro-400">{repMensualidades?.resumen?.porcentaje_cobro || 0}%</span>
              </div>
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
