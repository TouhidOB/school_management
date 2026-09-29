// frontend/components/LanguageToggle.js
"use client";

import React from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageToggle({ sx = {}, size = "medium" }) {
  const { lang, setLang, toggleLang, isBangla } = useLanguage();

  const isSmall = size === "small";

  return (
    <Tooltip title={isBangla ? "Switch to English" : "বাংলা ভাষায় পরিবর্তন করুন"} arrow>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "#f1f5f9"),
          borderRadius: "20px",
          p: "3px",
          border: "1px solid",
          borderColor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "#e2e8f0"),
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "#cbd5e1",
          },
          ...sx,
        }}
      >
        <Box
          onClick={() => setLang("en")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: isSmall ? 1 : 1.25,
            py: isSmall ? 0.25 : 0.4,
            borderRadius: "16px",
            bgcolor: !isBangla ? "#2563eb" : "transparent",
            color: !isBangla ? "#ffffff" : "#64748b",
            fontWeight: !isBangla ? 700 : 500,
            fontSize: isSmall ? "0.75rem" : "0.8rem",
            transition: "all 0.2s ease",
            boxShadow: !isBangla ? "0 2px 6px rgba(37,99,235,0.3)" : "none",
            "&:hover": {
              color: !isBangla ? "#ffffff" : "#0f172a",
            },
          }}
        >
          <TranslateIcon sx={{ fontSize: isSmall ? 13 : 15, opacity: !isBangla ? 1 : 0.7 }} />
          <span>EN</span>
        </Box>

        <Box
          onClick={() => setLang("bn")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: isSmall ? 1 : 1.25,
            py: isSmall ? 0.25 : 0.4,
            borderRadius: "16px",
            bgcolor: isBangla ? "#2563eb" : "transparent",
            color: isBangla ? "#ffffff" : "#64748b",
            fontWeight: isBangla ? 700 : 500,
            fontSize: isSmall ? "0.75rem" : "0.8rem",
            transition: "all 0.2s ease",
            boxShadow: isBangla ? "0 2px 6px rgba(37,99,235,0.3)" : "none",
            "&:hover": {
              color: isBangla ? "#ffffff" : "#0f172a",
            },
          }}
        >
          <span>বাংলা</span>
        </Box>
      </Box>
    </Tooltip>
  );
}
