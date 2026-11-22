const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { verificarToken } = require('../middleware/auth');
const {
  validarNombreApellido,
  validarCIBolivia,
  validarTelefonoBolivia,
  validarContrasenaFuerte,
  verificarExistenciaCorreo,
} = require('../utils/validaciones');

const router = express.Router();

function firmarToken(u) {
  return jwt.sign({ id: u.id_usuario, rol: u.rol }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '8h',
  });
}

function generarCodigo6Digitos() {
  return String(crypto.randomInt(100000, 999999));
}

// 1. API para verificar en tiempo real que un correo electrónico existe (DNS MX / Servidor activo)
router.post('/verificar-correo', async (req, res, next) => {
  try {
    const { correo, verificar_duplicado } = req.body;
    const resultado = await verificarExistenciaCorreo(correo);
    if (!resultado.valido) {
      return res.status(400).json({ valido: false, error: resultado.error });
    }

    if (verificar_duplicado) {
      const { rows } = await db.query(
        'SELECT id_usuario FROM usuario WHERE correo = lower($1)',
        [correo.trim()]
      );
      if (rows[0]) {
        return res.status(409).json({
          valido: false,
          error: 'Este correo electrónico ya se encuentra registrado en el sistema.',
        });
      }
    }

    res.json({
      valido: true,
      dominio: resultado.dominio,
      servidor_mx: resultado.servidor_mx,
      mensaje: resultado.mensaje,
    });
  } catch (e) {
    next(e);
  }
});

// 2. Solicitar código de verificación (Paso 1 antes de crear cuenta)
router.post('/solicitar-codigo-registro', async (req, res, next) => {
  try {
    const { nombres, apellidos, ci, correo, telefono, contrasena } = req.body;

    const errNom = validarNombreApellido(nombres, 'Nombres');
    if (errNom) return res.status(400).json({ error: errNom });

    const errApe = validarNombreApellido(apellidos, 'Apellidos');
    if (errApe) return res.status(400).json({ error: errApe });

    const errCi = validarCIBolivia(ci, true);
    if (errCi) return res.status(400).json({ error: errCi });

    const errTel = validarTelefonoBolivia(telefono, true, 'Teléfono / WhatsApp');
    if (errTel) return res.status(400).json({ error: errTel });

    const errPass = validarContrasenaFuerte(contrasena);
    if (errPass) return res.status(400).json({ error: errPass });

    const verifCorreo = await verificarExistenciaCorreo(correo);
    if (!verifCorreo.valido) {
      return res.status(400).json({ error: verifCorreo.error });
    }

    const { rows: existente } = await db.query(
      'SELECT id_usuario FROM usuario WHERE correo = lower($1)',
      [correo.trim()]
    );
    if (existente[0]) {
      return res.status(409).json({ error: 'Ese correo electrónico ya está registrado.' });
    }

    const codigo = generarCodigo6Digitos();
    const hashCodigo = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(`${correo.trim().toLowerCase()}:${codigo}`)
      .digest('hex');

    const tokenVerificacion = jwt.sign(
      {
        correo: correo.trim().toLowerCase(),
        hashCodigo,
        tipo: 'REGISTRO_OTP',
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({
      ok: true,
      requiere_verificacion: true,
      token_verificacion: tokenVerificacion,
      codigo_verificacion: codigo,
      servidor_mx: verifCorreo.servidor_mx,
      mensaje: `Correo verificado (@${verifCorreo.dominio} • MX: ${verifCorreo.servidor_mx}). Ingrese el código de verificación de 6 dígitos para confirmar la creación de su cuenta.`,
    });
  } catch (e) {
    next(e);
  }
});

// 3. Registrar comprador (Paso 2: confirma código de verificación y crea el usuario)
router.post('/register', async (req, res, next) => {
  try {
    const {
      nombres,
      apellidos,
      ci,
      correo,
      telefono,
      contrasena,
      codigo_verificacion,
      token_verificacion,
    } = req.body;

    const errNom = validarNombreApellido(nombres, 'Nombres');
    if (errNom) return res.status(400).json({ error: errNom });

    const errApe = validarNombreApellido(apellidos, 'Apellidos');
    if (errApe) return res.status(400).json({ error: errApe });

    const errCi = validarCIBolivia(ci, true);
    if (errCi) return res.status(400).json({ error: errCi });

    const errTel = validarTelefonoBolivia(telefono, true, 'Teléfono / WhatsApp');
    if (errTel) return res.status(400).json({ error: errTel });

    const errPass = validarContrasenaFuerte(contrasena);
    if (errPass) return res.status(400).json({ error: errPass });

    const verifCorreo = await verificarExistenciaCorreo(correo);
    if (!verifCorreo.valido) {
      return res.status(400).json({ error: verifCorreo.error });
    }

    // Validar el paso de verificación de código OTP
    if (!token_verificacion || !codigo_verificacion) {
      return res.status(400).json({
        error: 'Debe completar el paso de verificación del código de 6 dígitos antes de crear la cuenta.',
      });
    }

    let payloadOtp;
    try {
      payloadOtp = jwt.verify(token_verificacion, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({
        error: 'El código de verificación ha expirado. Solicite un nuevo código.',
      });
    }

    const hashEsperado = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(`${correo.trim().toLowerCase()}:${String(codigo_verificacion).trim()}`)
      .digest('hex');

    if (
      payloadOtp.tipo !== 'REGISTRO_OTP' ||
      payloadOtp.correo !== correo.trim().toLowerCase() ||
      payloadOtp.hashCodigo !== hashEsperado
    ) {
      return res.status(400).json({
        error: 'El código de verificación ingresado es incorrecto.',
      });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const { rows } = await db.query(
      `INSERT INTO usuario (id_rol, nombres, apellidos, ci, correo, telefono, contrasena_hash)
       VALUES ((SELECT id_rol FROM rol WHERE nombre = 'COMPRADOR'), $1, $2, $3, lower($4), $5, $6)
       RETURNING id_usuario, nombres, apellidos, correo`,
      [nombres.trim(), apellidos.trim(), ci.trim(), correo.trim(), telefono.trim(), hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese correo ya está registrado' });
    if (e.code === '23502') {
      return res.status(500).json({ error: 'Faltan los roles iniciales en la base de datos (tabla rol)' });
    }
    next(e);
  }
});

// 4. Autenticar usuario (Paso 1: credenciales + desafío MFA)
router.post('/login', async (req, res, next) => {
  try {
    const { correo, contrasena, omitir_mfa } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Ingrese su correo electrónico y su contraseña' });
    }
    const { rows } = await db.query(
      `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.contrasena_hash, u.estado, r.nombre AS rol
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.correo = lower($1)`,
      [correo.trim()]
    );
    const u = rows[0];
    const ok = u && u.estado && (await bcrypt.compare(contrasena, u.contrasena_hash));
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    // Para ADMINISTRADOR, DOCENTE y RECEPCION (o cuando MFA está activo), exigir segundo factor MFA
    const esRolCritico = ['ADMINISTRADOR', 'DOCENTE', 'RECEPCION'].includes(u.rol);
    if (esRolCritico || !omitir_mfa) {
      const codigoMfa = generarCodigo6Digitos();
      const hashMfa = crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(`${u.id_usuario}:${codigoMfa}`)
        .digest('hex');

      const mfaToken = jwt.sign(
        {
          id_usuario: u.id_usuario,
          rol: u.rol,
          hashMfa,
          tipo: 'MFA_LOGIN',
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.json({
        requiere_mfa: true,
        mfa_token: mfaToken,
        codigo_mfa: codigoMfa,
        usuario_parcial: {
          nombres: u.nombres,
          apellidos: u.apellidos,
          correo: u.correo,
          rol: u.rol,
        },
        mensaje: `Verificación MFA en 2 pasos requerida para ${u.correo} (${u.rol}). Ingrese el código de seguridad de 6 dígitos.`,
      });
    }

    res.json({
      token: firmarToken(u),
      usuario: {
        id: u.id_usuario,
        nombres: u.nombres,
        apellidos: u.apellidos,
        correo: u.correo,
        rol: u.rol,
      },
    });
  } catch (e) {
    next(e);
  }
});

// 5. Verificar código MFA (Paso 2 de inicio de sesión seguro)
router.post('/verificar-mfa', async (req, res, next) => {
  try {
    const { mfa_token, codigo_mfa } = req.body;
    if (!mfa_token || !codigo_mfa) {
      return res.status(400).json({ error: 'Ingrese el código MFA de 6 dígitos.' });
    }

    let payload;
    try {
      payload = jwt.verify(mfa_token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        error: 'El código de seguridad MFA ha expirado. Vuelva a iniciar sesión.',
      });
    }

    const hashEsperado = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(`${payload.id_usuario}:${String(codigo_mfa).trim()}`)
      .digest('hex');

    if (payload.tipo !== 'MFA_LOGIN' || payload.hashMfa !== hashEsperado) {
      return res.status(401).json({
        error: 'Código MFA incorrecto. Verifique los 6 dígitos e intente nuevamente.',
      });
    }

    const { rows } = await db.query(
      `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.estado, r.nombre AS rol
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1 AND u.estado = TRUE`,
      [payload.id_usuario]
    );
    const u = rows[0];
    if (!u) return res.status(401).json({ error: 'Usuario no disponible' });

    res.json({
      token: firmarToken(u),
      usuario: {
        id: u.id_usuario,
        nombres: u.nombres,
        apellidos: u.apellidos,
        correo: u.correo,
        rol: u.rol,
      },
    });
  } catch (e) {
    next(e);
  }
});

// 6. Datos del usuario con sesión iniciada
router.get('/me', verificarToken, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id_usuario AS id, u.nombres, u.apellidos, u.correo, r.nombre AS rol
         FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1 AND u.estado = TRUE`,
      [req.usuario.id]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Usuario no disponible' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
