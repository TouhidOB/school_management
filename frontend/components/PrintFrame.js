"use client";

// Wrapper for standalone print documents (ID card, receipt, certificate…).
// Shows a toolbar (Print / Back) that is hidden when actually printing, and
// centers the document on a neutral backdrop on screen.
import { Box, Button, Typography } from "@mui/material";
import PrintIcon from '@mui/icons-material/Print';

export default function PrintFrame({ children, title }) {
  
  return (
    <Box className="print-frame" sx={{
      '@media screen': {
        backgroundColor: '#f4f6f8',
        minHeight: '100vh',
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      },
      '@media print': {
        backgroundColor: '#fff',
        p: 0
      }
    }}>
      <style>{`
        @media print {
          .print-toolbar { display: none !important; }
          .print-doc { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <Box 
        className="print-toolbar" 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%',
          maxWidth: 800,
          mb: 4,
          backgroundColor: '#fff',
          p: 2,
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ width: 80 }} /> {/* Spacer to keep title centered */}
        <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
          {title}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="small" 
          onClick={() => window.print()} 
          startIcon={<PrintIcon />}
        >
          Print
        </Button>
      </Box>

      {children}
    </Box>
  );
}
