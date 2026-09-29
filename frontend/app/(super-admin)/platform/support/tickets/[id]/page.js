"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid, MenuItem, CircularProgress, Divider } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function TicketDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("open");

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/platform/support/tickets/${id}/`);
      setTicket(res);
      setStatus(res.status);
    } catch (err) {
      console.error(err);
      alert("Failed to load ticket");
      router.push('/platform/support/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await api.patch(`/platform/support/tickets/${id}/`, { status });
      alert("Status updated");
      router.push('/platform/support/tickets');
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  if (loading) return <CircularProgress />;
  if (!ticket) return <Typography>No ticket found.</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Ticket #{ticket.id}: {ticket.subject}
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/platform/support/tickets')}>
          Back to Tickets
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Ticket Details</Typography>
            <Typography><strong>School:</strong> {ticket.school_name}</Typography>
            <Typography><strong>Created By:</strong> {ticket.created_by_name}</Typography>
            <Typography><strong>Priority:</strong> <span style={{ textTransform: 'capitalize' }}>{ticket.priority}</span></Typography>
            <Typography><strong>Created At:</strong> {new Date(ticket.created_at).toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Update Status</Typography>
            <TextField fullWidth select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ mb: 2 }}>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
            <Button variant="contained" fullWidth onClick={handleUpdateStatus}>
              Save Status
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
