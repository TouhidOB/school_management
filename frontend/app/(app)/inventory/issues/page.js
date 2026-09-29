"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, TextField, MenuItem, Paper, Alert, Snackbar } from "@mui/material";
import { api } from "@/lib/api";

export default function InventoryIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [items, setItems] = useState([]);
  
  const [itemId, setItemId] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [quantity, setQuantity] = useState(1);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const issuesRes = await api.get("/inventory/issues/");
      setIssues(issuesRes.data.results || issuesRes.data);
      const itemsRes = await api.get("/inventory/items/");
      setItems(itemsRes.data.results || itemsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      await api.post("/inventory/issues/", {
        item: itemId,
        issued_to: issuedTo,
        quantity: quantity
      });
      setSuccess("Item issued successfully!");
      setItemId("");
      setIssuedTo("");
      setQuantity(1);
      loadData();
    } catch (err) {
      setError(err.response?.data?.quantity?.[0] || err.response?.data?.detail || "Failed to issue item");
    }
  };

  const handleReturn = async (id) => {
    try {
      await api.post(`/inventory/issues/${id}/return_item/`);
      setSuccess("Item marked as returned");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to return item");
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Inventory Issues & Returns
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Issue Item</Typography>
        <form onSubmit={handleIssue} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <TextField
            select
            label="Item"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            required
            fullWidth
            size="small"
          >
            {items.map((it) => (
              <MenuItem key={it.id} value={it.id} disabled={it.available_quantity < 1}>
                {it.name} ({it.available_quantity} available)
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Issued To (e.g. Science Lab)"
            value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Quantity"
            type="number"
            inputProps={{ min: 1 }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            size="small"
          />
          <Button type="submit" variant="contained">Issue</Button>
        </form>
      </Paper>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Issued To</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Issue Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {issues.map(iss => (
            <TableRow key={iss.id}>
              <TableCell>{iss.item_name}</TableCell>
              <TableCell>{iss.issued_to}</TableCell>
              <TableCell>{iss.quantity}</TableCell>
              <TableCell>{iss.issue_date}</TableCell>
              <TableCell>
                <Chip 
                  label={iss.status.toUpperCase()} 
                  color={iss.status === "issued" ? "warning" : "success"}
                  size="small" 
                />
              </TableCell>
              <TableCell>
                {iss.status === "issued" && (
                  <Button size="small" variant="outlined" color="primary" onClick={() => handleReturn(iss.id)}>
                    Return
                  </Button>
                )}
                {iss.status === "returned" && iss.return_date && (
                  <Typography variant="caption">Returned: {iss.return_date}</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
          {issues.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">No items issued yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
        <Alert severity="error" onClose={() => setError("")}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")}>
        <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
