import { Box, Typography, Grid, Card, CardContent, Divider, List, ListItem, ListItemText, ListItemIcon, Button, CircularProgress } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TimelineIcon from "@mui/icons-material/Timeline";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import TodayIcon from "@mui/icons-material/Today";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function StudentDashboard({ user, isPreview, targetStudentId }) {
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic state
  const [stats, setStats] = useState({
    attendance: 'N/A',
    gpa: 'N/A',
    pendingHomework: 0,
    upcomingExams: 0
  });
  const [schedule, setSchedule] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let studentId = null;
        let profile = null;

        if (isPreview && targetStudentId) {
          studentId = targetStudentId;
          profile = await api.get(`/students/${studentId}/`);
          setStudentProfile(profile);
        } else if (user?.role === 'student') {
          const res = await api.get(`/students/?page_size=500`);
          const rows = res.results || res;
          profile = rows.find(s => s.email === user.email) || rows[0]; 
          if (profile) studentId = profile.id;
          setStudentProfile(profile);
        }

        if (!studentId || !profile) {
          setLoading(false);
          return;
        }

        // Fetch routines
        let todaysRoutines = [];
        if (profile.current_section) {
          try {
            const routinesRes = await api.get(`/routine-slots/?section=${profile.current_section}&page_size=500`);
            const routines = routinesRes.results || routinesRes || [];
            const todayDayOfWeek = new Date().getDay(); 
            const djangoDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
            todaysRoutines = routines.filter(r => r.day_of_week === djangoDay);
          } catch (e) { console.error(e); }
        }

        const formattedSchedule = todaysRoutines.map(r => ({
          id: r.id,
          time: `${r.start_time.substring(0, 5)} - ${r.end_time.substring(0, 5)}`,
          sub: r.subject_name || 'Subject',
          teacher: r.teacher_name || 'Teacher',
          room: r.room_name || 'Classroom'
        })).sort((a, b) => a.time.localeCompare(b.time));
        setSchedule(formattedSchedule);

        // Fetch Real Attendance
        let attendancePct = 'N/A';
        try {
          const attRes = await api.get(`/student-attendance/?student=${studentId}&page_size=500`);
          const attRecords = attRes.results || attRes || [];
          if (attRecords.length > 0) {
             const present = attRecords.filter(r => r.status === 'present' || r.status === 'late').length;
             attendancePct = Math.round((present / attRecords.length) * 100);
          }
        } catch(e) { console.error(e); }

        setStats({
          attendance: attendancePct,
          gpa: 'N/A', 
          pendingHomework: 0,
          upcomingExams: 0
        });

        // Try to fetch Exam Results
        let perfData = [];
        try {
          const resRes = await api.get(`/exam-results/?student=${studentId}&page_size=100`);
          const results = resRes.results || resRes || [];
          if (results.length > 0) {
             const subjMap = {};
             results.forEach(r => {
                const sName = r.exam_subject?.subject?.name || 'Unknown';
                subjMap[sName] = Math.max(subjMap[sName] || 0, parseFloat(r.marks_obtained) || 0);
             });
             perfData = Object.keys(subjMap).map(k => ({ subject: k, score: subjMap[k] }));
          }
        } catch(e) { console.error(e); }
        setPerformance(perfData);

        // Fetch announcements
        try {
          const annRes = await api.get(`/communication/announcements/?page_size=3`);
          const anns = annRes.results || annRes || [];
          setAnnouncements(anns.slice(0, 3));
        } catch(e) { console.error(e); }

      } catch (err) {
        console.error("Error loading student dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, isPreview, targetStudentId]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  const displayName = studentProfile 
    ? `${studentProfile.first_name} ${studentProfile.last_name}` 
    : (user?.first_name || user?.email || "Student");
    
  const displayClass = studentProfile 
    ? `Class ${studentProfile.class_name || 'N/A'} • Section ${studentProfile.section_name || 'N/A'} • Roll ${studentProfile.roll_number || 'N/A'}`
    : "Class N/A";

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Good morning, {displayName} 👋
          </Typography>
          <Typography variant="caption" color="primary.main" fontWeight="bold">
            {displayClass}
          </Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FactCheckIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Attendance</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">
                {stats.attendance === 'N/A' ? 'N/A' : `${stats.attendance}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Current GPA</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.gpa}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Pending Homework</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.pendingHomework}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TodayIcon sx={{ color: 'info.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Upcoming Exams</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.upcomingExams}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, overflowX: 'auto', pb: 1 }}>
        <Button component={Link} href="/timetable" variant="contained" size="small" sx={{ minWidth: 150 }}>View Timetable</Button>
        <Button component={Link} href="/homework" variant="outlined" size="small" sx={{ minWidth: 150 }}>Submit Homework</Button>
        <Button component={Link} href="/exams" variant="outlined" size="small" sx={{ minWidth: 150 }}>View Results</Button>
        <Button component={Link} href="/attendance" variant="outlined" size="small" sx={{ minWidth: 150 }}>View Attendance</Button>
        <Button component={Link} href="/learning" variant="outlined" size="small" sx={{ minWidth: 150 }}>View Materials</Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={7}>
          {/* Today's Schedule */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Today's Classes</Typography>
              {schedule.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No classes scheduled for today. Enjoy your day!
                </Typography>
              ) : (
                <List disablePadding>
                  {schedule.map((item, i) => (
                    <Box key={item.id}>
                      <ListItem sx={{ py: 2, px: 0, display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: 80, mr: 2 }}>
                            <Typography variant="body2" fontWeight="bold" color="primary.main">{item.time.split(' - ')[0]}</Typography>
                            <Typography variant="caption" color="text.secondary">{item.time.split(' - ')[1]}</Typography>
                          </Box>
                          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">{item.sub}</Typography>
                            <Typography variant="body2" color="text.secondary">{item.teacher} • {item.room}</Typography>
                          </Box>
                        </Box>
                        <Button component={Link} href="/learning" variant="outlined" size="small">View Materials</Button>
                      </ListItem>
                      {i < schedule.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Academic Performance */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Academic Performance</Typography>
              {performance.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No exam results available yet.
                </Typography>
              ) : (
                performance.map((item, idx) => (
                  <Box key={item.subject} sx={{ mb: idx === performance.length - 1 ? 0 : 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="medium">{item.subject}</Typography>
                      <Typography variant="body2" fontWeight="bold">{item.score}%</Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ 
                        width: `${item.score}%`, 
                        height: '100%', 
                        bgcolor: item.score >= 90 ? 'success.main' : item.score >= 75 ? 'primary.main' : item.score >= 60 ? 'warning.main' : 'error.main',
                        borderRadius: 4
                      }} />
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5}>
          {/* Needs Attention / Upcoming */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Needs Your Attention</Typography>
              <List disablePadding>
                {stats.pendingHomework > 0 && (
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'warning.main' }}><WarningAmberIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={`${stats.pendingHomework} pending homework tasks`} primaryTypographyProps={{ variant: 'body2' }} />
                    <Button component={Link} href="/homework" size="small" variant="text" sx={{ minWidth: 'auto', p: 0 }}>View &rarr;</Button>
                  </ListItem>
                )}
                
                {stats.attendance !== 'N/A' && stats.attendance < 90 && (
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}><ErrorOutlineIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Attendance Warning" secondary={`Your attendance is ${stats.attendance}%`} primaryTypographyProps={{ variant: 'body2' }} />
                    <Button component={Link} href="/attendance" size="small" variant="text" sx={{ minWidth: 'auto', p: 0 }}>View &rarr;</Button>
                  </ListItem>
                )}

                {stats.upcomingExams > 0 && (
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'info.main' }}><TodayIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={`${stats.upcomingExams} upcoming exams this month`} primaryTypographyProps={{ variant: 'body2' }} />
                    <Button component={Link} href="/exams" size="small" variant="text" sx={{ minWidth: 'auto', p: 0 }}>View &rarr;</Button>
                  </ListItem>
                )}

                {stats.pendingHomework === 0 && (stats.attendance === 'N/A' || stats.attendance >= 90) && stats.upcomingExams === 0 && (
                  <ListItem disablePadding>
                    <ListItemIcon sx={{ minWidth: 32, color: 'success.main' }}><CheckCircleIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="You're all caught up!" primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Announcements</Typography>
              {announcements.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No announcements at this time.
                </Typography>
              ) : (
                <List disablePadding>
                  {announcements.map((ann, idx) => (
                    <Box key={ann.id}>
                      <ListItem disablePadding sx={{ mb: 2, display: 'block' }}>
                        <ListItemText 
                          primary={ann.title} 
                          secondary={new Date(ann.created_at).toLocaleDateString()} 
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }} 
                        />
                      </ListItem>
                      {idx < announcements.length - 1 && <Divider sx={{ mb: 2 }} />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
