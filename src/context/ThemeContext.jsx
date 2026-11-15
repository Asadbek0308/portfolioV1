import { useState, useEffect } from "react";
import { ThemeContext, getInitialTheme } from "./theme";

export default function ThemeProvider({ children }) {
    // index.html already applied the saved theme before first paint; this just mirrors it
    const [theme, setTheme] = useState(getInitialTheme);

    // Sync state changes to localStorage and the document's data-theme attribute
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem("theme", theme);
        } catch {
            // storage can be unavailable (private mode, blocked site data)
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
