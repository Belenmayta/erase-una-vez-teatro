import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ModalLogin from './components/ModalLogin';

// Páginas
import Home from './pages/Home';
import Cartelera from './pages/Cartelera';
import SeleccionAsientos from './pages/SeleccionAsientos';
import PagoQR from './pages/PagoQR';
import MisBoletos from './pages/MisBoletos';
import Cursos from './pages/Cursos';
import MisEstudiantes from './pages/MisEstudiantes';
import EscanerPuerta from './pages/EscanerPuerta';
import AdminDashboard from './pages/AdminDashboard';
import Nosotros from './pages/Nosotros';

function AppContent() {
  const [paginaActual, setPaginaActual] = useState('home');
  const [modalLoginAbierto, setModalLoginAbierto] = useState(false);
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null);
  const [ventaActual, setVentaActual] = useState(null);

  const irA = (pagina) => {
    setPaginaActual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const seleccionarFuncion = (funcion) => {
    setFuncionSeleccionada(funcion);
    irA('seleccion-asientos');
  };

  const procederAlPago = (venta) => {
    setVentaActual(venta);
    irA('pago-qr');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        alAbrirLogin={() => setModalLoginAbierto(true)}
        paginaActual={paginaActual}
        alCambiarPagina={irA}
      />

      <main className="flex-1">
        {paginaActual === 'home' && (
          <Home
            alCambiarPagina={irA}
            alSeleccionarFuncion={seleccionarFuncion}
          />
        )}

        {paginaActual === 'cartelera' && (
          <Cartelera alSeleccionarFuncion={seleccionarFuncion} />
        )}

        {paginaActual === 'seleccion-asientos' && (
          funcionSeleccionada ? (
            <SeleccionAsientos
              funcion={funcionSeleccionada}
              alVolver={() => irA('cartelera')}
              alProcederPago={procederAlPago}
              alAbrirLogin={() => setModalLoginAbierto(true)}
            />
          ) : (
            // Redirección de seguridad si recargan la página y se pierde el estado
            <div className="p-8 text-center">
              <p className="mb-4 text-slate-400">No hay ninguna función seleccionada.</p>
              <button 
                onClick={() => irA('cartelera')}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
              >
                Volver a la Cartelera
              </button>
            </div>
          )
        )}

        {paginaActual === 'pago-qr' && (
          ventaActual ? (
            <PagoQR
              venta={ventaActual}
              alVolver={() => irA('seleccion-asientos')}
              alVerBoletos={() => irA('mis-boletos')}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="mb-4 text-slate-400">No hay ninguna venta activa para pagar.</p>
              <button 
                onClick={() => irA('cartelera')}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
              >
                Ir a la Cartelera
              </button>
            </div>
          )
        )}

        {paginaActual === 'mis-boletos' && (
          <MisBoletos alAbrirLogin={() => setModalLoginAbierto(true)} />
        )}

        {paginaActual === 'cursos' && (
          <Cursos
            alAbrirLogin={() => setModalLoginAbierto(true)}
            alIrAMisEstudiantes={() => irA('mis-estudiantes')}
          />
        )}

        {paginaActual === 'mis-estudiantes' && (
          <MisEstudiantes
            alAbrirLogin={() => setModalLoginAbierto(true)}
            alIrACursos={() => irA('cursos')}
          />
        )}

        {paginaActual === 'escaner' && (
          <EscanerPuerta alAbrirLogin={() => setModalLoginAbierto(true)} />
        )}

        {paginaActual === 'admin' && (
          <AdminDashboard alAbrirLogin={() => setModalLoginAbierto(true)} />
        )}

        {paginaActual === 'nosotros' && <Nosotros />}
      </main>

      <Footer alCambiarPagina={irA} />

      <ModalLogin
        abierto={modalLoginAbierto}
        alCerrar={() => setModalLoginAbierto(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}