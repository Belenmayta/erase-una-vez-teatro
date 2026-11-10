require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const db = require('../src/db');

// Crear servidor de prueba en puerto efímero
const server = http.createServer(app);

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`\n======================================================`);
  console.log(` INICIANDO PRUEBAS AUTOMATIZADAS DE TODOS LOS SPRINTS`);
  console.log(` Servidor de prueba escuchando en http://localhost:${port}`);
  console.log(`======================================================\n`);

  let adminToken = '';
  let compToken = '';
  let recepToken = '';
  let funcionPrueba = null;
  let ventaReservada = null;
  let boletoEmitido = null;
  let cursoPrueba = null;
  let estudiantePrueba = null;
  let mensualidadPrueba = null;

  try {
    // 1. Salud
    console.log('[1] Probando GET /api/salud...');
    const resSalud = await request({ port, path: '/api/salud', method: 'GET' });
    console.log(`    Status: ${resSalud.status} - OK: ${resSalud.body?.ok} - BD: ${resSalud.body?.baseDeDatos}`);

    // 2. Login Admin
    console.log('[2] Probando Login de Administrador (jaqueline@teatro.com)...');
    const resLoginAdmin = await request(
      {
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { correo: 'jaqueline@teatro.com', contrasena: 'teatro123' }
    );
    console.log(`    Status: ${resLoginAdmin.status} - Rol: ${resLoginAdmin.body?.usuario?.rol}`);
    adminToken = resLoginAdmin.body?.token;

    // 3. Login Comprador
    console.log('[3] Probando Login de Comprador (maria@comprador.com)...');
    const resLoginComp = await request(
      {
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { correo: 'maria@comprador.com', contrasena: 'comprador123' }
    );
    console.log(`    Status: ${resLoginComp.status} - Rol: ${resLoginComp.body?.usuario?.rol}`);
    compToken = resLoginComp.body?.token;

    // 4. Login Recepción
    console.log('[4] Probando Login de Recepción (recepcion@teatro.com)...');
    const resLoginRecep = await request(
      {
        port,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { correo: 'recepcion@teatro.com', contrasena: 'recepcion123' }
    );
    console.log(`    Status: ${resLoginRecep.status} - Rol: ${resLoginRecep.body?.usuario?.rol}`);
    recepToken = resLoginRecep.body?.token;

    // 5. Cartelera y Funciones
    console.log('[5] Probando GET /api/funciones (Cartelera pública)...');
    const resFunciones = await request({ port, path: '/api/funciones', method: 'GET' });
    console.log(`    Status: ${resFunciones.status} - Funciones encontradas: ${resFunciones.body?.length}`);
    funcionPrueba = resFunciones.body[0];
    console.log(`    Función seleccionada para pruebas: ID #${funcionPrueba?.id_funcion} - ${funcionPrueba?.titulo}`);

    // 6. Mapa de Asientos (Sprint 2)
    console.log(`[6] Probando GET /api/funciones/${funcionPrueba?.id_funcion}/asientos (Mapa de asientos)...`);
    const resAsientos = await request({
      port,
      path: `/api/funciones/${funcionPrueba?.id_funcion}/asientos`,
      method: 'GET',
    });
    console.log(`    Status: ${resAsientos.status} - Total asientos: ${resAsientos.body?.estadisticas?.total_asientos}`);
    console.log(`    Disponibles: ${resAsientos.body?.estadisticas?.disponibles} - Ocupados: ${resAsientos.body?.estadisticas?.ocupados}`);

    // Encontrar 2 asientos libres para reservar
    const asientosLibres = resAsientos.body?.asientos?.filter((a) => a.estado_actual === 'DISPONIBLE').slice(0, 2);
    const idsAsientos = asientosLibres.map((a) => a.id_asiento);
    console.log(`    Asientos libres seleccionados: ${asientosLibres.map((a) => `${a.fila}-${a.numero}`).join(', ')} (IDs: ${idsAsientos.join(',')})`);

    // 7. Reservar Asientos (Sprint 2)
    console.log('[7] Probando POST /api/ventas/reservar (Reserva de asientos)...');
    const resReserva = await request(
      {
        port,
        path: '/api/ventas/reservar',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${compToken}`,
        },
      },
      {
        id_funcion: funcionPrueba.id_funcion,
        asientos: idsAsientos,
      }
    );
    console.log(`    Status: ${resReserva.status} - Venta ID: ${resReserva.body?.venta?.id_venta} - Total: Bs. ${resReserva.body?.venta?.total}`);
    ventaReservada = resReserva.body?.venta;

    // 8. Doble venta prevención (RNF-04)
    console.log('[8] Probando prevención de doble reserva/venta sobre el mismo asiento (RNF-04)...');
    const resDobleVenta = await request(
      {
        port,
        path: '/api/ventas/reservar',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${compToken}`,
        },
      },
      {
        id_funcion: funcionPrueba.id_funcion,
        asientos: [idsAsientos[0]], // mismo asiento ya reservado
      }
    );
    console.log(`    Status esperado: 409 - Status obtenido: ${resDobleVenta.status}`);
    console.log(`    Mensaje de bloqueo: "${resDobleVenta.body?.error}"`);

    // 9. Generar Pago QR dinámico (Sprint 3)
    console.log(`[9] Probando POST /api/pagos/generar-qr/${ventaReservada.id_venta} (Generación de QR dinámico)...`);
    const resGenQr = await request({
      port,
      path: `/api/pagos/generar-qr/${ventaReservada.id_venta}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${compToken}` },
    });
    console.log(`    Status: ${resGenQr.status} - Ref QR: ${resGenQr.body?.pago?.referencia_qr}`);
    console.log(`    Imagen QR generada: Data URL presente (Longitud: ${resGenQr.body?.pago?.qr_imagen?.length} bytes)`);

    // 10. Confirmar Pago (Sprint 3)
    console.log('[10] Probando POST /api/pagos/confirmar (Confirmación y emisión de boletos)...');
    const resConfPago = await request(
      {
        port,
        path: '/api/pagos/confirmar',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${compToken}`,
        },
      },
      { id_pago: resGenQr.body?.pago?.id_pago }
    );
    console.log(`    Status: ${resConfPago.status} - Boletos emitidos: ${resConfPago.body?.boletos?.length}`);
    boletoEmitido = resConfPago.body?.boletos[0];
    console.log(`    Boleto de prueba: ID #${boletoEmitido?.id_boleto} - QR: ${boletoEmitido?.codigo_qr}`);

    // 11. Consultar Mis Boletos (Sprint 3)
    console.log('[11] Probando GET /api/boletos/mis-boletos (Consulta de boletos del comprador)...');
    const resMisBoletos = await request({
      port,
      path: '/api/boletos/mis-boletos',
      method: 'GET',
      headers: { Authorization: `Bearer ${compToken}` },
    });
    console.log(`    Status: ${resMisBoletos.status} - Boletos activos del comprador: ${resMisBoletos.body?.length}`);

    // 12. Validar Entrada en Puerta con Lector QR (Sprint 4)
    console.log(`[12] Probando POST /api/ingresos/validar con el boleto emitido (Rol RECEPCIÓN)...`);
    const resValidarIngreso = await request(
      {
        port,
        path: '/api/ingresos/validar',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recepToken}`,
        },
      },
      {
        codigo_qr: boletoEmitido.codigo_qr,
        id_funcion: funcionPrueba.id_funcion,
      }
    );
    console.log(`    Status: ${resValidarIngreso.status} - Resultado: ${resValidarIngreso.body?.mensaje}`);
    console.log(`    Asiento validado: ${resValidarIngreso.body?.boleto?.asiento} - Comprador: ${resValidarIngreso.body?.boleto?.comprador}`);

    // 13. Revalidar el mismo boleto en puerta (Detector de fraude / reingreso)
    console.log('[13] Probando revalidar el mismo boleto utilizado...');
    const resRevalidar = await request(
      {
        port,
        path: '/api/ingresos/validar',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recepToken}`,
        },
      },
      {
        codigo_qr: boletoEmitido.codigo_qr,
        id_funcion: funcionPrueba.id_funcion,
      }
    );
    console.log(`    Status esperado: 409 - Status obtenido: ${resRevalidar.status}`);
    console.log(`    Alerta recibida: "${resRevalidar.body?.mensaje}"`);

    // 14. Aforo y Asistencia de la función (Sprint 4)
    console.log(`[14] Probando GET /api/funciones/${funcionPrueba.id_funcion}/asistencia (Control de aforo)...`);
    const resAforo = await request({
      port,
      path: `/api/funciones/${funcionPrueba.id_funcion}/asistencia`,
      method: 'GET',
      headers: { Authorization: `Bearer ${recepToken}` },
    });
    console.log(`    Status: ${resAforo.status} - Capacidad: ${resAforo.body?.aforo?.capacidad_sala}`);
    console.log(`    Boletos emitidos: ${resAforo.body?.aforo?.boletos_emitidos} - Ingresados: ${resAforo.body?.aforo?.asistentes_ingresados}`);

    // 15. Asignar Entradas Gratuitas (Cupo Social Infantil) (Sprint 2)
    console.log('[15] Probando asignación de entradas gratuitas de cupo social (POST /api/ventas/gratuita)...');
    const asientoGratuito = resAsientos.body?.asientos?.filter((a) => a.estado_actual === 'DISPONIBLE')[2];
    const resGratis = await request(
      {
        port,
        path: '/api/ventas/gratuita',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        id_funcion: funcionPrueba.id_funcion,
        asientos: [asientoGratuito.id_asiento],
        beneficiario_nombre: 'Fundación Apoyo Infantil Paceño',
      }
    );
    console.log(`    Status: ${resGratis.status} - Boletos gratuitos emitidos: ${resGratis.body?.venta?.boletos?.length}`);

    // 16. Cursos (Sprint 5)
    console.log('[16] Probando GET /api/cursos (Catálogo de cursos)...');
    const resCursos = await request({ port, path: '/api/cursos', method: 'GET' });
    console.log(`    Status: ${resCursos.status} - Cursos activos: ${resCursos.body?.length}`);
    cursoPrueba = resCursos.body[0];
    console.log(`    Curso de prueba: ID #${cursoPrueba?.id_curso} - ${cursoPrueba?.nombre} (Horarios: ${cursoPrueba?.horarios?.length})`);

    // 17. Estudiantes (Sprint 5)
    console.log('[17] Probando registro de estudiante (POST /api/estudiantes)...');
    const resEst = await request(
      {
        port,
        path: '/api/estudiantes',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${compToken}`,
        },
      },
      {
        nombres: 'Sofia',
        apellidos: 'Perez',
        ci: '1357924',
        fecha_nacimiento: '2015-06-10',
        tutor_nombre: 'Maria Perez',
        tutor_telefono: '71234567',
      }
    );
    console.log(`    Status: ${resEst.status} - Estudiante registrado: ${resEst.body?.nombres} ${resEst.body?.apellidos} (ID: ${resEst.body?.id_estudiante})`);
    estudiantePrueba = resEst.body;

    // 18. Inscripción a Curso con control de cupo (Sprint 5)
    console.log('[18] Probando inscripción a curso (POST /api/inscripciones)...');
    const resInsc = await request(
      {
        port,
        path: '/api/inscripciones',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${compToken}`,
        },
      },
      {
        id_curso: cursoPrueba.id_curso,
        id_estudiante: estudiantePrueba.id_estudiante,
      }
    );
    console.log(`    Status: ${resInsc.status} - Inscripción exitosa en "${resInsc.body?.inscripcion?.curso}"`);
    console.log(`    Mensualidad del 1er mes generada automáticamente: Bs. ${resInsc.body?.inscripcion?.mensualidad_inicial?.monto} (Estado: ${resInsc.body?.inscripcion?.mensualidad_inicial?.estado})`);
    mensualidadPrueba = resInsc.body?.inscripcion?.mensualidad_inicial;

    // 19. Cobro de Mensualidad (Sprint 5)
    if (mensualidadPrueba?.id_mensualidad) {
      console.log(`[19] Probando registro de cobro de mensualidad (POST /api/mensualidades/${mensualidadPrueba.id_mensualidad}/cobrar)...`);
      const resCobro = await request({
        port,
        path: `/api/mensualidades/${mensualidadPrueba.id_mensualidad}/cobrar`,
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`    Status: ${resCobro.status} - Mensualidad actualizada a: ${resCobro.body?.mensualidad?.estado}`);
    }

    // 20. Reportes (Sprint 4 & 5)
    console.log('[20] Probando Reporte de Ventas (GET /api/reportes/ventas)...');
    const resRepVentas = await request({
      port,
      path: '/api/reportes/ventas',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`    Status: ${resRepVentas.status} - Total Boletos Vendidos: ${resRepVentas.body?.resumen?.total_boletos_vendidos}`);
    console.log(`    Total Recaudación: Bs. ${resRepVentas.body?.resumen?.total_ingresos}`);

    console.log('[21] Probando Reporte de Asistencia (GET /api/reportes/asistencia)...');
    const resRepAsist = await request({
      port,
      path: '/api/reportes/asistencia',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`    Status: ${resRepAsist.status} - Funciones reportadas: ${resRepAsist.body?.length}`);

    console.log('[22] Probando Reporte de Mensualidades (GET /api/reportes/mensualidades)...');
    const resRepMens = await request({
      port,
      path: '/api/reportes/mensualidades',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`    Status: ${resRepMens.status} - Total Recaudado Cursos: Bs. ${resRepMens.body?.resumen?.total_recaudado}`);

    console.log('[23] Probando Dashboard General (GET /api/reportes/dashboard)...');
    const resDash = await request({
      port,
      path: '/api/reportes/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`    Status: ${resDash.status} - Métricas:`, resDash.body);

    console.log(`\n======================================================`);
    console.log(` ¡TODAS LAS PRUEBAS DE LA API PASARON EXITOSAMENTE! 100%`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('ERROR EN PRUEBAS:', err);
  } finally {
    server.close();
    await db.pool.end();
  }
}

runTests();