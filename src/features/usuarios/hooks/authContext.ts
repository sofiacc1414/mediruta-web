import { createContext } from 'react';
import type { Usuario } from '../api/auth.api';

export type AuthEstado =
  | { tipo: 'cargando' }
  | { tipo: 'autenticado'; usuario: Usuario; accessToken: string }
  | { tipo: 'anonimo'; error?: string };

export type AuthContextValue = {
  estado: AuthEstado;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
