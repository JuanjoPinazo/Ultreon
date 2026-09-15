"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />;
  }

  return (
    <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 border border-slate-300 dark:border-slate-700">
      <button
        onClick={() => setTheme("light")}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          theme === "light"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-muted-foreground hover:text-slate-700 dark:hover:text-muted-foreground"
        }`}
      >
        Claro
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          theme === "system"
            ? "bg-white dark:bg-slate-600 text-foreground shadow-sm"
            : "text-muted-foreground hover:text-slate-700 dark:hover:text-muted-foreground"
        }`}
      >
        Sistema
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          theme === "dark"
            ? "bg-slate-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-slate-700 dark:hover:text-muted-foreground"
        }`}
      >
        Oscuro
      </button>
    </div>
  );
}
