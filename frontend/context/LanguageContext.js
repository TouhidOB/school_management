// frontend/context/LanguageContext.js
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "@/lib/translations";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
  t: (path, fallback) => fallback || path,
  isBangla: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sms_lang");
      if (stored === "en" || stored === "bn") {
        setLangState(stored);
        document.documentElement.lang = stored;
      }
    } catch (e) {
      console.warn("Could not read language from localStorage", e);
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang) => {
    if (newLang !== "en" && newLang !== "bn") return;
    setLangState(newLang);
    try {
      localStorage.setItem("sms_lang", newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      console.warn("Could not write language to localStorage", e);
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "bn" : "en");
  }, [lang, setLang]);

  const t = useCallback((path, fallback) => {
    if (!path) return fallback || "";
    const keys = path.split(".");
    
    // Try in current language
    let curr = translations[lang];
    for (const k of keys) {
      if (!curr || typeof curr !== "object") {
        curr = undefined;
        break;
      }
      curr = curr[k];
    }
    if (curr !== undefined && typeof curr === "string") {
      return curr;
    }

    // Fallback to English
    if (lang !== "en") {
      let enCurr = translations["en"];
      for (const k of keys) {
        if (!enCurr || typeof enCurr !== "object") {
          enCurr = undefined;
          break;
        }
        enCurr = enCurr[k];
      }
      if (enCurr !== undefined && typeof enCurr === "string") {
        return enCurr;
      }
    }

    return fallback !== undefined ? fallback : path;
  }, [lang]);

  const isBangla = lang === "bn";

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, isBangla, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
