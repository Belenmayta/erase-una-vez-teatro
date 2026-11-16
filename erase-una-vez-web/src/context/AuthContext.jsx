import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, guardarSesion, eliminarSesion, obtenerUsuarioLocal } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(obtenerUsuarioLocal());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function verificar() {
      const uLocal = obtenerUsuarioLocal();
      if (uLocal) {
        try {
          const perfil = await api.obtenerPerfil();
          setUsuario(perfil);
          guardarSesion(localStorage.getItem('token_teatro'), perfil);
        } catch {
          eliminarSesion();
          setUsuario(null);
        }
      }
      setCargando(false);
    }
    verificar();
  }, []);

  const login = async (correo, contrasena) => {
    const res = await api.login(correo, contrasena);
    guardarSesion(res.token, res.usuario);
    setUsuario(res.usuario);
    return res.usuario;
  };

  const registro = async (datos) => {
    const res = await api.registro(datos);
    // Login automático tras registro
    return await login(datos.correo, datos.contrasena);
  };

  const logout = () => {
    eliminarSesion();
    setUsuario(null);
  };

  // Ayudante de inicio rápido de demostración
  const loginDemo = async (rol) => {
    if (rol === 'ADMINISTRADOR') {
      try {
        return await login('jaqueline@teatro.com', 'teatro123');
      } catch {
        return await login('jaqueline@teatro.com', 'Admin1234!');
      }
    } else if (rol === 'RECEPCION') {
      try {
        return await login('recepcion@teatro.com', 'recepcion123');
      } catch {
        return await login('recepcion@teatro.com', 'Recepcion123!');
      }
    } else {
      try {
        return await login('maria@comprador.com', 'comprador123');
      } catch {
        return await login('maria@comprador.com', 'Comprador123!');
      }
    }
  };

  const esAdmin = usuario?.rol === 'ADMINISTRADOR';
  const esDocente = usuario?.rol === 'DOCENTE';
  const esRecepcion = usuario?.rol === 'RECEPCION';
  const esComprador = usuario?.rol === 'COMPRADOR';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        login,
        registro,
        logout,
        loginDemo,
        esAdmin,
        esDocente,
        esRecepcion,
        esComprador,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
