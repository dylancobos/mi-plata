import { createContext, useContext } from "react";

export type Screen =
  | "inicio"
  | "deudas"
  | "gasto"
  | "bolsillos"
  | "mas"
  | "registro"
  | "proyeccion"
  | "antiimpulso"
  | "asistente"
  | "nube"
  | "ajustes";

export const NavContext = createContext<(s: Screen) => void>(() => {});

export function useNavigate() {
  return useContext(NavContext);
}
