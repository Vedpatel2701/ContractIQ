"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
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
      className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
    >
      <span aria-hidden="true" className="text-sm">{isDark ? "☀" : "☾"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
