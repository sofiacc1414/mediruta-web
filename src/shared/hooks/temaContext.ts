import { createContext } from 'react';

export type TemaContextValue = {
  oscuro: boolean;
  alternar: () => void;
};

export const TemaContext = createContext<TemaContextValue | null>(null);
