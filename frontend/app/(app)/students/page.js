"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Pagination,
  MenuItem,
  TableSortLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BadgeIcon from "@mui/icons-material/Badge";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function StudentsPage() {
  const [data, setData] = useState({ results: [], count: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [filterYear, setFilterYear] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [yearsLoaded, setYearsLoaded] = useState(false);

  // Sorting state - defaults to sort_roll ascending (Roll 1 to n)
  const [orderBy, setOrderBy] = useState("sort_roll");
  const [orderDir, setOrderDir] = useState("asc");

  const handleSort = (field) => {
    if (orderBy === field) {
      setOrderDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(field);
      setOrderDir("asc");
    }
    setPage(1);
  };

  useEffect(() => {
    api.get("/academic-years/?page_size=200").then(d => {
      const list = d.results || d || [];
      // Sort so current year is placed first, then descending by name
      list.sort((a, b) => (b.is_current ? 1 : 0) - (a.is_current ? 1 : 0) || (b.name || "").localeCompare(a.name || ""));
      setAcademicYears(list);
      // ALWAYS default to current academic year
      const currentYear = list.find(y => y.is_current) || list[0];
      if (currentYear) {
        setFilterYear(String(currentYear.id));
      }
      setYearsLoaded(true);
    }).catch(() => {
      setYearsLoaded(true);
    });
    api.get("/classes/?page_size=200").then(d => setClasses(d.results || d)).catch(() => {});
    api.get("/sections/?page_size=500").then(d => setSections(d.results || d)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    if (!yearsLoaded) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (filterYear) params.set("academic_year", filterYear);
    if (filterClass) params.set("current_class", filterClass);
    if (filterSection) params.set("current_section", filterSection);
    if (orderBy) {
      params.set("ordering", orderDir === "desc" ? `-${orderBy}` : orderBy);
    }
    api
      .get(`/students/?${params}`)
      .then(setData)
      .catch(() => setData({ results: [], count: 0 }))
      .finally(() => setLoading(false));
  }, [page, search, filterYear, filterClass, filterSection, orderBy, orderDir, yearsLoaded]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0); // debounce search
    return () => clearTimeout(t);
  }, [load, search]);

  async function remove(id, name) {
    if (!confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    await api.del(`/students/${id}/`);
    load();
  }

  const pages = Math.ceil(data.count / 25) || 1;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Students</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {filterClass && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<BadgeIcon />}
              component="a"
              href={`/print/class/${filterClass}/id-cards`}
              target="_blank"
            >
              Print Class IDs
            </Button>
          )}
          <Button 
            component={Link} 
            href="/students/new" 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ p: 2, pb: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search name, admission or roll no."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              sx={{ maxWidth: 360, width: '100%', flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Academic Year"
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {academicYears.map(y => (
                <MenuItem key={y.id} value={String(y.id)}>
                  {y.name} {y.is_current ? "(Current)" : ""}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Class"
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setFilterSection("");
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField
              select
              size="small"
              label="Section"
              value={filterSection}
              onChange={(e) => {
                setFilterSection(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
              disabled={!filterClass}
            >
              <MenuItem value="">All Sections</MenuItem>
              {sections
                .filter(s => String(s.school_class) === String(filterClass))
                .map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)
              }
            </TextField>
          </Box>

          <TableContainer sx={{ mt: 2 }}>
            <Table size="small" hover>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "admission_number"}
                      direction={orderBy === "admission_number" ? orderDir : "asc"}
                      onClick={() => handleSort("admission_number")}
                    >
                      Admission&nbsp;#
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "full_name"}
                      direction={orderBy === "full_name" ? orderDir : "asc"}
                      onClick={() => handleSort("full_name")}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "sort_roll"}
                      direction={orderBy === "sort_roll" ? orderDir : "asc"}
                      onClick={() => handleSort("sort_roll")}
                      sx={{ fontWeight: "bold" }}
                    >
                      Roll
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : data.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.results.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.admission_number}</TableCell>
                      <TableCell>{s.full_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={s.academic_year_name || "—"} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontSize: '0.75rem' }} 
                        />
                      </TableCell>
                      <TableCell>{s.class_name || "—"}</TableCell>
                      <TableCell>
                        {s.section_name ? (
                          <Chip 
                            label={s.section_name} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 600, fontSize: '0.72rem', minWidth: 28 }} 
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>{s.roll_number || "—"}</TableCell>
                      <TableCell>
                        <Chip 
                          label={s.status} 
                          size="small" 
                          variant="outlined" 
                          sx={{ textTransform: 'capitalize' }} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          component={Link} 
                          href={`/students/${s.id}`} 
                          size="small" 
                          color="primary" 
                          title="View"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          component="a" 
                          href={`/print/student/${s.id}/id-card`} 
                          target="_blank" 
                          rel="noreferrer"
                          size="small" 
                          color="secondary" 
                          title="ID card"
                        >
                          <BadgeIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          component={Link} 
                          href={`/students/${s.id}/edit`} 
                          size="small" 
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => remove(s.id, s.full_name)} 
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Pagination 
                count={pages} 
                page={page} 
                onChange={(e, p) => setPage(p)} 
                color="primary" 
                size="small" 
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
