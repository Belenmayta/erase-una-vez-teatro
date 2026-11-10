require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

async function seed() {
  console.log('--- Iniciando Seeder con Datos 100% Reales para Érase una Vez ---');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Roles del Sistema
    await client.query(`
      INSERT INTO rol (id_rol, nombre, descripcion) VALUES
        (1, 'ADMINISTRADOR', 'Gestiona cartelera, usuarios, cursos y reportes'),
        (2, 'RECEPCION', 'Valida entradas en puerta'),
        (3, 'COMPRADOR', 'Público que compra boletos e inscribe a cursos'),
        (4, 'DOCENTE', 'Dicta cursos y talleres')
      ON CONFLICT (id_rol) DO UPDATE SET nombre = EXCLUDED.nombre;
    `);

    // 2. Usuarios Base (Contraseñas limpias sin signos)
    const adminPass = await bcrypt.hash('teatro123', 10);
    const recepPass = await bcrypt.hash('recepcion123', 10);
    const compradorPass = await bcrypt.hash('comprador123', 10);

    // Jaqueline Diaz Aranda (Product Owner / Dirección)
    await client.query(`
      INSERT INTO usuario (id_rol, nombres, apellidos, correo, contrasena_hash, estado)
      VALUES (1, 'Jaqueline', 'Diaz Aranda', 'jaqueline@teatro.com', $1, true)
      ON CONFLICT (correo) DO UPDATE SET id_rol = 1, contrasena_hash = $1, estado = true;
    `, [adminPass]);

    // Araceli Belen Mayta Velasco (Postulante / Admin)
    await client.query(`
      INSERT INTO usuario (id_rol, nombres, apellidos, correo, contrasena_hash, estado)
      VALUES (1, 'Araceli Belen', 'Mayta Velasco', 'araceli@teatro.com', $1, true)
      ON CONFLICT (correo) DO UPDATE SET id_rol = 1, contrasena_hash = $1, estado = true;
    `, [adminPass]);

    // Personal de Recepción
    await client.query(`
      INSERT INTO usuario (id_rol, nombres, apellidos, correo, contrasena_hash, estado)
      VALUES (2, 'Personal', 'Recepcion', 'recepcion@teatro.com', $1, true)
      ON CONFLICT (correo) DO UPDATE SET id_rol = 2, contrasena_hash = $1, estado = true;
    `, [recepPass]);

    // Comprador de prueba (Maria Perez)
    await client.query(`
      INSERT INTO usuario (id_rol, nombres, apellidos, ci, correo, telefono, contrasena_hash, estado)
      VALUES (3, 'Maria', 'Perez Rocha', '6543210', 'maria@comprador.com', '71234567', $1, true)
      ON CONFLICT (correo) DO UPDATE SET contrasena_hash = $1, estado = true;
    `, [compradorPass]);

    // 3. Salas Reales de La Paz
    const salasData = [
      { nombre: 'Teatro Municipal', direccion: 'Calle Comercio 123, La Paz', capacidad: 450, plano: 'Platea (20 filas), balcón (8 filas), 2 pasillos laterales' },
      { nombre: 'Teatro Municipal Alberto Saavedra Pérez', direccion: 'Calle Genaro Sanjinés esq. Indaburo, La Paz', capacidad: 650, plano: 'Platea baja (18 filas), palcos (10 sectores), anfiteatro (6 filas), galería (8 filas), 2 pasillos laterales' },
      { nombre: 'Teatro 16 de Julio', direccion: 'Av. 16 de Julio (El Prado) N° 1471, La Paz', capacidad: 800, plano: 'Platea principal (25 filas en declive), balcón superior (10 filas), 2 pasillos laterales, pasillo central' },
      { nombre: 'Cine Teatro 6 de Agosto', direccion: 'Av. 6 de Agosto N° 2254, Sopocachi, La Paz', capacidad: 500, plano: 'Platea baja (16 filas), mezzanine (8 filas), 2 pasillos laterales, 1 pasillo central' },
      { nombre: 'Teatro de Cámara Norma Merlo', direccion: 'Calle Genaro Sanjinés esq. Indaburo, La Paz', capacidad: 120, plano: 'Gradería fija escalonada (7 filas), escenario a nivel de piso, pasillo central de acceso' },
      { nombre: 'Teatro KUU INTI', direccion: 'Av. Hernando Siles, Calle 10 de Obrajes, La Paz', capacidad: 300, plano: 'Platea única (12 filas en desnivel), escenario polivalente, 2 pasillos laterales' },
      { nombre: 'Casa de la Cultura (Teatro Modesta Sanjinés)', direccion: 'Av. Mariscal Santa Cruz esq. Potosí, La Paz', capacidad: 280, plano: 'Platea fija (10 filas), escenario tipo caja negra, pasillo central, 2 pasillos de servicio' },
      { nombre: 'Teatro Mala Fama', direccion: 'Calle Murillo N° 764, Zona Central, La Paz', capacidad: 150, plano: 'Distribución tipo café-teatro, mesas y sillas libres (6 sectores), pasillo central flexible' },
      { nombre: 'Pasaje Kuljis', direccion: 'Calle Genaro Sanjinés N° 542 (Entre Comercio e Ingavi), La Paz', capacidad: 90, plano: 'Espacio al aire libre, sillas móviles (5 filas a ambos lados), pasillo central de escenografía' }
    ];

    for (const s of salasData) {
      await client.query(`
        INSERT INTO sala (nombre, direccion, capacidad, plano)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
      `, [s.nombre, s.direccion, s.capacidad, s.plano]);
    }

    // 4. Las 11 Obras Reales de la Compañía
    const obrasData = [
      { titulo: 'Sing: ¡Ven y Canta!', descripcion: 'Presentación especial a cargo del elenco infantil inspirada en la película Sing.', duracion_min: 120, publico_objetivo: 'Familiar / Infantil', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-sing-ven-y-canta.jpg.jpg', estado: 'Finalizada' },
      { titulo: 'Paw Patrol: Al Rescate', descripcion: 'Obra infantil basada en la popular serie animada Paw Patrol.', duracion_min: 120, publico_objetivo: 'Infantil / Familiar', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-paw-patrol.jpg.jpg', estado: 'Finalizada' },
      { titulo: 'Disney Encanto: El Musical', descripcion: 'Espectáculo musical inspirado en la magia y las canciones de Encanto.', duracion_min: 120, publico_objetivo: 'Familiar / Infantil', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-disney-encanto.jpg.jpg', estado: 'Finalizada' },
      { titulo: 'El Mago de Oz: El Musical', descripcion: 'Gran puesta en escena del clásico cuento adaptado al formato musical.', duracion_min: 120, publico_objetivo: 'Familiar', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-el-mago-de-oz.jpg.jpg', estado: 'Finalizada' },
      { titulo: 'Disney Encanto: El Musical (2)', descripcion: 'Nueva temporada del exitoso musical inspirado en la magia de Encanto.', duracion_min: 120, publico_objetivo: 'Familiar', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-disney-encanto-teatro-16-julio.jpg.jpg', estado: 'Finalizada' },
      { titulo: 'El Extraño Mundo del K-Pop', descripcion: 'Adaptación temática de Halloween que combina K-Pop con un estilo tenebroso.', duracion_min: 120, publico_objetivo: 'Todo Público / Juvenil', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-el-extrano-mundo-del-kpop.jpg.jpg', estado: 'Finalizada' },
      { titulo: 'El Musical Mago de Oz & K-Pop Demon Hunters', descripcion: 'Adaptación musical familiar que combina la historia clásica con danza urbana.', duracion_min: 120, publico_objetivo: 'Familiar / Infantil', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-mago-de-oz-kpop.jpg.jpg', estado: 'Finalizada' },
      { titulo: 'Las Guerreras K-Pop', descripcion: 'Espectáculo escénico inspirado en cultura Pop/K-Pop y danza.', duracion_min: 120, publico_objetivo: 'Todo Público / Juvenil', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-las-guerreras-kpop.jpg.jpg', estado: 'En cartelera' },
      { titulo: 'No Hay un Cementerio Para Mí', descripcion: 'Drama teatral sobre la última frontera de la dignidad humana.', duracion_min: 180, publico_objetivo: 'Adultos / Mayores 14', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-no-hay-un-cementerio-para-mi.jpg.jpg', estado: 'En cartelera' },
      { titulo: 'La Última Herencia de Elsita', descripcion: 'Obra dramática que visibiliza la violencia silenciosa que sufren las personas adultas mayores.', duracion_min: 120, publico_objetivo: 'Adultos / Mayores 14', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-la-ultima-herencia-de-elsita.jpg.jpg', estado: 'Próximamente' },
      { titulo: 'Las Guerreras K-Pop (2)', descripcion: 'Espectáculo escénico de fantasía y acción inspirado en K-Pop.', duracion_min: 120, publico_objetivo: 'Todo Público / Juvenil', afiche_url: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-guerreras-kpop-teatro-16-julio.jpg.jpg', estado: 'Próximamente' }
    ];

    for (const o of obrasData) {
      await client.query(`
        INSERT INTO obra (titulo, descripcion, duracion_min, publico_objetivo, afiche_url, estado)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [o.titulo, o.descripcion, o.duracion_min, o.publico_objetivo, o.afiche_url, o.estado]);
    }

    await client.query('COMMIT');
    console.log('--- Seeder completado con éxito: 9 salas y 11 obras reales cargadas ---');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en seeder:', err);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seed();