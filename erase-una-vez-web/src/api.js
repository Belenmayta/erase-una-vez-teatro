// Cliente API para el Sistema Web de Érase una Vez
const API_URL = import.meta.env.VITE_API_URL || '/api';

function obtenerToken() {
  return localStorage.getItem('token_teatro');
}

export function guardarSesion(token, usuario) {
  localStorage.setItem('token_teatro', token);
  localStorage.setItem('usuario_teatro', JSON.stringify(usuario));
}

export function eliminarSesion() {
  localStorage.removeItem('token_teatro');
  localStorage.removeItem('usuario_teatro');
}

export function obtenerUsuarioLocal() {
  try {
    const raw = localStorage.getItem('usuario_teatro');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const token = obtenerToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Lectura segura de la respuesta (maneja JSON o texto plano si el servidor falla)
  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    data = text ? { error: text } : null;
  }

  if (!response.ok) {
    const errorMsg = 
      data?.error || 
      data?.mensaje || 
      `Error ${response.status}: ${response.statusText || 'Ocurrió un error en la solicitud'}`;
      
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Salud
  verificarSalud: () => request('/salud'),

  // Autenticación, MFA y Verificación de Correo Real (DNS MX)
  login: (correo, contrasena) => request('/auth/login', { method: 'POST', body: { correo, contrasena } }),
  verificarMfa: (mfa_token, codigo_mfa) =>
    request('/auth/verificar-mfa', { method: 'POST', body: { mfa_token, codigo_mfa } }),
  verificarCorreo: (correo, verificar_duplicado = false) =>
    request('/auth/verificar-correo', { method: 'POST', body: { correo, verificar_duplicado } }),
  solicitarCodigoRegistro: (datos) =>
    request('/auth/solicitar-codigo-registro', { method: 'POST', body: datos }),
  registro: (datos) => request('/auth/register', { method: 'POST', body: datos }),
  obtenerPerfil: () => request('/auth/me'),

  // Obras y Cartelera
  obtenerObras: () => request('/obras'),
  obtenerObra: (id) => request(`/obras/${id}`),
  crearObra: (datos) => request('/obras', { method: 'POST', body: datos }),
  editarObra: (id, datos) => request(`/obras/${id}`, { method: 'PUT', body: datos }),
  eliminarObra: (id) => request(`/obras/${id}`, { method: 'DELETE' }),

  obtenerFunciones: (todas = false) => request(`/funciones${todas ? '?todas=true' : ''}`),
  obtenerFuncion: (id) => request(`/funciones/${id}`),
  crearFuncion: (datos) => request('/funciones', { method: 'POST', body: datos }),
  editarFuncion: (id, datos) => request(`/funciones/${id}`, { method: 'PUT', body: datos }),
  cancelarFuncion: (id) => request(`/funciones/${id}`, { method: 'DELETE' }),
obtenerAsientosFuncion: (idOObjeto) => {
    // Si viene un objeto entero de la función/presentación
    let id = idOObjeto;
    if (typeof idOObjeto === 'object' && idOObjeto !== null) {
      id = idOObjeto.id_presentacion || idOObjeto.id_funcion || idOObjeto.id;
    }

    // Si aún así sigue siendo undefined, evitamos mandar un 'undefined' en la URL
    if (!id || id === 'undefined') {
      console.error("⚠️ Error: Se intentó cargar asientos con un ID no válido:", idOObjeto);
      throw new Error("ID de función/presentación no válido");
    }

    return request(`/funciones/${id}/asientos`);
  },
  obtenerAsistenciaFuncion: (id) => request(`/funciones/${id}/asistencia`),

  // Salas
  obtenerSalas: () => request('/salas'),

  // Ventas y Asientos (Sprint 2)
  reservarAsientos: (id_funcion, asientos) =>
    request('/ventas/reservar', { method: 'POST', body: { id_funcion, asientos } }),
  asignarGratuitas: (datos) => request('/ventas/gratuita', { method: 'POST', body: datos }),
  misCompras: () => request('/ventas/mis-compras'),
  obtenerVentas: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return request(`/ventas${params ? `?${params}` : ''}`);
  },
  obtenerVenta: (id) => request(`/ventas/${id}`),
  anularVenta: (id) => request(`/ventas/${id}/anular`, { method: 'POST' }),
  desbloquearReserva: (id_funcion, id_venta = null) =>
    request('/ventas/desbloquear-reserva', { method: 'POST', body: { id_funcion, id_venta } }),

  // Pagos QR y Boletos (Sprint 3)
  generarPagoQR: (idVenta) => request(`/pagos/generar-qr/${idVenta}`, { method: 'POST' }),
  confirmarPago: (datos) => request('/pagos/confirmar', { method: 'POST', body: datos }),
  misBoletos: () => request('/boletos/mis-boletos'),
  obtenerBoleto: (id) => request(`/boletos/${id}`),

  // Validación de Entrada en Puerta (Sprint 4)
  validarIngresoQR: (codigo_qr, id_funcion) =>
    request('/ingresos/validar', { method: 'POST', body: { codigo_qr, id_funcion } }),
  historialIngresos: (idFuncion) => request(`/ingresos/funcion/${idFuncion}`),

  // Cursos, Estudiantes y Mensualidades (Sprint 5)
  obtenerCursos: (todos = false) => request(`/cursos${todos ? '?todos=true' : ''}`),
  obtenerCurso: (id) => request(`/cursos/${id}`),
  crearCurso: (datos) => request('/cursos', { method: 'POST', body: datos }),
  editarCurso: (id, datos) => request(`/cursos/${id}`, { method: 'PUT', body: datos }),
  eliminarCurso: (id) => request(`/cursos/${id}`, { method: 'DELETE' }),

  obtenerEstudiantes: () => request('/estudiantes'),
  obtenerEstudiante: (id) => request(`/estudiantes/${id}`),
  crearEstudiante: (datos) => request('/estudiantes', { method: 'POST', body: datos }),
  editarEstudiante: (id, datos) => request(`/estudiantes/${id}`, { method: 'PUT', body: datos }),
  eliminarEstudiante: (id) => request(`/estudiantes/${id}`, { method: 'DELETE' }),

  inscribirEstudiante: (id_curso, id_estudiante) =>
    request('/inscripciones', { method: 'POST', body: { id_curso, id_estudiante } }),
  desinscribirTaller: (id) =>
    request(`/inscripciones/${id}/desinscribir`, { method: 'POST' }),
  obtenerInscripciones: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return request(`/inscripciones${params ? `?${params}` : ''}`);
  },
  actualizarSeguimientoInscripcion: (id, datos) =>
    request(`/inscripciones/${id}/seguimiento`, { method: 'PUT', body: datos }),
  registrarAsistenciaRapida: (id, delta = 1) =>
    request(`/inscripciones/${id}/asistencia-rapida`, { method: 'POST', body: { delta } }),
  cambiarEstadoInscripcion: (id, estado) =>
    request(`/inscripciones/${id}/estado`, { method: 'PATCH', body: { estado } }),

  obtenerMensualidades: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return request(`/mensualidades${params ? `?${params}` : ''}`);
  },
  cobrarMensualidad: (id, datos = {}) =>
    request(`/mensualidades/${id}/cobrar`, { method: 'POST', body: datos }),
  enviarRecordatorioCorreo: (id) =>
    request(`/mensualidades/${id}/recordatorio-correo`, { method: 'POST' }),
  enviarRecordatorioMasivo: () =>
    request('/mensualidades/recordatorio-masivo', { method: 'POST' }),
  generarPeriodoMensualidades: (mes, anio, id_curso) =>
    request('/mensualidades/generar-periodo', { method: 'POST', body: { mes, anio, id_curso } }),

  // Usuarios (Admin)
  obtenerUsuarios: () => request('/usuarios'),
  crearUsuario: (datos) => request('/usuarios', { method: 'POST', body: datos }),
  actualizarUsuario: (id, datos) => request(`/usuarios/${id}`, { method: 'PATCH', body: datos }),
  eliminarUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  // Reportes y Dashboard (Sprint 4 y 5)
  obtenerDashboard: () => request('/reportes/dashboard'),
  reporteVentas: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return request(`/reportes/ventas${params ? `?${params}` : ''}`);
  },
  reporteAsistencia: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return request(`/reportes/asistencia${params ? `?${params}` : ''}`);
  },
  reporteMensualidades: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return request(`/reportes/mensualidades${params ? `?${params}` : ''}`);
  },
  reporteTalleres: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return request(`/reportes/talleres${params ? `?${params}` : ''}`);
  },
};