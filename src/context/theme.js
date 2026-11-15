import { createContext, useContext } from "react";

export const ThemeContext = createContext(undefined);

const THEMES = ["light", "dark"];

// Saved choice first, then the OS preference, then light
export const getInitialTheme = () => {
    if (typeof window === "undefined") return "light";
    const fromDom = document.documentElement.getAttribute("data-theme");
    if (THEMES.includes(fromDom)) return fromDom;
    try {
        const saved = localStorage.getItem("theme");
        if (THEMES.includes(saved)) return saved;
    } catch {
        // storage unavailable
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider. Ensure your App component wraps Header in <ThemeProvider>.");
    }
    return context;
};
