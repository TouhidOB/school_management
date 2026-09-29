"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Divider } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function FinanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    outstandingInvoices: 0,
    totalInvoices: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        api.get("/payments/?page_size=1000"),
        api.get("/invoices/?page_size=1000")
      ]);

      const payments = paymentsRes.results || paymentsRes;
      const invoices = invoicesRes.results || invoicesRes;

      let revenue = 0;
      payments.forEach(p => {
        if (p.status === "successful" || p.status === "completed" || !p.status) {
           revenue += (parseFloat(p.amount) || 0);
        }
      });

      let outstanding = 0;
      invoices.forEach(inv => {
        if (inv.status !== "paid" && inv.status !== "cancelled") {
          outstanding++;
        }
      });

      setMetrics({
        totalRevenue: revenue,
        outstandingInvoices: outstanding,
        totalInvoices: invoices.length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
        Financial Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="success.dark" fontWeight="medium">Total Revenue Collected</Typography>
              <Typography variant="h3" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'warning.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="warning.dark" fontWeight="medium">Outstanding Invoices</Typography>
              <Typography variant="h3" color="warning.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.outstandingInvoices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50', height: '100%' }}>
            <CardContent>
              <Typography variant="body2" color="primary.dark" fontWeight="medium">Total Invoices Issued</Typography>
              <Typography variant="h3" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 36 }} /> {metrics.totalInvoices}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
