import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: "system", setTheme: () => {} });

function apply(t: Theme) {
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme) || "system";
    setThemeState(t);
    apply(t);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => apply((localStorage.getItem("theme") as Theme) || "system");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  const setTheme = (t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
    apply(t);
  };
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
