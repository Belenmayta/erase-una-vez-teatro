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
    if (res.requiere_mfa) {
      return res;
    }
    if (res.token && res.usuario) {
      guardarSesion(res.token, res.usuario);
      setUsuario(res.usuario);
    }
    return res;
  };

  const confirmarMfa = async (mfa_token, codigo_mfa) => {
    const res = await api.verificarMfa(mfa_token, codigo_mfa);
    guardarSesion(res.token, res.usuario);
    setUsuario(res.usuario);
    return res.usuario;
  };

  const registro = async (datos) => {
    const res = await api.registro(datos);
    if (res.token && res.usuario) {
      guardarSesion(res.token, res.usuario);
      setUsuario(res.usuario);
      return res.usuario;
    }
    return res;
  };

  const logout = () => {
    eliminarSesion();
    setUsuario(null);
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
        confirmarMfa,
        registro,
        logout,
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
