"use client";

import { useEffect } from "react";

export default function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem("theme") ?? "light";
    const root = document.documentElement;
    if (stored === "dark") {
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
    }
  }, []);

  return null;
}
