"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton 
} from "@mui/material";
import { useRouter } from "next/navigation";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { api } from "@/lib/api";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/platform/billing/plans/");
      setPlans(res.results || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#0f172a' }}>
            Subscription Plans
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage pricing tiers and limits.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/platform/plans/new')}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add Plan
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Plan Name</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell>Monthly Price</TableCell>
                <TableCell>Yearly Price</TableCell>
                <TableCell>Student Limit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} hover>
                  <TableCell fontWeight="500">{plan.name}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{plan.tier}</TableCell>
                  <TableCell>{plan.currency} {plan.price_monthly}</TableCell>
                  <TableCell>{plan.currency} {plan.price_yearly}</TableCell>
                  <TableCell>{plan.student_limit || 'Unlimited'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={plan.is_active ? "Active" : "Inactive"} 
                      color={plan.is_active ? "success" : "default"} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => router.push(`/platform/plans/${plan.id}`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No plans found.
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
