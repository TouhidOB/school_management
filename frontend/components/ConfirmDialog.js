"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

/**
 * Bootstrap-style Delete / Danger Confirmation Modal
 */
export default function ConfirmDialog({
  open,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item?",
  subMessage = "This action cannot be undone. Any related records will be permanently removed.",
  itemName = "",
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  confirmColor = "error",
  loading = false,
  onConfirm,
  onClose
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden"
        }
      }}
    >
      {/* Bootstrap Modal Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#fef2f2",
          borderBottom: "1px solid #fee2e2"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626"
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#991b1b", fontSize: "1.05rem" }}>
            {title}
          </Typography>
        </Box>
        {!loading && (
          <IconButton size="small" onClick={onClose} sx={{ color: "#991b1b" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      {/* Bootstrap Modal Body */}
      <DialogContent sx={{ pt: 2.5, pb: 2, px: 3 }}>
        <Typography variant="body1" sx={{ color: "#1e293b", fontWeight: 500, mb: itemName ? 1.5 : 0.5 }}>
          {message}
        </Typography>

        {itemName && (
          <Box
            sx={{
              p: 1.5,
              mb: 1.5,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 1.5,
              fontWeight: 600,
              color: "#0f172a",
              fontSize: "0.9rem",
              wordBreak: "break-word"
            }}
          >
            {itemName}
          </Box>
        )}

        {subMessage && (
          <Typography variant="caption" sx={{ color: "#64748b", display: "block", lineHeight: 1.5 }}>
            {subMessage}
          </Typography>
        )}
      </DialogContent>

      {/* Bootstrap Modal Footer */}
      <DialogActions
        sx={{
          px: 3,
          py: 1.75,
          bgcolor: "#f8fafc",
          borderTop: "1px solid #f1f5f9",
          gap: 1
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 1.5,
            borderColor: "#cbd5e1",
            color: "#475569",
            "&:hover": { bgcolor: "#f1f5f9", borderColor: "#94a3b8" }
          }}
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon fontSize="small" />}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            borderRadius: 1.5,
            px: 2.2,
            boxShadow: "none"
          }}
        >
          {loading ? "Deleting..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
