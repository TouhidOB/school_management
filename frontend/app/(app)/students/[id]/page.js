"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BadgeIcon from "@mui/icons-material/Badge";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PrintIcon from "@mui/icons-material/Print";
import DashboardIcon from "@mui/icons-material/Dashboard";

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, enterStudent } = useAuth();
  const [student, setStudent] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [results, setResults] = useState([]);
  const [gForm, setGForm] = useState({ relation: "father", name: "", phone: "", email: "" });
  const [showG, setShowG] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  function loadStudent() {
    api.get(`/students/${id}/`).then(setStudent).catch(() => {});
  }
  useEffect(() => {
    loadStudent();
    api.get(`/invoices/?student=${id}&page_size=100`).then((d) => setInvoices(d.results || d)).catch(() => {});
    api.get(`/exam-results/?student=${id}&page_size=100`).then((d) => setResults(d.results || d)).catch(() => {});
  }, [id]);

  async function addGuardian(e) {
    e.preventDefault();
    await api.post("/guardians/", { ...gForm, student: Number(id) });
    setGForm({ relation: "father", name: "", phone: "", email: "" });
    setShowG(false);
    loadStudent();
  }

  if (!student) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const TABS = ["Overview", "Academic", "Attendance", "Results", "Fees", "Homework", "Documents", "Guardians", "Activity"];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button 
            component={Link} 
            href="/students" 
            startIcon={<ArrowBackIcon />} 
            sx={{ mb: 1, color: 'text.secondary', textTransform: 'none' }}
          >
            Students
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
            <Avatar src={student.photo} sx={{ width: 80, height: 80, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {!student.photo && <PersonIcon sx={{ fontSize: 40, color: 'text.secondary' }} />}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {student.full_name}
                <Chip label={student.status} size="small" color={student.status === 'active' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admission #: {student.admission_number} | Class: {student.class_name || "—"} | Section: {student.section_name || "—"}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(user?.role === 'super_admin' || user?.role === 'school_admin' || user?.is_super_admin) && (
            <Button 
              onClick={() => {
                enterStudent(student.id);
                router.push('/dashboard');
              }}
              variant="contained" 
              color="info"
              startIcon={<DashboardIcon />}
              sx={{ textTransform: 'none' }}
            >
              Access Student Panel
            </Button>
          )}
          <Button 
            component="a" 
            href={`/print/student/${id}/id-card`} 
            target="_blank" 
            rel="noreferrer" 
            variant="outlined"
            startIcon={<BadgeIcon />}
          >
            ID card
          </Button>
          <Button 
            component="a" 
            href={`/print/student/${id}/admission-slip`} 
            target="_blank" 
            rel="noreferrer" 
            variant="outlined"
            startIcon={<DescriptionIcon />}
          >
            Admission slip
          </Button>
          <Button 
            component={Link} 
            href={`/students/${id}/edit`} 
            variant="contained"
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          {TABS.map((label, idx) => (
            <Tab key={idx} label={label} sx={{ textTransform: 'none', fontWeight: 500 }} />
          ))}
        </Tabs>
      </Box>

      {/* OVERVIEW TAB */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Personal Profile</Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow><TableCell variant="head" sx={{ width: '40%' }}>Gender</TableCell><TableCell sx={{ textTransform: 'capitalize' }}>{student.gender || "—"}</TableCell></TableRow>
                    <TableRow><TableCell variant="head">DOB</TableCell><TableCell>{student.dob || "—"}</TableCell></TableRow>
                    <TableRow><TableCell variant="head">Blood</TableCell><TableCell>{student.blood_group || "—"}</TableCell></TableRow>
                    <TableRow><TableCell variant="head">Phone</TableCell><TableCell>{student.emergency_contact || "—"}</TableCell></TableRow>
                    <TableRow><TableCell variant="head">Address</TableCell><TableCell>{student.address || "—"}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={8}>
             <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">Select tabs above to explore other details.</Typography>
                </CardContent>
             </Card>
          </Grid>
        </Grid>
      )}

      {/* GUARDIANS TAB */}
      {activeTab === 7 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Guardians</Typography>
              <Button 
                size="small" 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => setShowG((s) => !s)}
              >
                Add Guardian
              </Button>
            </Box>
            
            {showG && (
              <Box component="form" onSubmit={addGuardian} sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} md={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Relation"
                      value={gForm.relation}
                      onChange={(e) => setGForm({ ...gForm, relation: e.target.value })}
                    >
                      <MenuItem value="father">Father</MenuItem>
                      <MenuItem value="mother">Mother</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" label="Name" value={gForm.name} onChange={(e) => setGForm({ ...gForm, name: e.target.value })} required />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" label="Phone" value={gForm.phone} onChange={(e) => setGForm({ ...gForm, phone: e.target.value })} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button type="submit" variant="contained" fullWidth>Save</Button>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {(student.guardians || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No guardians recorded.</Typography>
            ) : (
              <List disablePadding>
                {student.guardians.map((g, index) => (
                  <Box key={g.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography component="span" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>{g.relation}:</Typography>
                            {g.name}
                            {g.is_primary_contact && <Chip label="primary" size="small" variant="outlined" />}
                          </Box>
                        }
                        secondary={g.phone}
                      />
                    </ListItem>
                    {index < student.guardians.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {/* FEES TAB */}
      {activeTab === 4 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Invoices</Typography>
            {invoices.length === 0 ? (
              <Typography variant="body2" color="text.secondary">None.</Typography>
            ) : (
              <Table size="small">
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{inv.invoice_number}</Typography></TableCell>
                      <TableCell>৳{inv.grand_total}</TableCell>
                      <TableCell><Chip label={inv.status_display || inv.status} size="small" variant="outlined" /></TableCell>
                      <TableCell align="right">
                        <IconButton component="a" href={`/print/invoice/${inv.id}/receipt`} target="_blank" rel="noreferrer" size="small" color="primary">
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* RESULTS TAB */}
      {activeTab === 3 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Exam Results</Typography>
            {results.length === 0 ? (
              <Typography variant="body2" color="text.secondary">None.</Typography>
            ) : (
              <Table size="small">
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>Subject #{r.exam_subject}</TableCell>
                      <TableCell>{r.marks_obtained}</TableCell>
                      <TableCell>{r.grade || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* OTHER TABS */}
      {[1, 2, 5, 6, 8].includes(activeTab) && (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
          <Typography color="text.secondary">Module content for {TABS[activeTab]} goes here.</Typography>
        </Box>
      )}
    </Box>
  );
}
