"use client";

// Teacher detail: profile + rating summary.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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
  CircularProgress,
  Alert
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BadgeIcon from "@mui/icons-material/Badge";

const DIMS = [
  ["score_teaching_quality", "Teaching quality"],
  ["score_punctuality", "Punctuality"],
  ["score_helpfulness", "Helpfulness"],
  ["score_assignment_feedback", "Assignment feedback"],
  ["score_communication", "Communication"],
  ["score_overall", "Overall"],
];

export default function TeacherDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, enterTeacher } = useAuth();
  const [t, setT] = useState(null);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    api.get(`/teachers/${id}/`).then(setT).catch(() => {});
    api.get(`/teacher-ratings/?teacher=${id}&page_size=500`).then((d) => setRatings(d.results || d)).catch(() => {});
  }, [id]);

  if (!t) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  const n = ratings.length;
  const avg = (key) => (n ? (ratings.reduce((s, r) => s + (r[key] || 0), 0) / n).toFixed(2) : "—");

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button 
            component={Link} 
            href="/teachers" 
            startIcon={<ArrowBackIcon />} 
            sx={{ mb: 1, color: 'text.secondary', textTransform: 'none' }}
          >
            Teachers
          </Button>
          <Typography variant="h5" fontWeight="bold">{t.display_name || t.first_name || "Teacher"}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<BadgeIcon />}
            component="a"
            href={`/print/teacher/${t.id}/id-card`}
            target="_blank"
            rel="noreferrer"
            sx={{ textTransform: 'none' }}
          >
            Print ID Card
          </Button>
          {(user?.role === 'super_admin' || user?.role === 'school_admin' || user?.is_super_admin) && (
            <Button 
              onClick={() => {
                enterTeacher(t.id);
                router.push('/dashboard');
              }}
              variant="contained" 
              color="secondary"
              startIcon={<DashboardIcon />}
              sx={{ textTransform: 'none' }}
            >
              Access Teacher Panel
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Profile</Typography>
              <Table size="small">
                <TableBody>
                  <TableRow><TableCell variant="head">Employee ID</TableCell><TableCell>{t.employee_id || "—"}</TableCell></TableRow>
                  <TableRow><TableCell variant="head">Designation</TableCell><TableCell>{t.designation_name || "—"}</TableCell></TableRow>
                  <TableRow><TableCell variant="head">Email</TableCell><TableCell>{t.email || "—"}</TableCell></TableRow>
                  <TableRow><TableCell variant="head">Phone</TableCell><TableCell>{t.phone || "—"}</TableCell></TableRow>
                  <TableRow><TableCell variant="head">Contract</TableCell><TableCell sx={{ textTransform: 'capitalize' }}>{(t.contract_type || "").replace("_", " ")}</TableCell></TableRow>
                  <TableRow><TableCell variant="head">Joined</TableCell><TableCell>{t.joining_date || "—"}</TableCell></TableRow>
                  <TableRow><TableCell variant="head">Status</TableCell><TableCell sx={{ textTransform: 'capitalize' }}>{t.status}</TableCell></TableRow>
                  <TableRow><TableCell variant="head">Subjects</TableCell><TableCell>{(t.subjects || []).length}</TableCell></TableRow>
                  <TableRow><TableCell variant="head">Sections</TableCell><TableCell>{(t.sections || []).length}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Rating summary <Typography component="span" variant="body2" color="text.secondary">({n} ratings)</Typography>
              </Typography>
              {n < 5 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Ratings stay private until 5 are received ({n}/5).
                </Alert>
              )}
              <Table size="small">
                <TableBody>
                  {DIMS.map(([k, label]) => (
                    <TableRow key={k}>
                      <TableCell>{label}</TableCell>
                      <TableCell align="right" sx={{ width: 80, fontWeight: 'medium' }}>{avg(k)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
