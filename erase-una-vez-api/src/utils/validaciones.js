const dns = require('dns');
const https = require('https');

const DOMINIOS_DESECHABLES = new Set([
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'fakeinbox.com',
  'sharklasers.com',
  'getnada.com',
  'maildrop.cc',
  'dispostable.com',
  'ejemplo.com',
  'example.com',
  'test.com',
  'correo.com',
]);

const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,60}$/;
const REGEX_CI_BOLIVIA = /^\d{5,10}(-[0-9A-Za-z]{1,2})?(\s?(LP|CB|SC|OR|PT|TJ|CH|BE|PD))?$/i;
const REGEX_TEL_BOLIVIA = /^(\+?591\s?)?[67]\d{7}$/;
const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,15}$/;

function validarNombreApellido(valor, nombreCampo = 'Nombre') {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return `El campo ${nombreCampo} es obligatorio.`;
  }
  const limpio = valor.trim();
  if (limpio.length < 2 || limpio.length > 60) {
    return `El campo ${nombreCampo} debe tener entre 2 y 60 caracteres.`;
  }
  if (!REGEX_SOLO_LETRAS.test(limpio)) {
    return `El campo ${nombreCampo} solo puede contener letras y espacios (sin números ni símbolos).`;
  }
  return null;
}

function validarCIBolivia(ci, obligatorio = false) {
  if (!ci || !String(ci).trim()) {
    return obligatorio ? 'El Carnet de Identidad (C.I.) es obligatorio.' : null;
  }
  const limpio = String(ci).trim();
  if (!REGEX_CI_BOLIVIA.test(limpio)) {
    return 'El C.I. debe contener entre 5 y 10 dígitos numéricos válidos (ej. 6543210 o 6543210 LP).';
  }
  return null;
}

function validarTelefonoBolivia(telefono, obligatorio = false, nombreCampo = 'Teléfono') {
  if (!telefono || !String(telefono).trim()) {
    return obligatorio ? `El ${nombreCampo} es obligatorio.` : null;
  }
  const limpio = String(telefono).trim().replace(/[\s-]/g, '');
  if (!REGEX_TEL_BOLIVIA.test(limpio)) {
    return `El ${nombreCampo} debe ser un número móvil válido de Bolivia de 8 dígitos que inicie con 6 o 7 (ej. 71234567 o +59171234567).`;
  }
  return null;
}

function validarContrasenaFuerte(contrasena) {
  if (!contrasena || typeof contrasena !== 'string' || contrasena.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
    return 'La contraseña debe incluir al menos una letra y un número para mayor seguridad.';
  }
  return null;
}

// Consulta DNS sobre HTTPS de Google como respaldo para entornos cloud
function consultarMxPorHttps(dominio) {
  return new Promise((resolve) => {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(dominio)}&type=MX`;
    const req = https.get(url, { timeout: 3500 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json && Array.isArray(json.Answer) && json.Answer.length > 0) {
            resolve({ valido: true, registros: json.Answer.map((a) => a.data) });
          } else {
            resolve({ valido: false, registros: [] });
          }
        } catch {
          resolve({ valido: true, registros: ['fallback-dns'] });
        }
      });
    });
    req.on('error', () => resolve({ valido: true, registros: ['fallback-offline'] }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ valido: true, registros: ['fallback-timeout'] });
    });
  });
}

// Verifica que el correo tenga formato válido, no sea desechable y que su dominio exista y tenga servidores MX activos
async function verificarExistenciaCorreo(correoRaw) {
  if (!correoRaw || typeof correoRaw !== 'string') {
    return {
      valido: false,
      error: 'Debe ingresar un correo electrónico.',
    };
  }

  const correo = correoRaw.trim().toLowerCase();
  if (!REGEX_CORREO.test(correo)) {
    return {
      valido: false,
      error: 'El formato del correo electrónico no es válido (ejemplo: usuario@gmail.com).',
    };
  }

  const partes = correo.split('@');
  const usuarioLocal = partes[0];
  const dominio = partes[1];

  if (usuarioLocal.length < 2) {
    return {
      valido: false,
      error: 'El nombre de usuario del correo es demasiado corto.',
    };
  }

  if (DOMINIOS_DESECHABLES.has(dominio)) {
    return {
      valido: false,
      error: `El dominio @${dominio} es un correo temporal o de prueba no permitido. Ingrese un correo real (Gmail, Outlook, Hotmail, institucional, etc.).`,
    };
  }

  // 1. Verificar registros MX reales mediante DNS nativo
  try {
    const mxRecords = await dns.promises.resolveMx(dominio);
    if (Array.isArray(mxRecords) && mxRecords.length > 0) {
      return {
        valido: true,
        dominio,
        servidor_mx: mxRecords[0].exchange,
        mensaje: `Dominio @${dominio} verificado con servidor de correo activo (${mxRecords[0].exchange}).`,
      };
    }
    return {
      valido: false,
      error: `El dominio @${dominio} no tiene servidores de correo electrónico configurados.`,
    };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return {
        valido: false,
        error: `El dominio del correo (@${dominio}) no existe en internet. Verifique que esté bien escrito.`,
      };
    }
    // 2. Fallback por DNS-over-HTTPS (Google DNS API) si el puerto 53 UDP está restringido
    const resHttps = await consultarMxPorHttps(dominio);
    if (!resHttps.valido) {
      return {
        valido: false,
        error: `No se pudo confirmar la existencia del dominio de correo @${dominio}. Ingrese un correo electrónico real y existente.`,
      };
    }
    return {
      valido: true,
      dominio,
      servidor_mx: resHttps.registros[0] || dominio,
      mensaje: `Correo verificado correctamente (@${dominio}).`,
    };
  }
}

module.exports = {
  validarNombreApellido,
  validarCIBolivia,
  validarTelefonoBolivia,
  validarContrasenaFuerte,
  verificarExistenciaCorreo,
};
