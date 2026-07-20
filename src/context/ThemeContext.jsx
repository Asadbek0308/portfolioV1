import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
    // Initial state reads from localStorage if in a browser environment, otherwise defaults to "light"
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") || "light";
        }
        return "light";
    });

    // Automatically sync state changes to localStorage and the document's data-theme attribute
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", theme);
            document.documentElement.setAttribute("data-theme", theme);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider. Ensure your App component wraps Header in <ThemeProvider>.");
    }
    return context;
};