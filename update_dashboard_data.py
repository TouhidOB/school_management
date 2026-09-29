import re

with open('frontend/components/dashboards/StudentDashboard.js', 'r') as f:
    content = f.read()

# Replace the Mock stats block
mock_stats_block = """
        // Mock stats
        setStats({
          attendance: Math.floor(Math.random() * (100 - 85 + 1)) + 85,
          gpa: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(2),
          pendingHomework: Math.floor(Math.random() * 5),
          upcomingExams: Math.floor(Math.random() * 3)
        });

        // Mock performance
        setPerformance([
          { subject: 'Mathematics', score: Math.floor(Math.random() * 20) + 80 },
          { subject: 'Physics', score: Math.floor(Math.random() * 20) + 75 },
          { subject: 'English', score: Math.floor(Math.random() * 20) + 70 },
          { subject: 'Chemistry', score: Math.floor(Math.random() * 20) + 75 },
          { subject: 'ICT', score: Math.floor(Math.random() * 15) + 85 },
        ]);
"""

real_stats_block = """
        // Real Attendance
        let attendancePct = 'N/A';
        try {
          const attRes = await api.get(`/student-attendance/?student=${studentId}&page_size=500`);
          const attRecords = attRes.results || attRes || [];
          if (attRecords.length > 0) {
             const present = attRecords.filter(r => r.status === 'present').length;
             attendancePct = Math.round((present / attRecords.length) * 100);
          }
        } catch(e) { console.error(e); }

        // We don't have homework endpoint yet, default to 0
        // We could fetch exams, but for now default to 0
        setStats({
          attendance: attendancePct,
          gpa: 'N/A', // Need backend aggregation for GPA
          pendingHomework: 0,
          upcomingExams: 0
        });

        // Try to get real performance from exam results if the endpoint exists
        let perfData = [];
        try {
          const resRes = await api.get(`/exam-results/?student=${studentId}&page_size=100`);
          const results = resRes.results || resRes || [];
          if (results.length > 0) {
             // Group by subject
             const subjMap = {};
             results.forEach(r => {
                const sName = r.exam_subject?.subject?.name || 'Unknown';
                subjMap[sName] = Math.max(subjMap[sName] || 0, parseFloat(r.marks_obtained) || 0);
             });
             perfData = Object.keys(subjMap).map(k => ({ subject: k, score: subjMap[k] }));
          }
        } catch(e) { console.error(e); }
        setPerformance(perfData);
"""

if "// Mock stats" in content:
    # Need regex to match the block exactly since formatting might differ
    # We will just replace it from "// Mock stats" to the end of setPerformance([...]);
    content = re.sub(r'// Mock stats.*?setPerformance\(\[.*?\]\);', real_stats_block, content, flags=re.DOTALL)

# Update Needs Your Attention logic to only show if > 0
needs_attention_block = """
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Today's Classes</Typography>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              {schedule.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No classes scheduled for today. Enjoy your day!</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {schedule.map((cls, idx) => (
                    <Box key={cls.id}>
                      <ListItem sx={{ py: 2, px: 3 }}>
                        <Box sx={{ minWidth: 100, borderRight: '2px solid', borderColor: 'primary.main', mr: 2, pr: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold">{cls.time.split(' - ')[0]}</Typography>
                          <Typography variant="caption" color="text.secondary">{cls.time.split(' - ')[1]}</Typography>
                        </Box>
                        <ListItemText 
                          primary={<Typography variant="subtitle1" fontWeight="bold">{cls.sub}</Typography>}
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {cls.teacher} • Room {cls.room}
                            </Typography>
                          }
                        />
                        <Button component={Link} href="/learning" variant="outlined" size="small">View Materials</Button>
                      </ListItem>
                      {idx < schedule.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Needs Your Attention</Typography>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <List disablePadding>
                {stats.pendingHomework > 0 && (
                  <>
                    <ListItem sx={{ py: 2, px: 3 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: 'warning.main' }}><WarningAmberIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary={`${stats.pendingHomework} pending homework tasks`}
                      />
                      <Button component={Link} href="/homework" size="small" variant="text" sx={{ minWidth: 'auto', p: 0 }}>View &rarr;</Button>
                    </ListItem>
                    <Divider />
                  </>
                )}
                
                {stats.attendance !== 'N/A' && stats.attendance < 90 && (
                  <>
                    <ListItem sx={{ py: 2, px: 3 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}><ErrorOutlineIcon fontSize="small" /></ListItemIcon>
                      <ListItemText 
                        primary="Attendance Warning"
                        secondary={`Your attendance is ${stats.attendance}%`}
                      />
                      <Button component={Link} href="/attendance" size="small" variant="text" sx={{ minWidth: 'auto', p: 0 }}>View &rarr;</Button>
                    </ListItem>
                    <Divider />
                  </>
                )}
                
                {stats.upcomingExams > 0 && (
                  <ListItem sx={{ py: 2, px: 3 }}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'info.main' }}><TodayIcon fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary={`${stats.upcomingExams} upcoming exams this month`}
                    />
                    <Button component={Link} href="/exams" size="small" variant="text" sx={{ minWidth: 'auto', p: 0 }}>View &rarr;</Button>
                  </ListItem>
                )}
                
                {stats.pendingHomework === 0 && (stats.attendance === 'N/A' || stats.attendance >= 90) && stats.upcomingExams === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">You're all caught up!</Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
"""

content = re.sub(r'<Grid container spacing=\{4\} sx=\{\{ mb: 4 \}\}>.*?</Grid>\s*</Grid>', needs_attention_block, content, flags=re.DOTALL)

# Update Academic Performance rendering to handle empty array gracefully
perf_block = """
      {/* Academic Performance & Announcements */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Academic Performance</Typography>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              {performance.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
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
"""

content = re.sub(r'\{\/\* Academic Performance.*?<\/Grid>', perf_block, content, flags=re.DOTALL)


with open('frontend/components/dashboards/StudentDashboard.js', 'w') as f:
    f.write(content)
