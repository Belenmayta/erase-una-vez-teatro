import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  MapPin,
  Calendar,
  Users,
  Award,
  BookOpen,
  Camera,
  Film,
  ExternalLink,
  Navigation,
  Phone,
  Stethoscope,
  Smile,
} from 'lucide-react';

const GALERIA_ELENCO = [
  {
    id: 1,
    titulo: 'Elenco Oficial “ÉRASE UNA VEZ” en el Teatro 16 de Julio',
    subtitulo: 'Nuestro elenco y dirección junto al público paceño a sala llena en la puesta en escena de “No hay un cementerio para mí”',
    categoria: 'Elenco y Dirección',
    imagen: '/galeria/elenco-principal-16-de-julio.jpg',
  },
  {
    id: 2,
    titulo: 'Gala Teatral en el Teatro Municipal Alberto Saavedra Pérez',
    subtitulo: 'Puesta en escena musical y navideña con elenco completo y bailarines en el principal escenario de La Paz',
    categoria: 'Grandes Escenarios',
    imagen: '/galeria/gala-navidena-teatro-municipal.jpg',
  },
  {
    id: 3,
    titulo: 'Tributo Musical “Encanto” al Aire Libre',
    subtitulo: 'Presentación familiar interactiva junto a cientos de niñas, niños y familias paceñas',
    categoria: 'Musical Familiar',
    imagen: '/galeria/musical-encanto-familia.jpg',
  },
  {
    id: 4,
    titulo: 'Comedia Teatral “Pasanaku” en Escena',
    subtitulo: 'Puesta en escena de humor y costumbres paceñas en nuestro nuevo espacio cultural de Sopocachi',
    categoria: 'Comedia Costumbrista',
    imagen: '/galeria/pasanaku-escena.jpg',
  },
  {
    id: 5,
    titulo: 'Obra y Acción Solidaria por Navidad',
    subtitulo: 'Llevando teatroterapia, juegos, regalos y alegría a niñas y niños de barrios altos de La Paz',
    categoria: 'Acción Solidaria',
    imagen: '/galeria/obra-solidaria-navidad.jpg',
  },
  {
    id: 6,
    titulo: 'Jornada de Teatro Solidario y Teatroterapia',
    subtitulo: 'Dinámicas grupales de integración, confianza y expresión emocional con niñas, niños y jóvenes',
    categoria: 'Teatroterapia',
    imagen: '/galeria/obra-solidaria-patio.jpg',
  },
  {
    id: 7,
    titulo: 'Fantasía Escénica: El Extraño Mundo de Jack',
    subtitulo: 'Caracterización, maquillaje artístico y montaje musical junto a alumnos y elenco oficial',
    categoria: 'Montaje Musical',
    imagen: '/galeria/elenco-extrano-mundo-jack.jpg',
  },
  {
    id: 8,
    titulo: 'Show Infantil: Patrulla Canina en Escena',
    subtitulo: 'Espectáculo infantil con valores de trabajo en equipo, amistad y rescate para los más pequeños',
    categoria: 'Teatro Infantil',
    imagen: '/galeria/show-patrulla-canina.jpg',
  },
  {
    id: 9,
    titulo: 'Backstage y Dirección Artística',
    subtitulo: 'Directora Lic. Jaqueline Díaz Aranda (Jacky) junto al elenco de actores antes de salir a escena',
    categoria: 'Detrás de Escena',
    imagen: '/galeria/elenco-backstage-jacky.jpg',
  },
];

const OBRAS_HISTORICAS_DESTACADAS = [
  {
    id: 1,
    titulo: 'No hay un cementerio para mí',
    anio: 'Temporada 2026 • Más Vendida',
    teatro: 'Cine Teatro 16 de Julio (613 entradas vendidas)',
    genero: 'Drama Contemporáneo',
    resena: 'Obra dramática sobre la memoria, la identidad y las huellas imborrables del pasado. Éxito de taquilla con 200 VIP, 403 Platea y 10 Mezzanine.',
    afiche: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-no-hay-un-cementerio-para-mi.jpg.jpg',
  },
  {
    id: 2,
    titulo: 'Show Huntrix',
    anio: 'Mayo 2026 • Más Vendida',
    teatro: 'Cine Teatro 16 de Julio (560 entradas vendidas)',
    genero: 'Espectáculo Musical y Escénico',
    resena: 'Gran producción musical presentada en mayo en el Teatro 16 de Julio con 200 entradas VIP, 347 Platea y 13 Mezzanine vendidas.',
    afiche: '/galeria/elenco-principal-16-de-julio.jpg',
  },
  {
    id: 3,
    titulo: 'Pasanaku',
    anio: 'Viernes 24 de Mayo • Hrs. 19:00',
    teatro: 'Sede Sopocachi — Edif. Aspiazu PB Local 5 (Adhesión Bs. 15)',
    genero: 'Comedia Costumbrista',
    resena: 'Divertida comedia teatral que retrata las anécdotas, secretos y enredos alrededor del tradicional juego del Pasanaku paceño.',
    afiche: '/galeria/afiche-pasanaku.jpg',
  },
  {
    id: 4,
    titulo: 'Peque Fest 2024',
    anio: '13 y 14 de Abril de 2024',
    teatro: 'Festival Infantil • Érase una Vez',
    genero: 'Festival Infantil y Musical (La Sirenita)',
    resena: 'Festival dedicado a la niñez con adaptación musical de La Sirenita, juegos escénicos y personajes mágicos.',
    afiche: '/galeria/afiche-peque-fest-2024.jpg',
  },
  {
    id: 5,
    titulo: 'Muestras de Teatro — Alumnos de Érase una Vez',
    anio: 'Sábado 10 de Febrero • Hrs. 17:00',
    teatro: 'Teatro de Cámara',
    genero: 'Gala Académica y Formativa',
    resena: 'Presentación oficial de los alumnos formados en nuestros talleres de actuación y teatroterapia en el Teatro de Cámara.',
    afiche: '/galeria/afiche-muestras-teatro-alumnos.jpg',
  },
  {
    id: 6,
    titulo: 'Tributo Musical “Encanto” y Gala en el Teatro Municipal',
    anio: 'Temporadas 2022 - 2025',
    teatro: 'Teatro Municipal Alberto Saavedra Pérez y Espacios Abiertos',
    genero: 'Musical Familiar',
    resena: 'Montajes musicales de gran formato con coreografías, canto en vivo y mensajes sobre la unión familiar.',
    afiche: '/galeria/musical-encanto-familia.jpg',
  },
];

const PROGRAMAS_SOCIALES_Y_TALLERES = [
  {
    id: 1,
    titulo: 'Taller Integral para Adultos Mayores',
    lema: '¡Pensamos en ellos también!',
    descripcion:
      'Espacio formativo y recreativo especialmente diseñado para la tercera edad en nuestra sede de Sopocachi: Zumba para la tercera edad, Teatroterapia, Canto y Danza.',
    actividades: ['Zumba para la tercera edad', 'Teatro terapia', 'Canto coral y expresivo', 'Danza e integración'],
    direccion: 'Aspiazu esq. 20 de Octubre, Edificio Aspiazu, PB. La Paz, Bolivia',
    contacto: 'WhatsApp / Cel: 69995091',
    afiche: '/galeria/afiche-taller-adultos-mayores.jpg',
  },
  {
    id: 2,
    titulo: 'Gran Campaña de Evaluación Psicológica Gratuita',
    lema: 'Salud Emocional y Teatroterapia para toda la Familia',
    descripcion:
      'Iniciativa social de ÉRASE UNA VEZ con atención profesional gratuita para niños, jóvenes, adultos y adultos mayores.',
    actividades: [
      'Niños: Problemas de conducta, prevención de bullying y habilidades sociales',
      'Jóvenes y Adultos: Ansiedad, estrés, trastornos alimenticios (anorexia, bulimia) y prevención',
      'Adultos Mayores: Depresión, acompañamiento en Alzheimer y terapia ocupacional',
    ],
    direccion: 'Aspiazu esq. 20 de Octubre, Edificio Aspiazu, PB. La Paz, Bolivia',
    contacto: 'Turnos al 69995091 - 60646087 • Facebook: Érase una vez Bolivia',
    afiche: '/galeria/afiche-campana-psicologica.jpg',
  },
];

export default function Nosotros() {
  const [fotoActiva, setFotoActiva] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Nosotros */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-800/80 border border-teatro-300/30 text-teatro-300 text-xs font-slab">
          <Sparkles className="w-3.5 h-3.5 text-oro-400" />
          Nuestra Identidad Artística
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-theater text-slate-100 tracking-wide">
          ÉRASE UNA VEZ
        </h1>
        <p className="text-base sm:text-lg text-oro-400 font-medium tracking-normal">
          Compañía de Teatro • La Paz
        </p>
        <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed">
          Un espacio artístico y cultural nacido en la ciudad de La Paz con el propósito de acercar el arte dramático
          a los niños, jóvenes, adultos mayores y familias bolivianas mediante propuestas creativas, inclusivas y terapéuticas.
        </p>
      </div>

      {/* Antecedentes e Historia con Foto Real del Elenco en el Teatro 16 de Julio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-4 text-xs sm:text-sm text-slate-200/90 leading-relaxed">
          <span className="text-xs font-slab text-teatro-300 tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-oro-400" /> Trayectoria desde 2017
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-theater text-slate-100">
            Desde el Museo Pipiripi hasta el Teatro 16 de Julio y Teatro Municipal
          </h2>
          <p>
            El elenco teatral <strong className="text-slate-100">“ÉRASE UNA VEZ”</strong> nace en el año 2017 en la ciudad de La Paz bajo la dirección general de la <strong className="text-oro-400">Lic. Jaqueline Díaz Aranda</strong>. Sus primeras puestas en escena se desarrollaron en el emblemático <strong className="text-slate-100">Museo Pipiripi</strong>, presentando adaptaciones de cuentos clásicos como <em>La Caperucita Roja</em> y consolidando una identidad basada en la imaginación, la enseñanza de valores y la conexión emocional con las familias.
          </p>
          <p>
            A lo largo de su trayectoria, la compañía se ha presentado en los escenarios más importantes de La Paz —incluyendo el <strong className="text-slate-100">Cine Teatro 16 de Julio</strong>, el <strong className="text-slate-100">Teatro Municipal Alberto Saavedra Pérez</strong>, el <strong className="text-slate-100">Teatro Municipal 6 de Agosto</strong> y el <strong className="text-slate-100">Teatro de Cámara</strong>—, además de realizar obras solidarias en barrios paceños, campañas psicológicas gratuitas y talleres de <strong className="text-oro-400">Teatroterapia</strong> para niños, jóvenes y adultos mayores.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-teatro-300/25 text-center">
              <span className="text-xl font-bold font-theater text-oro-400 block">+15</span>
              <span className="text-[11px] text-slate-200/80">Obras y Musicales</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-teatro-300/25 text-center">
              <span className="text-xl font-bold font-theater text-teatro-300 block">1.173+</span>
              <span className="text-[11px] text-slate-200/80">Espectadores 2026</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-teatro-300/25 text-center">
              <span className="text-xl font-bold font-theater text-malva-400 block">100%</span>
              <span className="text-[11px] text-slate-200/80">Compromiso Social</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div
            onClick={() => setFotoActiva(GALERIA_ELENCO[0])}
            className="cursor-pointer relative rounded-3xl overflow-hidden border border-teatro-300/35 shadow-2xl p-3 bg-slate-800/85 group"
          >
            <img
              src="/galeria/elenco-principal-16-de-julio.jpg"
              alt="Elenco de la Compañía de Teatro ÉRASE UNA VEZ en el Cine Teatro 16 de Julio"
              className="w-full h-80 sm:h-96 object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-500"
            />
            <div className="p-4 text-center space-y-1">
              <span className="text-base font-bold font-theater text-slate-100 block">
                Elenco Oficial “ÉRASE UNA VEZ” — Cine Teatro 16 de Julio
              </span>
              <span className="text-xs text-teatro-300 block">
                Cierre a sala llena junto al público paceño (haz clic en la imagen para ampliar).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Misión y Visión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800/75 border border-teatro-300/25 rounded-3xl p-8 space-y-4 shadow-xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-teatro-300/40 flex items-center justify-center text-teatro-300">
            <Heart className="w-6 h-6 text-malva-400" />
          </div>
          <h3 className="text-2xl font-bold font-theater text-slate-100">Nuestra Misión</h3>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
            Contribuir al desarrollo integral de niñas, niños, adolescentes, jóvenes, adultos mayores y familias a través del teatro y las diferentes expresiones artísticas, creando producciones que combinen entretenimiento, educación y concientización social.
          </p>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
            Buscamos utilizar el arte como una herramienta de transformación, promoviendo valores, inclusión, desarrollo personal y reflexión sobre las diferentes problemáticas que atraviesa nuestra sociedad, garantizando espacios accesibles e inclusivos para toda la población.
          </p>
        </div>

        <div className="bg-slate-800/75 border border-teatro-300/25 rounded-3xl p-8 space-y-4 shadow-xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-oro-400/40 flex items-center justify-center text-oro-400">
            <Sparkles className="w-6 h-6 text-oro-400" />
          </div>
          <h3 className="text-2xl font-bold font-theater text-slate-100">Nuestra Visión</h3>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
            Ser una organización cultural y social referente en Bolivia y con proyección internacional, reconocida por utilizar el teatro y el arte como herramientas de educación, inclusión, desarrollo humano y transformación social.
          </p>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
            Aspiramos a consolidar a ÉRASE UNA VEZ como un proyecto integral que forme nuevas generaciones de artistas y ciudadanos conscientes, impulse la inclusión de personas con diferentes capacidades y lleve producciones teatrales de alta calidad a diferentes regiones del país.
          </p>
        </div>
      </div>

      {/* Galería Fotográfica Real del Elenco y Momentos del Teatro */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-slab text-teatro-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-oro-400" /> Memoria Visual del Teatro (Fotografías Reales)
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-theater text-slate-100">
              Nuestro Elenco, Obras Solidarias y Momentos en Escena
            </h2>
          </div>
          <span className="text-xs font-slab text-teatro-300">
            Haz clic en cualquier fotografía para ampliarla
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALERIA_ELENCO.map((item) => (
            <div
              key={item.id}
              onClick={() => setFotoActiva(item)}
              className="group cursor-pointer bg-slate-800/75 border border-teatro-300/25 hover:border-oro-400/60 rounded-2xl overflow-hidden shadow-lg transition flex flex-col justify-between"
            >
              <div className="relative h-60 overflow-hidden bg-slate-950">
                <img
                  src={item.imagen}
                  alt={item.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/90 border border-teatro-300/30 text-[11px] font-slab text-teatro-300">
                  {item.categoria}
                </span>
              </div>
              <div className="p-4 space-y-1.5">
                <h3 className="font-theater text-base font-bold text-slate-100 group-hover:text-oro-400 transition">
                  {item.titulo}
                </h3>
                <p className="text-xs text-slate-200/80 leading-relaxed">
                  {item.subtitulo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Obras Históricas y Afiches Oficiales */}
      <div className="bg-slate-800/60 border border-teatro-300/25 rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-slab text-teatro-300 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-oro-400" /> Repertorio, Afiches y Obras Anteriores
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-theater text-slate-100">
              Obras Puestas en Escena por la Compañía
            </h2>
          </div>
          <span className="text-xs font-slab text-teatro-300">
            Temporadas 2017 – 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OBRAS_HISTORICAS_DESTACADAS.map((obra) => (
            <div
              key={obra.id}
              onClick={() =>
                setFotoActiva({
                  titulo: obra.titulo,
                  subtitulo: `${obra.resena} (${obra.teatro})`,
                  categoria: obra.genero,
                  imagen: obra.afiche,
                })
              }
              className="cursor-pointer bg-slate-900/85 border border-teatro-300/20 hover:border-oro-400/50 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg transition group"
            >
              <div className="relative h-64 overflow-hidden bg-slate-950">
                <img
                  src={obra.afiche}
                  alt={obra.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-teatro-300/30 text-xs font-slab text-teatro-300">
                  {obra.anio}
                </span>
              </div>
              <div className="p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-slab text-teatro-300">
                    {obra.genero}
                  </span>
                  <h3 className="text-lg font-bold font-theater text-slate-100 group-hover:text-oro-400 transition">
                    {obra.titulo}
                  </h3>
                  <p className="text-xs text-slate-200/80 leading-relaxed">
                    {obra.resena}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs font-slab text-teatro-300">
                  <MapPin className="w-3.5 h-3.5 text-oro-400 shrink-0" />
                  <span>{obra.teatro}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Programas de Impacto Social: Taller Adultos Mayores y Campaña Psicológica Gratuita */}
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-slab text-teatro-300 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-oro-400" /> Compromiso con la Salud Emocional y la Comunidad
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-theater text-slate-100">
            Talleres Especiales y Campañas de Evaluación Psicológica Gratuita
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {PROGRAMAS_SOCIALES_Y_TALLERES.map((prog) => (
            <div
              key={prog.id}
              className="bg-slate-800/80 border border-teatro-300/30 rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 sm:grid-cols-12"
            >
              <div
                onClick={() =>
                  setFotoActiva({
                    titulo: prog.titulo,
                    subtitulo: prog.descripcion,
                    categoria: prog.lema,
                    imagen: prog.afiche,
                  })
                }
                className="sm:col-span-5 relative min-h-[260px] bg-slate-950 cursor-pointer group overflow-hidden"
              >
                <img
                  src={prog.afiche}
                  alt={prog.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-teatro-300/30 text-[10px] font-slab text-oro-400">
                  Clic para ampliar afiche
                </span>
              </div>

              <div className="sm:col-span-7 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-slab text-oro-400">{prog.lema}</span>
                  <h3 className="text-xl font-bold font-theater text-slate-100">{prog.titulo}</h3>
                  <p className="text-xs text-slate-200/85 leading-relaxed">{prog.descripcion}</p>
                  <ul className="space-y-1 pt-2 text-xs text-slate-200/90">
                    {prog.actividades.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Smile className="w-3.5 h-3.5 text-oro-400 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-700/70 space-y-1 text-xs font-slab text-teatro-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-oro-400 shrink-0" />
                    <span>{prog.direccion}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-oro-400 shrink-0" />
                    <span>{prog.contacto}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Qué es la Teatroterapia */}
      <div className="bg-gradient-to-r from-slate-800/90 via-slate-900 to-slate-800/90 border border-teatro-300/25 rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-slab text-teatro-300 tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-oro-400" /> Metodología de Vanguardia
          </span>
          <h2 className="text-3xl font-bold font-theater text-slate-100">
            ¿Qué es la Teatroterapia?
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-4xl">
          La teatroterapia es una metodología interdisciplinaria desarrollada junto a docentes y psicólogos terapeutas que aprovecha las herramientas de las artes dramáticas (la expresión corporal, la respiración, la modulación vocal, la improvisación y el juego simbólico) como un vehículo para fortalecer la autoestima, el autoconocimiento, la empatía y la gestión saludable de las emociones en niños, jóvenes, adultos y adultos mayores.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-900/75 rounded-2xl border border-teatro-300/20 text-xs space-y-1">
            <strong className="text-slate-100 block font-theater text-sm">Autoestima y Seguridad</strong>
            <p className="text-slate-200/80">Superación de la timidez, desinhibición y confianza en la propia voz.</p>
          </div>
          <div className="p-4 bg-slate-900/75 rounded-2xl border border-teatro-300/20 text-xs space-y-1">
            <strong className="text-slate-100 block font-theater text-sm">Empatía y Convivencia</strong>
            <p className="text-slate-200/80">Ponerse en el lugar del personaje y comprender distintas perspectivas humanas.</p>
          </div>
          <div className="p-4 bg-slate-900/75 rounded-2xl border border-teatro-300/20 text-xs space-y-1">
            <strong className="text-slate-100 block font-theater text-sm">Expresión Emocional</strong>
            <p className="text-slate-200/80">Canalización positiva del estrés, ansiedad y creatividad mediante el arte escénico.</p>
          </div>
        </div>
      </div>

      {/* Ubicación Física con Google Maps Interactivo */}
      <div className="bg-slate-800/80 border border-teatro-300/30 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-teatro-300/30 text-teatro-300 text-xs font-slab">
              <MapPin className="w-3.5 h-3.5 text-oro-400" />
              Ubicación en Google Maps
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-theater text-slate-100">
              Nuestra Sala en Sopocachi
            </h3>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
              Visítanos en la zona de Sopocachi, <strong className="text-slate-100">Edificio Agustín Aspiazu (Planta Baja, galería local 5 al fondo)</strong>, ubicado en la intersección de la calle Agustín Aspiazu y la Avenida 20 de Octubre en la ciudad de La Paz, Bolivia.
            </p>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-teatro-300/20 space-y-1.5 text-xs">
              <div className="font-slab text-teatro-300">Dirección y Contactos Oficiales:</div>
              <div className="text-slate-200/90">Av. 20 de Octubre esq. Agustín Aspiazu, Edif. Aspiazu PB, Sopocachi</div>
              <div className="text-oro-400 font-slab">WhatsApp / Reservas: 69995091 • 60646087 • 61111084</div>
              <div className="text-slate-300">Facebook: Érase una vez Bolivia</div>
            </div>
            <div className="pt-2">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Calle+Agustin+Aspiazu+y+Av+20+de+Octubre+Sopocachi+La+Paz+Bolivia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-oro-400 hover:bg-oro-300 text-slate-950 font-semibold text-xs shadow-lg transition"
              >
                <Navigation className="w-4 h-4" />
                Abrir Ubicación en Google Maps
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-teatro-300/30 shadow-2xl bg-slate-900 h-80">
            <iframe
              title="Mapa Sede Compañía de Teatro ÉRASE UNA VEZ - Sopocachi, La Paz"
              src="https://www.google.com/maps?q=Calle+Agustin+Aspiazu+y+Av+20+de+Octubre,+Sopocachi,+La+Paz,+Bolivia&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      {/* Modal de vista ampliada de foto o afiche */}
      {fotoActiva && (
        <div
          onClick={() => setFotoActiva(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-slate-800 border border-teatro-300/40 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="bg-slate-950 max-h-[70vh] flex items-center justify-center overflow-hidden">
              <img
                src={fotoActiva.imagen}
                alt={fotoActiva.titulo}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-slab text-teatro-300">{fotoActiva.categoria}</span>
                <h4 className="text-xl font-bold font-theater text-slate-100">{fotoActiva.titulo}</h4>
                <p className="text-xs text-slate-200/90 mt-1">{fotoActiva.subtitulo}</p>
              </div>
              <button
                onClick={() => setFotoActiva(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-teatro-300/30 shrink-0"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
