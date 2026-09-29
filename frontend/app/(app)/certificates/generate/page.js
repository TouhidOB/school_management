"use client";

import { useState, useEffect } from "react";
import { Box, Card, CardContent, Typography, TextField, Button, Grid, MenuItem, Alert } from "@mui/material";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function GenerateCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  
  const [formData, setFormData] = useState({
    student: "",
    cert_type: "custom",
    title: "",
    reference_no: "",
    issue_date: new Date().toISOString().split('T')[0],
    body: "This is to certify that {student_name} has successfully completed their studies.",
    signatory_name: "",
    signatory_designation: ""
  });

  useEffect(() => {
    api.get("/students/?page_size=500")
      .then(res => setStudents(res.results || res))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/certificates/", formData);
      router.push("/certificates");
    } catch (err) {
      setError(err.data ? JSON.stringify(err.data) : "Failed to generate certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Issue New Certificate</Typography>
        <Typography variant="body2" color="text.secondary">
          Fill out the details below to generate and issue a certificate to a student. 
          You can use placeholders like {"{student_name}"}, {"{class}"}, or {"{date}"} in the body.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Student"
                  name="student"
                  value={formData.student}
                  onChange={handleChange}
                  required
                >
                  {students.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.full_name} ({s.admission_number})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Certificate Type"
                  name="cert_type"
                  value={formData.cert_type}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="custom">Custom Certificate</MenuItem>
                  <MenuItem value="testimonial">Testimonial</MenuItem>
                  <MenuItem value="transfer">Transfer Certificate</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Certificate Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Certificate of Achievement"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reference No."
                  name="reference_no"
                  value={formData.reference_no}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Issue Date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Certificate Body"
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  required
                  helperText="Use placeholders: {student_name}, {class}, {date}"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Signatory Name"
                  name="signatory_name"
                  value={formData.signatory_name}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Signatory Designation"
                  name="signatory_designation"
                  value={formData.signatory_designation}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate & Issue"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
