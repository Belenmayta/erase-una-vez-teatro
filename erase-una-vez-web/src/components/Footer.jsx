import React from 'react';
import { MapPin, Phone, Mail, Heart, Sparkles } from 'lucide-react';

export default function Footer({ alCambiarPagina }) {
  return (
    <footer className="mt-auto bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1: Teatro */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-oro-400" />
              <div>
                <span className="text-xl font-bold font-theater text-slate-100 uppercase tracking-wider block leading-none">
                  ÉRASE UNA VEZ
                </span>
                <span className="text-xs text-oro-400 font-medium block mt-0.5">
                  Compañía de Teatro • La Paz
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md">
              Compañía de teatro infantil y formación artística fundada en 2017 en la ciudad de La Paz.
              Promovemos la imaginación, los valores y el bienestar emocional a través de la metodología
              de <span className="text-oro-400 font-semibold">Teatroterapia</span> y producciones dramáticas
              inclusivas con reserva del cupo social gratuito.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Proyecto de Grado para optar al título de Licenciatura en Ingeniería de Sistemas
              <br />
              <span className="text-slate-400 font-medium">Postulante:</span> Araceli Belen Mayta Velasco &bull;{' '}
              <span className="text-slate-400 font-medium">Tutor:</span> Ing. Simon Onofre (UDABOL, 2026)
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider text-oro-400">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => alCambiarPagina('cartelera')}
                  className="hover:text-white transition"
                >
                  Cartelera de Obras
                </button>
              </li>
              <li>
                <button
                  onClick={() => alCambiarPagina('cursos')}
                  className="hover:text-white transition"
                >
                  Talleres y Teatroterapia
                </button>
              </li>
              <li>
                <button
                  onClick={() => alCambiarPagina('nosotros')}
                  className="hover:text-white transition"
                >
                  Historia y Misión
                </button>
              </li>
              <li>
                <button
                  onClick={() => alCambiarPagina('mis-boletos')}
                  className="hover:text-white transition"
                >
                  Mis Boletos Digitales
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Ubicación y Contacto */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider text-oro-400">
              Sede Sopocachi
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teatro-400 shrink-0 mt-0.5" />
                <span>
                  Edificio Agustín Aspiazu (Planta Baja), entre calle Aspiazu y Av. 20 de Octubre. Sopocachi, La Paz.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teatro-400 shrink-0" />
                <span>+591 70000000 / WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teatro-400 shrink-0" />
                <span>contacto@eraseunavezteatro.bo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Separador inferior */}
        <div className="mt-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Compañía de Teatro "Érase una Vez". Todos los derechos reservados.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Arte, Cultura e Inclusión con <Heart className="w-3.5 h-3.5 text-teatro-500 fill-teatro-500" /> en Bolivia
          </p>
        </div>
      </div>
    </footer>
  );
}
