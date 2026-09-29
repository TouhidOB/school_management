"use client";
import { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { api } from "@/lib/api";

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await api.get("/platform/cms/testimonials/");
      setTestimonials(res.results || res);
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
            Testimonials
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage customer testimonials for the public website.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
        >
          Add Testimonial
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Author</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {testimonials.map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell fontWeight="500">{test.author}</TableCell>
                  <TableCell>{test.role}</TableCell>
                  <TableCell>{test.school}</TableCell>
                  <TableCell>{test.rating} / 5</TableCell>
                  <TableCell>
                    <Chip 
                      label={test.is_active ? "Active" : "Hidden"} 
                      color={test.is_active ? "success" : "default"} 
                      size="small" 
                    />
                  </TableCell>
                </TableRow>
              ))}
              {testimonials.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No testimonials found.
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
