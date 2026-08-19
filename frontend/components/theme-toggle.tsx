"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("contractiq-theme");
    const nextTheme = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    window.requestAnimationFrame(() => {
      setTheme(nextTheme);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (hydrated) window.localStorage.setItem("contractiq-theme", theme);
  }, [theme, hydrated]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true" className="text-sm">{isDark ? "☀" : "☾"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
