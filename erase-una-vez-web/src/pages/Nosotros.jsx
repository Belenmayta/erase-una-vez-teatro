import React from 'react';
import { Sparkles, Heart, MapPin, Calendar, Users, Award, BookOpen } from 'lucide-react';

export default function Nosotros() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Nosotros */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teatro-900/60 border border-teatro-700/50 text-teatro-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-oro-400" />
          Nuestra Identidad
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-theater text-white tracking-tight">
          Compañía de Teatro “Érase una Vez”
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Un espacio artístico y cultural nacido en la ciudad de La Paz con el propósito de acercar el arte dramático
          a los niños, jóvenes y familias bolivianas mediante propuestas creativas, inclusivas y terapéuticas.
        </p>
      </div>

      {/* Antecedentes e Historia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <span className="text-xs font-bold text-oro-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Trayectoria Desde 2017
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-theater text-white">
            Desde el Museo Pipiripi hasta los Grandes Escenarios
          </h2>
          <p>
            El elenco teatral <strong className="text-white">“Érase una Vez”</strong> nace en el año 2017 en la ciudad de La Paz. Sus primeras puestas en escena se desarrollaron en las instalaciones del emblemático <strong className="text-white">Museo Pipiripi</strong>, presentando adaptaciones de cuentos clásicos y relatos tradicionales como <em>La Caperucita Roja</em>, consolidando una identidad artística basada en la imaginación, la enseñanza de valores y la conexión emocional con las familias.
          </p>
          <p>
            En el año 2021, el elenco dio un salto fundamental al presentarse en el <strong className="text-white">Teatro Municipal 6 de Agosto</strong> con una función de carácter benéfico destinada a apoyar a niños en situación de vulnerabilidad y con diagnóstico de cáncer. Este hito consolidó la responsabilidad social como pilar permanente, estableciendo la política institucional de reservar en cada función un porcentaje de <strong className="text-oro-400">entradas 100% gratuitas</strong> para la niñez de sectores vulnerables.
          </p>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-slate-700 shadow-2xl p-2 bg-slate-900">
          <img
            src="https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80"
            alt="Elenco Teatral Erase una Vez"
            className="w-full h-80 object-cover rounded-2xl"
          />
          <div className="p-4 text-center">
            <span className="text-xs font-semibold text-slate-400">
              Puestas en escena que integran juego dramático, títeres y teatroterapia.
            </span>
          </div>
        </div>
      </div>

      {/* Misión y Visión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-teatro-900/80 border border-teatro-700/60 flex items-center justify-center text-teatro-300">
            <Heart className="w-6 h-6 text-teatro-400" />
          </div>
          <h3 className="text-2xl font-bold font-theater text-white">Nuestra Misión</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Contribuir al desarrollo integral de niñas, niños, adolescentes, jóvenes y familias a través del teatro y las diferentes expresiones artísticas, creando producciones que combinen entretenimiento, educación y concientización social.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Buscamos utilizar el arte como una herramienta de transformación, promoviendo valores, inclusión, desarrollo personal y reflexión sobre las diferentes problemáticas que atraviesa nuestra sociedad, garantizando espacios accesibles e inclusivos para toda la población.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-oro-950/80 border border-oro-700/60 flex items-center justify-center text-oro-300">
            <Sparkles className="w-6 h-6 text-oro-400" />
          </div>
          <h3 className="text-2xl font-bold font-theater text-white">Nuestra Visión</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Ser una organización cultural y social referente en Bolivia y con proyección internacional, reconocida por utilizar el teatro y el arte como herramientas de educación, inclusión, desarrollo humano y transformación social.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Aspiramos a consolidar a Érase una Vez como un proyecto integral que forme nuevas generaciones de artistas y ciudadanos conscientes, impulse la inclusión de personas con diferentes capacidades y lleve producciones teatrales de alta calidad a diferentes regiones del país.
          </p>
        </div>
      </div>

      {/* Qué es la Teatroterapia */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Metodología de Vanguardia
          </span>
          <h2 className="text-3xl font-bold font-theater text-white">
            ¿Qué es la Teatroterapia?
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          La teatroterapia es una metodología interdisciplinaria desarrollada junto a docentes y terapeutas que aprovecha las herramientas de las artes dramáticas (la expresión corporal, la respiración, la modulación vocal, la improvisación y el juego simbólico) como un vehículo para fortalecer la autoestima, el autoconocimiento, la empatía y la gestión saludable de las emociones.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-1">
            <strong className="text-white block font-theater text-sm">Autoestima y Seguridad</strong>
            <p className="text-slate-400">Superación de la timidez, desinhibición y confianza en la propia voz.</p>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-1">
            <strong className="text-white block font-theater text-sm">Empatía y Convivencia</strong>
            <p className="text-slate-400">Ponerse en el lugar del personaje y comprender distintas perspectivas humanas.</p>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs space-y-1">
            <strong className="text-white block font-theater text-sm">Expresión Emocional</strong>
            <p className="text-slate-400">Canalización positiva del estrés, frustración y creatividad mediante el arte.</p>
          </div>
        </div>
      </div>

      {/* Ubicación Física */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
        <MapPin className="w-8 h-8 text-teatro-400 mx-auto" />
        <h3 className="text-2xl font-bold font-theater text-white">Nuestra Sala en Sopocachi</h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Visítanos en la zona de Sopocachi, <strong className="text-white">Edificio Agustín Aspiazu (Planta Baja)</strong>, entre la calle Aspiazu y la Avenida 20 de Octubre en la ciudad de La Paz, Bolivia.
        </p>
      </div>
    </div>
  );
}
