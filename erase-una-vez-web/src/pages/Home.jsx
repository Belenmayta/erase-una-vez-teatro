import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  Calendar,
  Ticket,
  GraduationCap,
  Sparkles,
  MapPin,
  Clock,
  Heart,
  CheckCircle2,
  QrCode,
  ArrowRight,
} from 'lucide-react';

export default function Home({ alCambiarPagina, alSeleccionarFuncion }) {
  const [proximasFunciones, setProximasFunciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await api.obtenerFunciones();
        setProximasFunciones(data.slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800/90 border-b border-slate-800">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C4AEF4_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-teatro-300/30 text-teatro-300 text-xs font-slab tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-oro-400" />
                <span>Compañía de Teatro • La Paz</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-theater text-slate-100 tracking-tight leading-tight">
                Donde la imaginación y las emociones cobran vida sobre el escenario
              </h1>

              <p className="text-base sm:text-lg text-slate-200/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Bienvenido a la plataforma web oficial de la{' '}
                <strong className="text-slate-100 font-semibold">Compañía de Teatro “ÉRASE UNA VEZ”</strong>.
                Descubre nuestra cartelera teatral, elige tus butacas preferidas, adquiere tus boletos digitales
                con código QR al instante e inscríbete a nuestros talleres de teatroterapia.
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
                <button
                  onClick={() => alCambiarPagina('cartelera')}
                  className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-semibold shadow-lg shadow-teatro-900/50 transition flex items-center gap-2 group"
                >
                  <Ticket className="w-5 h-5 text-oro-400 group-hover:rotate-12 transition-transform" />
                  Ver Cartelera y Boletos
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => alCambiarPagina('cursos')}
                  className="py-3.5 px-6 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold border border-slate-700 transition flex items-center gap-2"
                >
                  <GraduationCap className="w-5 h-5 text-oro-400" />
                  Talleres de Formación
                </button>
              </div>

              {/* Badges de garantía */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Selección de Asientos en Vivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-oro-400" />
                  <span>Pago con QR Dinámico Simple</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-teatro-400" />
                  <span>Cupo Social Gratuito</span>
                </div>
              </div>
            </div>
            {/* Tarjeta Visual de Hero Actualizada */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900/90 p-4">
                <div className="relative h-72 rounded-2xl overflow-hidden mb-4">
                  <img
                    src="https://kzenzecmwosrtilajfkz.supabase.co/storage/v1/object/public/afiches/afiche-no-hay-un-cementerio-para-mi.jpg.jpg"
                    alt="No hay un cementerio para mí"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 bg-teatro-900/90 text-teatro-200 text-xs px-3 py-1 rounded-full border border-teatro-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-oro-400" /> Estreno Destacado
                  </span>
                </div>

                <div className="space-y-2 p-2">
                  <h3 className="font-theater text-lg font-bold text-white">
                    No hay un cementerio para mí
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    Obra dramática en formato de cámara sobre la memoria, la búsqueda personal y las huellas imborrables del pasado.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                    <span className="text-oro-400 font-bold text-base">Bs. 40.00</span>
                    <button
                      onClick={() => alCambiarPagina('cartelera')}
                      className="px-3 py-1.5 rounded-lg bg-teatro-700 hover:bg-teatro-600 text-white font-medium transition"
                    >
                      Reservar Asiento
                    </button>
                  </div>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </section>

      {/* Cartelera Destacada */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-teatro-400 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-oro-400" />
              <span>Funciones Programadas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-theater text-white mt-1">
              Próximamente en Cartelera
            </h2>
          </div>
          <button
            onClick={() => alCambiarPagina('cartelera')}
            className="text-xs font-semibold text-oro-400 hover:text-oro-300 flex items-center gap-1 self-start sm:self-auto"
          >
            Ver toda la programación <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-slate-400 text-sm">Cargando cartelera...</div>
        ) : proximasFunciones.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            No hay funciones programadas por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {proximasFunciones.map((f) => (
              <div
                key={f.id_presentacion || f.id_funcion}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl hover:border-teatro-700/60 transition group"
              >
                <div className="relative h-48 overflow-hidden bg-slate-950">
                  <img
                    src={f.afiche_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'}
                    alt={f.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-oro-400 border border-slate-700">
                    Bs. {f.precio}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[11px] font-medium text-teatro-300 bg-teatro-950/80 px-2.5 py-0.5 rounded-full border border-teatro-800">
                      {f.publico_objetivo || 'Familiar'}
                    </span>
                    <h3 className="font-theater text-lg font-bold text-white group-hover:text-teatro-300 transition">
                      {f.titulo}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{f.descripcion}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-oro-400" />
                      <span>{String(f.fecha).slice(0, 10)} &bull; {String(f.hora_inicio).slice(0, 5)} hrs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teatro-400" />
                      <span>{f.sala}</span>
                    </div>

                    <button
                      onClick={() => alSeleccionarFuncion(f)}
                      className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-teatro-700 to-teatro-600 hover:from-teatro-600 hover:to-teatro-500 text-white font-semibold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                    >
                      <Ticket className="w-3.5 h-3.5 text-oro-400" /> Elegir Asiento
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pilares Institucionales y Teatroterapia */}
      <section className="bg-slate-950/80 border-y border-slate-800/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold text-oro-400 uppercase tracking-widest">
              Identidad Artística y Social
            </span>
            <h2 className="text-3xl font-bold font-theater text-white">
              Más que teatro: Transformación y Bienestar
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Desde 2017 llevamos arte y valores a familias paceñas con tres principios esenciales:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teatro-900/80 border border-teatro-700/60 flex items-center justify-center text-teatro-300">
                <Heart className="w-6 h-6 text-teatro-400" />
              </div>
              <h3 className="text-lg font-bold font-theater text-white">Teatroterapia</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilizamos la expresión dramática y el juego guiado como herramientas terapéuticas para
                elevar la autoestima, vencer la timidez y fomentar la inteligencia emocional en niños y jóvenes.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-oro-950/80 border border-oro-700/60 flex items-center justify-center text-oro-300">
                <Sparkles className="w-6 h-6 text-oro-400" />
              </div>
              <h3 className="text-lg font-bold font-theater text-white">Inclusión Social</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Garantizamos que en cada función se reserve un cupo de entradas 100% gratuitas para niñas
                y niños de sectores vulnerables, democratizando el acceso a la cultura en nuestra ciudad.
              </p>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-300">
                <GraduationCap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold font-theater text-white">Academia Formativa</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cursos continuos para niños, adolescentes y adultos en nuestra sede de Sopocachi con instructores
                profesionales y seguimiento personalizado en expresión oral y corporal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sede y Ubicación Sopocachi */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-teatro-950/50 to-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-oro-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Nuestra Sede Cultural
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-theater text-white">
                Visítanos en Sopocachi
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Nuestra sala y academia se encuentran en pleno corazón cultural de La Paz:
                <br />
                <strong className="text-white">Edificio Agustín Aspiazu (Planta Baja)</strong>, ubicado en la intersección
                entre la calle Agustín Aspiazu y la Avenida 20 de Octubre.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => alCambiarPagina('nosotros')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
                >
                  Conocer más de nuestra historia <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-teatro-300/30 bg-slate-950 p-2 shadow-xl h-64">
              <iframe
                title="Mapa Sede Sopocachi - Compañía de Teatro ÉRASE UNA VEZ"
                src="https://www.google.com/maps?q=Calle+Agustin+Aspiazu+y+Av+20+de+Octubre,+Sopocachi,+La+Paz,+Bolivia&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
