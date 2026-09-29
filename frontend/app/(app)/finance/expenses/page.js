"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  FormControl, InputLabel, Select, MenuItem, InputAdornment, Alert,
  Tabs, Tab, Stack, Tooltip, CircularProgress, Paper, Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CategoryIcon from "@mui/icons-material/Category";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CloseIcon from "@mui/icons-material/Close";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState(0); // 0: All Expenses, 1: Categories
  
  // Data
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Expense Modal State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    category: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    description: ""
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'expense' | 'category', item }
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        api.get("/expenses/?page_size=1000"),
        api.get("/expense-categories/?page_size=200")
      ]);
      setExpenses(expRes.results || expRes || []);
      setCategories(catRes.results || catRes || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load expense records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format currency
  const formatMoney = (val) => {
    return "৳" + parseFloat(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format Date readable
  const formatDate = (dStr) => {
    if (!dStr) return "—";
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dStr;
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalAllTime = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
    
    // This month's total
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const thisMonthTotal = expenses.reduce((acc, e) => {
      const d = new Date(e.expense_date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        return acc + (parseFloat(e.amount) || 0);
      }
      return acc;
    }, 0);

    // Top Category
    const catMap = {};
    expenses.forEach((e) => {
      const cName = e.category_name || "Uncategorized";
      catMap[cName] = (catMap[cName] || 0) + (parseFloat(e.amount) || 0);
    });
    let topCatName = "None";
    let topCatAmount = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCatName = cat;
      }
    });

    return {
      totalAllTime,
      thisMonthTotal,
      topCatName,
      topCatAmount,
      totalCount: expenses.length
    };
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !searchQuery ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.category_name && e.category_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.recorded_by_name && e.recorded_by_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(e.amount).includes(searchQuery);

      const matchesCategory =
        categoryFilter === "all" || String(e.category) === String(categoryFilter);

      const matchesDate = !dateFilter || e.expense_date === dateFilter;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [expenses, searchQuery, categoryFilter, dateFilter]);

  // Open Expense Modal for Add
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: categories.length > 0 ? categories[0].id : "",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      description: ""
    });
    setExpenseModalOpen(true);
  };

  // Open Expense Modal for Edit
  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
      description: expense.description || ""
    });
    setExpenseModalOpen(true);
  };

  // Save Expense (Create or Update)
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.expense_date) {
      alert("Please fill in Category, Amount, and Expense Date.");
      return;
    }
    setSubmittingExpense(true);
    try {
      if (editingExpense) {
        await api.patch(`/expenses/${editingExpense.id}/`, expenseForm);
        setMessage("Expense updated successfully.");
      } else {
        await api.post("/expenses/", expenseForm);
        setMessage("Expense recorded successfully.");
      }
      setExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save expense: " + (err.message || "Server error"));
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Open Category Modal for Add
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "" });
    setCategoryModalOpen(true);
  };

  // Open Category Modal for Edit
  const handleOpenEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || "" });
    setCategoryModalOpen(true);
  };

  // Save Category (Create or Update)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      alert("Please enter a category name.");
      return;
    }
    setSubmittingCategory(true);
    try {
      if (editingCategory) {
        await api.patch(`/expense-categories/${editingCategory.id}/`, categoryForm);
        setMessage("Category updated successfully.");
      } else {
        await api.post("/expense-categories/", categoryForm);
        setMessage("Category created successfully.");
      }
      setCategoryModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save category: " + (err.message || "Server error"));
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Trigger Delete Confirmation
  const confirmDelete = (type, item) => {
    setItemToDelete({ type, item });
    setDeleteConfirmOpen(true);
  };

  // Execute Delete
  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      if (itemToDelete.type === "expense") {
        await api.delete(`/expenses/${itemToDelete.item.id}/`);
        setMessage("Expense deleted successfully.");
      } else {
        await api.delete(`/expense-categories/${itemToDelete.item.id}/`);
        setMessage("Category deleted successfully.");
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete item: " + (err.message || "Server error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Title & Main Action Buttons */}
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#1e293b", display: "flex", alignItems: "center", gap: 1 }}>
            <ReceiptLongIcon color="primary" /> Expense Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Record, monitor, and categorize operational expenditures and institutional purchases.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={handleOpenAddCategory}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            New Category
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddExpense}
            sx={{ textTransform: "none", fontWeight: "bold", px: 2.5 }}
          >
            Record Expense
          </Button>
        </Stack>
      </Box>

      {/* Alert Messages */}
      {message && (
        <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg("")} sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Executive KPI Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total Expenses
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#fee2e2", color: "#dc2626", display: "flex" }}>
                  <TrendingDownIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                {formatMoney(metrics.totalAllTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cumulative across all records
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  This Month
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#e0e7ff", color: "#4f46e5", display: "flex" }}>
                  <CalendarMonthIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                {formatMoney(metrics.thisMonthTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current month operational burn
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Top Category
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#fef3c7", color: "#d97706", display: "flex" }}>
                  <FolderSpecialIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h6" fontWeight="bold" noWrap sx={{ color: "#0f172a", fontSize: "1.1rem" }}>
                {metrics.topCatName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatMoney(metrics.topCatAmount)} spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total Vouchers
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "#dbeafe", color: "#0284c7", display: "flex" }}>
                  <ReceiptLongIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: "#0f172a" }}>
                {metrics.totalCount} <Typography component="span" variant="body2" color="text.secondary">entries</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across {categories.length} active categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Container with Tabs */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc", px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => {
              setActiveTab(val);
              setPage(0);
            }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>Expense Records</span>
                  <Chip label={expenses.length} size="small" sx={{ height: 20, fontSize: "0.75rem", fontWeight: "bold" }} />
                </Box>
              }
              sx={{ textTransform: "none", fontWeight: 600, py: 1.5 }}
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>Expense Categories</span>
                  <Chip label={categories.length} size="small" sx={{ height: 20, fontSize: "0.75rem", fontWeight: "bold" }} />
                </Box>
              }
              sx={{ textTransform: "none", fontWeight: 600, py: 1.5 }}
            />
          </Tabs>
        </Box>

        {/* Tab 0: Expense Records */}
        {activeTab === 0 && (
          <Box>
            {/* Search & Filter Bar */}
            <Box sx={{ p: 2, bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by description, category, or user..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Filter Category"
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">All Categories ({categories.length})</MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Filter Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setPage(0);
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={1} sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Tooltip title="Reset Filters">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchQuery("");
                          setCategoryFilter("all");
                          setDateFilter("");
                          setPage(0);
                        }}
                        disabled={!searchQuery && categoryFilter === "all" && !dateFilter}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Grid>
              </Grid>
            </Box>

            {/* Expenses Table */}
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: 140 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: 220 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Description / Purpose</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: 180 }}>Recorded By</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", width: 150 }}>Amount</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", width: 110 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={30} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading expense records...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Box sx={{ color: "text.secondary" }}>
                          <ReceiptLongIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
                          <Typography variant="body1" fontWeight="bold">No expense records found</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {searchQuery || categoryFilter !== "all" || dateFilter
                              ? "Try adjusting your filters or search terms."
                              : "Get started by recording your first operational expense."}
                          </Typography>
                          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenAddExpense}>
                            Record First Expense
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 500, color: "#334155" }}>
                            {formatDate(row.expense_date)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.category_name || "Uncategorized"}
                              sx={{
                                fontWeight: 600,
                                bgcolor: "#f1f5f9",
                                color: "#334155",
                                border: "1px solid #e2e8f0"
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" sx={{ color: "#1e293b" }}>
                              {row.description || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {row.recorded_by_name || "System Staff"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold" sx={{ color: "#dc2626", fontFamily: "monospace", fontSize: "0.95rem" }}>
                              {formatMoney(row.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Edit Expense">
                                <IconButton size="small" color="primary" onClick={() => handleOpenEditExpense(row)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Expense">
                                <IconButton size="small" color="error" onClick={() => confirmDelete("expense", row)}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Table Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredExpenses.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ borderTop: "1px solid #f1f5f9" }}
            />
          </Box>
        )}

        {/* Tab 1: Categories */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ p: 2, bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#1e293b" }}>
                Expense Categories & Aggregations
              </Typography>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenAddCategory}>
                Add Category
              </Button>
            </Box>

            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569", width: 220 }}>Category Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Description / Scope</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", width: 160 }}>Transactions</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569", width: 180 }}>Total Spent</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", width: 110 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No expense categories defined yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CategoryIcon fontSize="small" color="action" />
                            {c.name}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: "#64748b" }}>
                          {c.description || "—"}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={`${c.expense_count || 0} entries`}
                            sx={{ fontWeight: "bold", bgcolor: "#e2e8f0", color: "#334155" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold" sx={{ color: "#0f172a", fontFamily: "monospace" }}>
                            {formatMoney(c.total_spent)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Edit Category">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEditCategory(c)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Category">
                              <IconButton size="small" color="error" onClick={() => confirmDelete("category", c)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>

      {/* Record / Edit Expense Dialog */}
      <Dialog
        open={expenseModalOpen}
        onClose={() => !submittingExpense && setExpenseModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <form onSubmit={handleSaveExpense}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <Typography variant="h6" fontWeight="bold">
              {editingExpense ? "Edit Operational Expense" : "Record Operational Expense"}
            </Typography>
            <IconButton size="small" onClick={() => setExpenseModalOpen(false)} disabled={submittingExpense}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={7}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Expense Category</InputLabel>
                  <Select
                    value={expenseForm.category}
                    label="Expense Category"
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Expense Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Amount (৳)"
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">৳</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Description / Purpose"
                  placeholder="e.g. Monthly electricity bill for academic campus"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <Button onClick={() => setExpenseModalOpen(false)} disabled={submittingExpense} sx={{ color: "text.secondary" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submittingExpense}
              startIcon={submittingExpense ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
              sx={{ fontWeight: "bold", minWidth: 130 }}
            >
              {submittingExpense ? "Saving..." : editingExpense ? "Update Expense" : "Save Expense"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add / Edit Category Dialog */}
      <Dialog
        open={categoryModalOpen}
        onClose={() => !submittingCategory && setCategoryModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <form onSubmit={handleSaveCategory}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <Typography variant="h6" fontWeight="bold">
              {editingCategory ? "Edit Expense Category" : "New Expense Category"}
            </Typography>
            <IconButton size="small" onClick={() => setCategoryModalOpen(false)} disabled={submittingCategory}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Category Name"
                  placeholder="e.g. Lab Equipment & Chemicals"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description / Scope (Optional)"
                  placeholder="e.g. Expenditures related to science labs and chemistry practicals"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <Button onClick={() => setCategoryModalOpen(false)} disabled={submittingCategory} sx={{ color: "text.secondary" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submittingCategory}
              startIcon={submittingCategory ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ fontWeight: "bold" }}
            >
              {submittingCategory ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#b91c1c" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this {itemToDelete?.type === "expense" ? "expense record" : "category"}?
            {itemToDelete?.type === "category" && (
              <Box component="span" sx={{ display: "block", mt: 1, color: "error.main", fontWeight: 500 }}>
                Warning: Any expenses associated with this category may also be affected.
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleExecuteDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
          >
            {deleting ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
