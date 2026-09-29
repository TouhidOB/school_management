import { Box, Typography, Grid, Card, CardContent, Divider, List, ListItem, ListItemText, ListItemIcon, Button, CircularProgress } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ClassIcon from "@mui/icons-material/Class";
import PeopleIcon from "@mui/icons-material/People";
import TodayIcon from "@mui/icons-material/Today";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import RuleFolderIcon from "@mui/icons-material/RuleFolder";
import GradingIcon from "@mui/icons-material/Grading";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function TeacherDashboard({ user, isPreview, targetTeacherId }) {
  const [impersonatedTeacher, setImpersonatedTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic state
  const [stats, setStats] = useState({
    myClasses: 0,
    myStudents: 0,
    todaysClasses: 0,
    attendancePending: 0,
    pendingAssignments: 0,
    pendingMarks: 0
  });
  const [schedule, setSchedule] = useState([]);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let teacherId = null;
        let teacherProfile = null;

        // Determine which teacher we're loading for
        if (isPreview && targetTeacherId) {
          teacherId = targetTeacherId;
          teacherProfile = await api.get(`/teachers/${teacherId}/`);
          setImpersonatedTeacher(teacherProfile);
        } else if (user?.role === 'teacher') {
          // Find own profile
          const res = await api.get(`/teachers/?page_size=500`);
          const rows = res.results || res;
          teacherProfile = rows.find(t => t.email === user.email) || rows[0];
          if (teacherProfile) teacherId = teacherProfile.id;
        }

        if (!teacherId || !teacherProfile) {
          setLoading(false);
          return;
        }

        // Fetch routines for this teacher
        const [routinesRes, studentsRes, sectionsRes] = await Promise.all([
          api.get(`/routine-slots/?teacher=${teacherId}&page_size=500`).catch(() => []),
          api.get(`/students/?page_size=1000`).catch(() => []),
          api.get(`/academics/sections/?page_size=500`).catch(() => [])
        ]);

        const routines = routinesRes.results || routinesRes || [];
        const students = studentsRes.results || studentsRes || [];
        const allSections = sectionsRes.results || sectionsRes || [];

        // Identify assigned sections from teacher profile directly
        const assignedSectionIds = teacherProfile.sections || [];
        const classesCount = assignedSectionIds.length;

        // Calculate My Students
        const myStudents = students.filter(s => assignedSectionIds.includes(s.current_section));
        
        // Calculate Today's Classes
        const todayDayOfWeek = new Date().getDay(); 
        const djangoDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
        const todaysRoutines = routines.filter(r => r.day_of_week === djangoDay);
        
        // Format schedule for today
        const formattedSchedule = todaysRoutines.map(r => ({
          id: r.id,
          time: `${r.start_time.substring(0, 5)} - ${r.end_time.substring(0, 5)}`,
          sub: r.subject_name || 'Subject',
          cls: `${r.class_name || 'Class'} — ${r.section_name || 'Section'}`,
          room: r.room_name || 'Classroom'
        })).sort((a, b) => a.time.localeCompare(b.time));

        // Generate class performance dynamically from the assigned sections
        const perfData = assignedSectionIds.map(sectionId => {
          const sectionObj = allSections.find(s => s.id === sectionId);
          return {
            cls: sectionObj ? `${sectionObj.class_name || ''} ${sectionObj.name || ''}` : `Section ${sectionId}`,
            pct: Math.floor(Math.random() * (95 - 75 + 1)) + 75 // Mock performance
          };
        }).filter(p => p.cls.trim() !== "");

        setStats({
          myClasses: classesCount,
          myStudents: myStudents.length,
          todaysClasses: todaysRoutines.length,
          attendancePending: todaysRoutines.length > 0 ? 1 : 0, 
          pendingAssignments: 0,
          pendingMarks: 0
        });

        setSchedule(formattedSchedule);
        setPerformance(perfData);

      } catch (err) {
        console.error("Error loading teacher data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isPreview, targetTeacherId, user]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  const displayName = impersonatedTeacher 
    ? (impersonatedTeacher.display_name || impersonatedTeacher.first_name || "Teacher") 
    : (user?.first_name || user?.email || "Teacher");

  return (
    <Box>
      {isPreview && (
        <Box sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', p: 1.5, borderRadius: 1, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WarningAmberIcon sx={{ mr: 1 }} />
          <Typography variant="body2" fontWeight="bold">
            ⚠ ADMIN ACCESS MODE: You are viewing the Teacher Panel as {impersonatedTeacher ? displayName : "a generic Teacher"}.
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Good morning, {displayName}. Here's your teaching schedule for today.
          </Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4} md={2}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ClassIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">My Classes</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.myClasses}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">My Students</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.myStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TodayIcon sx={{ color: 'info.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Today's Classes</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.todaysClasses}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentLateIcon sx={{ color: 'error.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Att. Pending</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.attendancePending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RuleFolderIcon sx={{ color: 'warning.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Assignments</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.pendingAssignments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GradingIcon sx={{ color: 'secondary.main', mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Pending Marks</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{stats.pendingMarks}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, overflowX: 'auto', pb: 1 }}>
        <Button variant="contained" size="small" sx={{ minWidth: 150 }}>+ Take Attendance</Button>
        <Button variant="outlined" size="small" sx={{ minWidth: 150 }}>+ Create Homework</Button>
        <Button variant="outlined" size="small" sx={{ minWidth: 150 }}>+ Add Assignment</Button>
        <Button variant="outlined" size="small" sx={{ minWidth: 150 }}>+ Add Marks</Button>
        <Button variant="outlined" size="small" sx={{ minWidth: 150 }}>+ Lesson Plan</Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={7}>
          {/* Today's Schedule */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Today's Schedule</Typography>
              {schedule.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No classes scheduled for today.
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
                            <Typography variant="body2" color="text.secondary">{item.cls} • {item.room}</Typography>
                          </Box>
                        </Box>
                        <Button variant="outlined" size="small">Open Class</Button>
                      </ListItem>
                      {i < schedule.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Attendance Overview */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>My Students Attendance (This Month)</Typography>
              {stats.myStudents === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No students assigned yet.
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color="success.main">94%</Typography>
                      <Typography variant="body2" color="text.secondary">Present</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color="error.main">4%</Typography>
                      <Typography variant="body2" color="text.secondary">Absent</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">2%</Typography>
                      <Typography variant="body2" color="text.secondary">Late</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ width: '100%', height: 12, display: 'flex', borderRadius: 6, overflow: 'hidden', mt: 2, mb: 3 }}>
                    <Box sx={{ width: '94%', bgcolor: 'success.main' }} />
                    <Box sx={{ width: '2%', bgcolor: 'warning.main' }} />
                    <Box sx={{ width: '4%', bgcolor: 'error.main' }} />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5}>
          {/* Needs Attention */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Needs Your Attention</Typography>
              {stats.myClasses === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  You're all caught up!
                </Typography>
              ) : (
                <List disablePadding>
                  {stats.attendancePending > 0 && (
                    <ListItem disablePadding sx={{ mb: 2 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}><ErrorOutlineIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={`Attendance pending — ${schedule.length > 0 ? schedule[0].cls : 'Today\'s Classes'}`} primaryTypographyProps={{ variant: 'body2' }} />
                      <Button size="small" variant="text" sx={{ minWidth: 'auto', p: 0 }}>View &rarr;</Button>
                    </ListItem>
                  )}
                  {stats.pendingAssignments > 0 && (
                    <ListItem disablePadding sx={{ mb: 2 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: 'warning.main' }}><WarningAmberIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={`${stats.pendingAssignments} assignments awaiting grading`} primaryTypographyProps={{ variant: 'body2' }} />
                      <Button size="small" variant="text" sx={{ minWidth: 'auto', p: 0 }}>View &rarr;</Button>
                    </ListItem>
                  )}
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'info.main' }}><ErrorOutlineIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="No new student messages" primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>

          {/* Class Performance */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>My Class Performance</Typography>
              {performance.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No performance data yet.
                </Typography>
              ) : (
                <List disablePadding>
                  {performance.map((item, i) => (
                    <ListItem key={i} disablePadding sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{item.cls}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '60%' }}>
                        <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'grey.200', borderRadius: 4, mr: 2, overflow: 'hidden' }}>
                          <Box sx={{ width: `${item.pct}%`, height: '100%', bgcolor: item.pct > 85 ? 'success.main' : item.pct > 80 ? 'primary.main' : 'warning.main' }} />
                        </Box>
                        <Typography variant="body2" fontWeight="bold">{item.pct}%</Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Recent Activity</Typography>
              <List disablePadding>
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemIcon sx={{ minWidth: 32, color: 'success.main' }}><CheckCircleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Dashboard connected" secondary="Just now" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
