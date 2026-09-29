"use client";

// Reusable list + inline create/edit/delete for simple tenant resources.
// Config-driven so a module page is just a <InlineCrud .../> call.
//
// props:
//   title       heading
//   endpoint    DRF collection, e.g. "/sections/"
//   columns     [{ key, label, render? }]  table columns (key reads row[key])
//   fields      [{ key, label, type?, required?, options?, optionsEndpoint?,
//                  optionLabel?, optionLabelFn? }]
//                 type: "text" | "number" | "date" | "time" | "select" |
//                       "textarea" | "checkbox"
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Tooltip,
  TablePagination
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function InlineCrud({ title, endpoint, columns, fields, help, filters }) {
  const emptyForm = useMemo(() => {
    const o = {};
    fields.forEach((f) => (o[f.key] = f.type === "checkbox" ? false : ""));
    return o;
  }, [fields]);

  const [rows, setRows] = useState([]);
  const [optionSets, setOptionSets] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`${endpoint}?page_size=200`)
      .then((d) => setRows(d.results || d))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => {
    load();
    // preload select options
    fields
      .filter((f) => f.type === "select" && f.optionsEndpoint)
      .forEach((f) =>
        api
          .get(f.optionsEndpoint)
          .then((d) => setOptionSets((prev) => ({ ...prev, [f.key]: d.results || d })))
          .catch(() => {})
      );
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setForm(emptyForm);
    setEditId(null);
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const payload = { ...form };
    fields.forEach((f) => {
      if ((f.type === "select" || f.type === "date" || f.type === "time") && payload[f.key] === "")
        payload[f.key] = f.required ? payload[f.key] : null;
      if (f.type === "number" && payload[f.key] !== "" && payload[f.key] != null)
        payload[f.key] = Number(payload[f.key]);
    });
    try {
      if (editId) await api.patch(`${endpoint}${editId}/`, payload);
      else await api.post(endpoint, payload);
      reset();
      load();
    } catch (err) {
      setError(
        err.data && typeof err.data === "object"
          ? Object.entries(err.data).map(([k, val]) => `${k}: ${val}`).join(" · ")
          : err.message
      );
    }
  }

  async function remove(id) {
    if (!confirm("Delete this record?")) return;
    await api.del(`${endpoint}${id}/`);
    load();
  }

  function startEdit(row) {
    const f = {};
    fields.forEach((fl) => (f[fl.key] = row[fl.key] ?? (fl.type === "checkbox" ? false : "")));
    setForm(f);
    setEditId(row.id);
    setError("");
  }

  const optLabel = (f, o) =>
    f.optionLabelFn ? f.optionLabelFn(o) : o[f.optionLabel || "name"];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: help ? 1 : 3, fontWeight: 'bold' }}>{title}</Typography>
      {help && <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{help}</Typography>}
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>{editId ? "Edit" : "Add new"}</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <form onSubmit={submit}>
                {fields.map((f) => (
                  <Box sx={{ mb: 2 }} key={f.key}>
                    {f.type === "select" ? (
                      <TextField
                        select
                        fullWidth
                        label={f.label}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        required={f.required}
                        size="small"
                        helperText={f.tooltip}
                      >
                        <MenuItem value=""><em>—</em></MenuItem>
                        {(f.options || optionSets[f.key] || []).map((o) => (
                          <MenuItem key={o.id ?? o.value ?? o} value={o.id ?? o.value ?? o}>
                            {typeof o === "object" ? (o.label ?? optLabel(f, o)) : o}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : f.type === "textarea" ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={f.label}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        required={f.required}
                        size="small"
                        helperText={f.tooltip}
                      />
                    ) : f.type === "checkbox" ? (
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!form[f.key]}
                              onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                              id={`cb-${f.key}`}
                            />
                          }
                          label={
                            f.tooltip ? (
                              <Tooltip title={f.tooltip} placement="right">
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                  {f.label} <InfoOutlinedIcon fontSize="small" color="action" />
                                </Box>
                              </Tooltip>
                            ) : f.label
                          }
                        />
                      </Box>
                    ) : (
                      <TextField
                        fullWidth
                        type={f.type || "text"}
                        label={f.label}
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        required={f.required}
                        size="small"
                        helperText={f.tooltip}
                        InputLabelProps={(f.type === 'date' || f.type === 'time') ? { shrink: true } : undefined}
                      />
                    )}
                  </Box>
                ))}
                
                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button type="submit" variant="contained" size="small">
                    {editId ? "Update" : "Add"}
                  </Button>
                  {editId && (
                    <Button type="button" variant="text" size="small" onClick={reset}>
                      Cancel
                    </Button>
                  )}
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          {filters && filters.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              {filters.map((fKey) => {
                const f = fields.find((field) => field.key === fKey);
                if (!f) return null;
                return (
                  <TextField
                    key={fKey}
                    select
                    label={`Filter by ${f.label.replace(' (optional)', '')}`}
                    value={filterValues[fKey] || ''}
                    onChange={(e) => setFilterValues({ ...filterValues, [fKey]: e.target.value })}
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value=""><em>All</em></MenuItem>
                    {(f.options || optionSets[fKey] || []).map((o) => (
                      <MenuItem key={o.id ?? o.value ?? o} value={o.id ?? o.value ?? o}>
                        {typeof o === "object" ? (o.label ?? optLabel(f, o)) : o}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              })}
            </Box>
          )}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {c.tooltip ? (
                          <Tooltip title={c.tooltip} placement="top">
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                              {c.label}
                              <InfoOutlinedIcon fontSize="inherit" color="action" />
                            </Box>
                          </Tooltip>
                        ) : c.label}
                      </TableCell>
                    ))}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading…</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4, color: 'text.secondary' }}>No records.</TableCell></TableRow>
                  ) : (
                    rows
                      .filter((row) => {
                         if (!filters || filters.length === 0) return true;
                         for (const fKey of filters) {
                           if (filterValues[fKey] && String(row[fKey]) !== String(filterValues[fKey])) {
                             return false;
                           }
                         }
                         return true;
                      })
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                      <TableRow key={row.id} hover>
                        {columns.map((c) => (
                          <TableCell key={c.key}>{c.render ? c.render(row) : (row[c.key] ?? "—")}</TableCell>
                        ))}
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => startEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => remove(row.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={rows.filter((row) => {
                 if (!filters || filters.length === 0) return true;
                 for (const fKey of filters) {
                   if (filterValues[fKey] && String(row[fKey]) !== String(filterValues[fKey])) {
                     return false;
                   }
                 }
                 return true;
              }).length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
