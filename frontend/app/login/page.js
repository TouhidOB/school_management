"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Link as MuiLink } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(username, password);
      // Super Admin has no home school — land them on the platform console to
      // pick a tenant. Everyone else goes straight to their dashboard.
      router.push(u.is_super_admin ? "/platform" : "/dashboard");
    } catch (err) {
      setError(err.status === 401 ? "Invalid username or password." : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card elevation={2} sx={{ width: '100%', maxWidth: 400, border: 'none', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" component="h1" fontWeight="bold">
              School Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your dashboard
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={onSubmit}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={busy}
            >
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <MuiLink component={Link} href="/admissions" variant="body2" underline="hover">
              Looking to apply? Browse admissions &rarr;
            </MuiLink>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
