import React, { useState } from 'react';
import { Sparkles, Heart, MapPin, Calendar, Users, Award, BookOpen, Camera, Film, ExternalLink, Navigation } from 'lucide-react';

const GALERIA_ELENCO = [
  {
    id: 1,
    titulo: 'Elenco Oficial “ÉRASE UNA VEZ”',
    subtitulo: 'Dirección General, actores, docentes y equipo creativo en La Paz',
    categoria: 'Elenco y Dirección',
    imagen: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    titulo: 'Talleres de Teatroterapia Infantil y Juvenil',
    subtitulo: 'Sesiones formativas de expresión corporal, voz y confianza escénica en Sopocachi',
    categoria: 'Academia y Talleres',
    imagen: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    titulo: 'Puestas en Escena y Temporadas Teatrales',
    subtitulo: 'Funciones con enfoque educativo, familiar y reserva de cupo social gratuito',
    categoria: 'En Escena',
    imagen: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    titulo: 'Culminación y Entrega de Certificados',
    subtitulo: 'Muestras finales de nuestros estudiantes junto a las familias del teatro',
    categoria: 'Muestras y Graduación',
    imagen: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=900&q=80',
  },
];

const OBRAS_HISTORICAS_DESTACADAS = [
  {
    id: 1,
    titulo: 'No hay un cementerio para mí',
    anio: '2025 - 2026',
    teatro: 'Teatro de Cámara / Cine Teatro 6 de Agosto',
    genero: 'Drama Contemporáneo',
    resena: 'Obra dramática sobre la memoria, la identidad y las huellas imborrables del pasado.',
    afiche: 'https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-no-hay-un-cementerio-para-mi.jpg.jpg',
  },
  {
    id: 2,
    titulo: 'La Caperucita Roja y el Bosque de los Valores',
    anio: '2017 - 2019',
    teatro: 'Espacio Interactivo Memoria y Futuro Pipiripi',
    genero: 'Teatro Infantil y Títeres',
    resena: 'Adaptación interactiva de cuentos clásicos enfocada en la prevención, el respeto y la unión familiar.',
    afiche: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    titulo: 'Función Solidaria por la Niñez Paceña',
    anio: '2021',
    teatro: 'Cine Teatro Municipal 6 de Agosto',
    genero: 'Gala Teatral Solidaria',
    resena: 'Hito institucional a beneficio de niñas y niños con diagnóstico de cáncer, dando origen al Cupo Social Gratuito.',
    afiche: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
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
          a los niños, jóvenes y familias bolivianas mediante propuestas creativas, inclusivas y terapéuticas.
        </p>
      </div>

      {/* Antecedentes e Historia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-xs sm:text-sm text-slate-200/90 leading-relaxed">
          <span className="text-xs font-slab text-teatro-300 tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-oro-400" /> Trayectoria desde 2017
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-theater text-slate-100">
            Desde el Museo Pipiripi hasta los Grandes Escenarios
          </h2>
          <p>
            El elenco teatral <strong className="text-slate-100">“ÉRASE UNA VEZ”</strong> nace en el año 2017 en la ciudad de La Paz. Sus primeras puestas en escena se desarrollaron en las instalaciones del emblemático <strong className="text-slate-100">Museo Pipiripi</strong>, presentando adaptaciones de cuentos clásicos y relatos tradicionales como <em>La Caperucita Roja</em>, consolidando una identidad artística basada en la imaginación, la enseñanza de valores y la conexión emocional con las familias.
          </p>
          <p>
            En el año 2021, el elenco dio un salto fundamental al presentarse en el <strong className="text-slate-100">Teatro Municipal 6 de Agosto</strong> con una función de carácter benéfico destinada a apoyar a niños en situación de vulnerabilidad y con diagnóstico de cáncer. Este hito consolidó la responsabilidad social como pilar permanente, estableciendo la política institucional de reservar en cada función un porcentaje de <strong className="text-oro-400">entradas 100% gratuitas</strong> para la niñez de sectores vulnerables.
          </p>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-teatro-300/30 shadow-2xl p-3 bg-slate-800/80">
          <img
            src="https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80"
            alt="Integrantes de la Compañía de Teatro ÉRASE UNA VEZ"
            className="w-full h-80 object-cover rounded-2xl"
          />
          <div className="p-4 text-center space-y-1">
            <span className="text-sm font-bold font-theater text-slate-100 block">
              Elenco y Equipo Artístico — ÉRASE UNA VEZ
            </span>
            <span className="text-xs text-teatro-300 block">
              Puestas en escena que integran juego dramático, títeres y teatroterapia en La Paz.
            </span>
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
            Contribuir al desarrollo integral de niñas, niños, adolescentes, jóvenes y familias a través del teatro y las diferentes expresiones artísticas, creando producciones que combinen entretenimiento, educación y concientización social.
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

      {/* Galería Fotográfica del Elenco y Momentos del Teatro */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-slab text-teatro-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-oro-400" /> Memoria Visual del Teatro
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-theater text-slate-100">
              Nuestro Elenco, Talleres y Momentos en Escena
            </h2>
          </div>
          <span className="text-xs font-slab text-teatro-300">
            Compañía de Teatro • La Paz
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GALERIA_ELENCO.map((item) => (
            <div
              key={item.id}
              onClick={() => setFotoActiva(item)}
              className="group cursor-pointer bg-slate-800/75 border border-teatro-300/25 hover:border-oro-400/60 rounded-2xl overflow-hidden shadow-lg transition flex flex-col justify-between"
            >
              <div className="relative h-52 overflow-hidden bg-slate-950">
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

      {/* Obras Históricas y Repertorio Anterior */}
      <div className="bg-slate-800/60 border border-teatro-300/25 rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-slab text-teatro-300 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-oro-400" /> Repertorio y Obras Anteriores
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-theater text-slate-100">
              Obras Puestas en Escena por la Compañía
            </h2>
          </div>
          <span className="text-xs font-slab text-teatro-300">
            Temporadas 2017 – 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OBRAS_HISTORICAS_DESTACADAS.map((obra) => (
            <div
              key={obra.id}
              className="bg-slate-900/80 border border-teatro-300/20 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
            >
              <div className="relative h-48 overflow-hidden bg-slate-950">
                <img
                  src={obra.afiche}
                  alt={obra.titulo}
                  className="w-full h-full object-cover"
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
                  <h3 className="text-lg font-bold font-theater text-slate-100">
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
          La teatroterapia es una metodología interdisciplinaria desarrollada junto a docentes y terapeutas que aprovecha las herramientas de las artes dramáticas (la expresión corporal, la respiración, la modulación vocal, la improvisación y el juego simbólico) como un vehículo para fortalecer la autoestima, el autoconocimiento, la empatía y la gestión saludable de las emociones.
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
            <p className="text-slate-200/80">Canalización positiva del estrés, frustración y creatividad mediante el arte.</p>
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
              Visítanos en la zona de Sopocachi, <strong className="text-slate-100">Edificio Agustín Aspiazu (Planta Baja)</strong>, ubicado entre la calle Agustín Aspiazu y la Avenida 20 de Octubre en la ciudad de La Paz, Bolivia.
            </p>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-teatro-300/20 space-y-1.5 text-xs">
              <div className="font-slab text-teatro-300">Coordenadas y Referencia:</div>
              <div className="text-slate-200/90">Calle Agustín Aspiazu esq. Av. 20 de Octubre, Zona Sopocachi (-16.5085, -68.1286)</div>
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

      {/* Modal de vista ampliada de foto */}
      {fotoActiva && (
        <div
          onClick={() => setFotoActiva(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-slate-800 border border-teatro-300/40 rounded-3xl overflow-hidden shadow-2xl"
          >
            <img
              src={fotoActiva.imagen}
              alt={fotoActiva.titulo}
              className="w-full h-96 object-cover"
            />
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-slab text-teatro-300">{fotoActiva.categoria}</span>
                <h4 className="text-xl font-bold font-theater text-slate-100">{fotoActiva.titulo}</h4>
                <p className="text-xs text-slate-200/90 mt-1">{fotoActiva.subtitulo}</p>
              </div>
              <button
                onClick={() => setFotoActiva(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-teatro-300/30"
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
