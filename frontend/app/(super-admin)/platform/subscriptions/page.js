"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton
} from "@mui/material";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get("/platform/billing/subscriptions/");
      setSubscriptions(res.results || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      "active": "success",
      "past_due": "warning",
      "canceled": "error",
      "unpaid": "error",
    };
    return map[status] || "default";
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a' }}>
            Subscriptions
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage active school subscriptions.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/platform/subscriptions/new')}
        >
          Add Subscription
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>School</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Cycle</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Renewal Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell fontWeight="500">{sub.school_name}</TableCell>
                  <TableCell>{sub.plan_name}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{sub.billing_cycle}</TableCell>
                  <TableCell>{sub.price} BDT</TableCell>
                  <TableCell>{sub.renewal_date ? new Date(sub.renewal_date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={sub.status} 
                      color={getStatusColor(sub.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => router.push(`/platform/subscriptions/${sub.id}`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {subscriptions.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
