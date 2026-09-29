"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress, Divider, Avatar
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function LibraryOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUniqueTitles: 0,
    totalBookVolume: 0,
    currentlyIssued: 0,
    overdueBooks: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [booksRes, issuesRes] = await Promise.all([
        api.get("/library/books/?page_size=5000"),
        api.get("/library/issues/?status=issued&page_size=1000")
      ]);

      const books = booksRes.results || booksRes;
      const issues = issuesRes.results || issuesRes;

      let totalVol = 0;
      books.forEach(b => {
        totalVol += (parseInt(b.total_quantity) || 0);
      });

      let overdue = 0;
      const todayStr = new Date().toISOString().split("T")[0];
      
      issues.forEach(issue => {
        if (issue.due_date < todayStr) overdue++;
      });

      setMetrics({
        totalUniqueTitles: books.length,
        totalBookVolume: totalVol,
        currentlyIssued: issues.length,
        overdueBooks: overdue,
      });

      // Sort recent issues by date (newest first)
      const sortedIssues = [...issues].sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date)).slice(0, 5);
      setRecentIssues(sortedIssues);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="body2" color="primary.dark" fontWeight="medium">Total Books (Volume)</Typography>
              <Typography variant="h4" color="primary.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <LibraryBooksIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalBookVolume}
              </Typography>
              <Typography variant="caption" color="text.secondary">{metrics.totalUniqueTitles} unique titles</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="body2" color="success.dark" fontWeight="medium">Available Books</Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <MenuBookIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.totalBookVolume - metrics.currentlyIssued}
              </Typography>
              <Typography variant="caption" color="text.secondary">Ready on shelves</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="body2" color="warning.dark" fontWeight="medium">Currently Issued</Typography>
              <Typography variant="h4" color="warning.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <BookmarkAddedIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.currentlyIssued}
              </Typography>
              <Typography variant="caption" color="text.secondary">Checked out to students</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'error.50' }}>
            <CardContent>
              <Typography variant="body2" color="error.dark" fontWeight="medium">Overdue Returns</Typography>
              <Typography variant="h4" color="error.main" fontWeight="bold" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <WarningAmberIcon sx={{ mr: 1, fontSize: 32 }} /> {metrics.overdueBooks}
              </Typography>
              <Typography variant="caption" color="text.secondary">Exceeded due date</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                Recent Issues & Overdue Log
              </Typography>
              {recentIssues.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No outstanding issues found.</Typography>
              ) : (
                <Box>
                  {recentIssues.map((issue, idx) => {
                    const isOverdue = issue.due_date < new Date().toISOString().split("T")[0];
                    return (
                      <Box key={issue.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5 }}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: isOverdue ? 'error.main' : 'primary.main', mr: 2 }}>
                            {isOverdue ? <WarningAmberIcon /> : <BookmarkAddedIcon />}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" fontWeight="bold">{issue.book_title || `Book #${issue.book}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Issued to: {issue.student_name || `Student #${issue.student}`} • Issued: {issue.issue_date}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'} fontWeight={isOverdue ? "bold" : "normal"}>
                              Due: {issue.due_date}
                            </Typography>
                            {isOverdue && <Typography variant="caption" color="error.main">Overdue</Typography>}
                          </Box>
                        </Box>
                        {idx < recentIssues.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
