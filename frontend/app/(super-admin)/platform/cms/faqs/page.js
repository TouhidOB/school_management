"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { api } from "@/lib/api";

export default function FAQsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await api.get("/platform/cms/faqs/");
      setFaqs(res.results || res);
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
            Frequently Asked Questions (FAQs)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage FAQs for the public website.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add FAQ
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {faqs.map((faq) => (
                <TableRow key={faq.id} hover>
                  <TableCell fontWeight="500">{faq.question}</TableCell>
                  <TableCell>{faq.category_name || "General"}</TableCell>
                  <TableCell>{faq.order}</TableCell>
                  <TableCell>
                    <Chip 
                      label={faq.is_active ? "Active" : "Hidden"} 
                      color={faq.is_active ? "success" : "default"} 
                      size="small" 
                    />
                  </TableCell>
                </TableRow>
              ))}
              {faqs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    No FAQs found.
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
