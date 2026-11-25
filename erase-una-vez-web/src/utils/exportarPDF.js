// Utilidad para generar Reportes Institucionales y Certificados en PDF listos para imprimir o guardar

export function generarReportePDF({
  titulo = 'Reporte Institucional',
  subtitulo = 'Sistema de Gestión Cultural y Académica',
  rangoFecha = '',
  kpis = [],
  graficos = null,
  columnas = [],
  filas = [],
}) {
  const fechaEmision = new Date().toLocaleString('es-BO', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const kpisHtml =
    kpis.length > 0
      ? `<div class="kpis">
          ${kpis
            .map(
              (k) => `
            <div class="kpi-card">
              <div class="kpi-label">${k.etiqueta}</div>
              <div class="kpi-val">${k.valor}</div>
            </div>`
            )
            .join('')}
        </div>`
      : '';

  const graficosHtml = graficos
    ? `<div class="charts-grid">
        ${
          graficos.torta
            ? `<div class="chart-card">
                <div class="chart-title">📊 ${graficos.torta.titulo}</div>
                <div class="pie-wrap">
                  <div class="pie-circle" style="background: conic-gradient(${graficos.torta.gradiente});"></div>
                  <div class="pie-legend">
                    ${graficos.torta.items
                      .map(
                        (it) => `
                      <div class="leg-item">
                        <span class="leg-dot" style="background:${it.color};"></span>
                        <span><strong>${it.etiqueta}:</strong> ${it.valorTexto} (${it.porcentaje}%)</span>
                      </div>`
                      )
                      .join('')}
                  </div>
                </div>
              </div>`
            : ''
        }
        ${
          graficos.barras
            ? `<div class="chart-card">
                <div class="chart-title">📈 ${graficos.barras.titulo}</div>
                <div class="bars-wrap">
                  ${graficos.barras.items
                    .map(
                      (b) => `
                    <div class="bar-row">
                      <div class="bar-head">
                        <span><strong>${b.etiqueta}</strong></span>
                        <span>${b.valorTexto} (${b.porcentaje}%)</span>
                      </div>
                      <div class="bar-track">
                        <div class="bar-fill" style="width:${Math.max(4, b.porcentaje)}%; background:${b.color};"></div>
                      </div>
                    </div>`
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }
      </div>`
    : '';

  const theadHtml = columnas.map((c) => `<th>${c}</th>`).join('');
  const tbodyHtml =
    filas.length > 0
      ? filas
          .map(
            (fila) =>
              `<tr>${fila
                .map((celda) => `<td>${celda !== null && celda !== undefined ? celda : '-'}</td>`)
                .join('')}</tr>`
          )
          .join('')
      : `<tr><td colspan="${columnas.length}" style="text-align:center; padding: 20px;">Sin registros para mostrar</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${titulo} - Compañía de Teatro Érase una Vez</title>
  <style>
    @page { size: A4 landscape; margin: 14mm; }
    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { color: #1e293b; margin: 0; padding: 0; background: #fff; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #be123c;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #881337;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin: 3px 0 0 0;
    }
    .report-meta {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .doc-sub {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 16px 0;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-left: 4px solid #d97706;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }
    .kpi-val {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 3px;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }
    .chart-card {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      background: #f8fafc;
    }
    .chart-title {
      font-size: 12px;
      font-weight: 800;
      color: #472F5B;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .pie-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .pie-circle {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pie-legend {
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .leg-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .leg-dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      display: inline-block;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .bars-wrap {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .bar-row {
      font-size: 11px;
    }
    .bar-head {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .bar-track {
      height: 11px;
      background: #e2e8f0;
      border-radius: 99px;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .bar-fill {
      height: 100%;
      border-radius: 99px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #881337;
      color: #ffffff;
      text-align: left;
      padding: 8px 10px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .signatures {
      margin-top: 42px;
      display: flex;
      justify-content: space-around;
      font-size: 11px;
      color: #334155;
    }
    .sig-box {
      text-align: center;
      width: 220px;
      border-top: 1px solid #475569;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">🎭 COMPAÑÍA DE TEATRO "ÉRASE UNA VEZ"</h1>
      <p class="brand-sub">Sede Sopocachi • Av. 20 de Octubre, Edif. Agustín Aspiazu • La Paz, Bolivia</p>
    </div>
    <div class="report-meta">
      <div><strong>Fecha de emisión:</strong> ${fechaEmision}</div>
      ${rangoFecha ? `<div><strong>Período / Rango:</strong> ${rangoFecha}</div>` : ''}
      <div><strong>Documento:</strong> Oficial / Auditoría</div>
    </div>
  </div>

  <h2 class="doc-title">${titulo}</h2>
  <p class="doc-sub">${subtitulo}</p>

  ${kpisHtml}
  ${graficosHtml}

  <table>
    <thead>
      <tr>${theadHtml}</tr>
    </thead>
    <tbody>
      ${tbodyHtml}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <strong>Dirección General</strong><br/>
      Compañía de Teatro "Érase una Vez"
    </div>
    <div class="sig-box">
      <strong>Coordinación Académica / Administración</strong><br/>
      Control y Seguimiento
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=1050,height=750');
  if (ventana) {
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  }
}

export function generarCertificadoPDF(inscripcion) {
  const nombreCompleto = `${inscripcion.estudiante_nombres || ''} ${
    inscripcion.estudiante_apellidos || ''
  }`.trim();
  const taller = inscripcion.curso_nombre || 'Taller de Formación Artística';
  const fechaCert = inscripcion.fecha_certificado
    ? String(inscripcion.fecha_certificado).slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const codigo =
    inscripcion.codigo_certificado ||
    `EUV-CERT-${new Date().getFullYear()}-${String(inscripcion.id_inscripcion || 1).padStart(4, '0')}`;
  const asistencia = inscripcion.asistencia_porcentaje || 100;
  const nota = inscripcion.nota_final || 95;
  const nivel = inscripcion.nivel_crecimiento || 'DESTACADO';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Certificado - ${nombreCompleto}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: Georgia, 'Times New Roman', serif;
      color: #1e293b;
    }
    .marco-exterior {
      border: 6px double #881337;
      padding: 12px;
      height: 186mm;
      position: relative;
      background: linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fff1f2 100%);
    }
    .marco-interior {
      border: 2px solid #d97706;
      height: 100%;
      padding: 28px 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }
    .institucion {
      font-size: 15px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #881337;
      font-weight: bold;
    }
    .titulo-cert {
      font-size: 38px;
      font-weight: bold;
      color: #0f172a;
      margin: 8px 0 4px;
      letter-spacing: 2px;
    }
    .subtitulo-cert {
      font-size: 14px;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 14px;
    }
    .otorga {
      font-size: 15px;
      color: #475569;
      font-style: italic;
    }
    .nombre-alumno {
      font-size: 34px;
      font-weight: bold;
      color: #881337;
      border-bottom: 2px solid #d97706;
      display: inline-block;
      margin: 10px auto;
      padding: 0 30px 6px;
    }
    .cuerpo {
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
      max-width: 760px;
      margin: 0 auto;
    }
    .metricas {
      margin: 14px auto;
      display: flex;
      justify-content: center;
      gap: 30px;
      font-size: 13px;
      color: #0f172a;
      font-family: 'Segoe UI', sans-serif;
    }
    .firmas {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      margin-top: 24px;
      font-family: 'Segoe UI', sans-serif;
      font-size: 12px;
    }
    .firma-box {
      width: 230px;
      border-top: 1px solid #334155;
      padding-top: 6px;
    }
    .codigo {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="marco-exterior">
    <div class="marco-interior">
      <div>
        <div class="institucion">🎭 Compañía de Teatro "Érase una Vez" • La Paz, Bolivia</div>
        <div class="titulo-cert">CERTIFICADO DE CULMINACIÓN</div>
        <div class="subtitulo-cert">Formación Artística y Escénica</div>
      </div>

      <div>
        <div class="otorga">Se confiere el presente certificado a:</div>
        <div class="nombre-alumno">${nombreCompleto}</div>
        <p class="cuerpo">
          Por haber culminado satisfactoriamente el taller de formación artística
          <strong>"${taller}"</strong>, demostrando compromiso, sensibilidad escénica,
          expresión corporal y crecimiento artístico en nuestra Sala de Ensayos de Sopocachi.
        </p>
        <div class="metricas">
          <span><strong>Asistencia:</strong> ${asistencia}%</span>
          <span>•</span>
          <span><strong>Evaluación Final:</strong> ${nota} / 100 pts</span>
          <span>•</span>
          <span><strong>Nivel Alcanzado:</strong> ${nivel}</span>
        </div>
      </div>

      <div>
        <div class="firmas">
          <div class="firma-box">
            <strong>Dirección General</strong><br/>
            Compañía de Teatro "Érase una Vez"
          </div>
          <div class="codigo">
            Código de Registro: <strong>${codigo}</strong><br/>
            La Paz, ${fechaCert}
          </div>
          <div class="firma-box">
            <strong>Plantel Docente</strong><br/>
            Área de Formación Artística
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=1050,height=750');
  if (ventana) {
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  }
}
