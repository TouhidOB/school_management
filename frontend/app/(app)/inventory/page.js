"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Divider, Avatar } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HandshakeIcon from "@mui/icons-material/Handshake";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

export default function InventoryOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalItems: 0,
    totalStock: 0,
    lowStockCount: 0,
    activeSuppliers: 0,
    itemsIssued: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, suppliersRes, issuesRes] = await Promise.all([
        api.get("/inventory/items/?page_size=1000"),
        api.get("/inventory/suppliers/?page_size=500"),
        api.get("/inventory/issues/?status=issued&page_size=1000")
      ]);

      const items = itemsRes.results || itemsRes;
      const suppliers = suppliersRes.results || suppliersRes;
      const issues = issuesRes.results || issuesRes;

      let stock = 0;
      let lowStock = 0;
      
      items.forEach(i => {
        stock += (parseInt(i.available_quantity) || 0);
        if (i.available_quantity > 0 && i.available_quantity <= 5) {
          lowStock++;
        } else if (i.available_quantity === 0) {
          lowStock++;
        }
      });

      let issuedQty = 0;
      issues.forEach(iss => {
        issuedQty += (parseInt(iss.quantity) || 0);
      });

      setMetrics({
        totalItems: items.length,
        totalStock: stock,
        lowStockCount: lowStock,
        activeSuppliers: suppliers.length,
        itemsIssued: issuedQty
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
        Inventory & Assets Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="body2" color="primary.dark" fontWeight="medium">Total Item Types</Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <InventoryIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalItems}
              </Typography>
              <Typography variant="caption" color="text.secondary">Unique items tracked</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="body2" color="success.dark" fontWeight="medium">In Stock Volume</Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <AssignmentTurnedInIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalStock}
              </Typography>
              <Typography variant="caption" color="text.secondary">Available items on hand</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'error.50' }}>
            <CardContent>
              <Typography variant="body2" color="error.dark" fontWeight="medium">Low/Out of Stock</Typography>
              <Typography variant="h4" color="error.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <WarningAmberIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.lowStockCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">Items needing restock</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'secondary.50' }}>
            <CardContent>
              <Typography variant="body2" color="secondary.dark" fontWeight="medium">Suppliers</Typography>
              <Typography variant="h4" color="secondary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <HandshakeIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.activeSuppliers}
              </Typography>
              <Typography variant="caption" color="text.secondary">Registered vendors</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
