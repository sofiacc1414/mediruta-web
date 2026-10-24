import { useContext } from 'react';
import { TemaContext } from './temaContext';

export function useTema() {
  const context = useContext(TemaContext);
  if (!context) {
    throw new Error('useTema debe usarse dentro de un <TemaProvider>.');
  }
  return context;
}
