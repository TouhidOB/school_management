"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Divider,
  CircularProgress
} from "@mui/material";

export default function AdmissionSlipPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [fees, setFees] = useState([]);

  useEffect(() => {
    api.get(`/students/${id}/`).then((st) => {
      setStudent(st);
      api.get("/fee-structures/?page_size=500").then((d) => {
        const rows = d.results || d;
        setFees(rows.filter((f) => !f.applicable_class || String(f.applicable_class) === String(st.current_class)));
      }).catch(() => {});
    }).catch(() => {});
    api.get("/school/").then(setSchool).catch(() => {});
  }, [id]);

  if (!student) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, height: '100vh', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const color = school?.primary_color || "#2563eb";
  const total = fees.reduce((t, f) => t + Number(f.amount || 0), 0);

  const InfoRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', mb: 1, pb: 0.5, borderBottom: '1px dashed #e2e8f0' }}>
      <Typography variant="body2" sx={{ width: '40%', fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>
        {value || "—"}
      </Typography>
    </Box>
  );

  return (
    <PrintFrame title="Admission Slip">
      <Paper 
        className="print-doc" 
        elevation={3}
        sx={{ 
          width: '100%', 
          maxWidth: 800, 
          minHeight: 1000,
          p: { xs: 4, md: 6 }, 
          bgcolor: 'white',
          mx: 'auto'
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color }}>
            {school?.name || "School"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {school?.address} {school?.phone && `• Ph: ${school.phone}`}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 1 }}>
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              sx={{ 
                letterSpacing: 2, 
                borderBottom: `2px solid ${color}`,
                pb: 1,
                px: 3,
                display: 'inline-block'
              }}
            >
              OFFICIAL ADMISSION SLIP
            </Typography>
          </Box>
        </Box>

        {/* Student Details */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary', borderLeft: `4px solid ${color}`, pl: 1.5 }}>
          Student Information
        </Typography>
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <InfoRow label="Student Name" value={student.full_name} />
            <InfoRow label="Admission No" value={student.admission_number} />
            <InfoRow label="Class" value={student.class_name} />
            <InfoRow label="Section" value={student.section_name} />
            <InfoRow label="Roll Number" value={student.roll_number} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <InfoRow label="Gender" value={<span style={{ textTransform: 'capitalize' }}>{student.gender}</span>} />
            <InfoRow label="Date of Birth" value={student.dob} />
            <InfoRow label="Admission Date" value={student.admission_date} />
            <InfoRow label="Emergency Contact" value={student.emergency_contact} />
            <InfoRow label="Status" value={<span style={{ textTransform: 'capitalize' }}>{student.status || 'Active'}</span>} />
          </Grid>
        </Grid>

        {/* Guardian Details */}
        {(student.guardians || []).length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary', borderLeft: `4px solid ${color}`, pl: 1.5 }}>
              Guardian Details
            </Typography>
            <TableContainer variant="outlined" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Relation</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contact Phone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {student.guardians.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{g.relation}</TableCell>
                      <TableCell>{g.name}</TableCell>
                      <TableCell>{g.phone || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Fee Schedule */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.primary', borderLeft: `4px solid ${color}`, pl: 1.5 }}>
            Fee Assessment Schedule
          </Typography>
          <TableContainer variant="outlined" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fee Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                      No initial fee structures configured for this class.
                    </TableCell>
                  </TableRow>
                ) : (
                  fees.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        {f.fee_type_name}
                        {!f.class_name && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>(All Classes)</Typography>}
                      </TableCell>
                      <TableCell align="right">
                        {school?.currency === 'BDT' || !school?.currency ? '৳' : school.currency}{parseFloat(f.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', borderTop: '2px solid #e2e8f0' }}>Total Admission Fee</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', borderTop: '2px solid #e2e8f0' }}>
                    {school?.currency === 'BDT' || !school?.currency ? '৳' : school.currency}{total.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
        </Box>

        {/* Signatures */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 8, pt: 4 }}>
          <Box sx={{ width: 250, textAlign: 'center' }}>
            <Divider sx={{ mb: 1, borderColor: 'text.primary' }} />
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Guardian Signature & Date
            </Typography>
          </Box>
          <Box sx={{ width: 250, textAlign: 'center' }}>
            <Divider sx={{ mb: 1, borderColor: 'text.primary' }} />
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Authorized Principal / Registrar
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
              Official Seal Required
            </Typography>
          </Box>
        </Box>
        
        {/* Footer */}
        <Box sx={{ mt: 8, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
          <Typography variant="caption" color="text.disabled">
            Generated by Multi-Vendor School Management System • {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </PrintFrame>
  );
}
