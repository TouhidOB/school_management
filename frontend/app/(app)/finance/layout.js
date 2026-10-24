"use client";

import { usePathname, useRouter } from "next/navigation";
import { Box, Typography, Tabs, Tab, Paper, Chip } from "@mui/material";
import ModuleGuard from "@/components/ModuleGuard";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

const FINANCE_TABS = [
  { label: "Overview & Wallet", path: "/finance", icon: <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} /> },
  { label: "Fee Structures", path: "/finance/fee-structure", icon: <AccountTreeOutlinedIcon sx={{ fontSize: 18 }} /> },
  { label: "Student Dues & Pay", path: "/finance/collection", icon: <PaidOutlinedIcon sx={{ fontSize: 18 }} /> },
  { label: "Invoices & Receipts", path: "/finance/invoices", icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} /> },
  { label: "Teacher & Staff Salary", path: "/finance/salaries", icon: <BadgeOutlinedIcon sx={{ fontSize: 18 }} /> },
  { label: "Expenses", path: "/finance/expenses", icon: <TrendingDownOutlinedIcon sx={{ fontSize: 18 }} /> },
  { label: "Discounts & Waivers", path: "/finance/discounts", icon: <CardGiftcardOutlinedIcon sx={{ fontSize: 18 }} /> },
  { label: "Reports & Audit", path: "/finance/reports", icon: <AssessmentOutlinedIcon sx={{ fontSize: 18 }} /> },
];

export default function FinanceLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Find active tab index based on exact path match, or default to 0 for the base /finance
  const currentTabIndex = FINANCE_TABS.findIndex((tab) => {
    if (tab.path === "/finance") return pathname === "/finance";
    return pathname.startsWith(tab.path);
  });
  const activeTab = currentTabIndex === -1 ? 0 : currentTabIndex;

  const handleTabChange = (event, newValue) => {
    router.push(FINANCE_TABS[newValue].path);
  };

  return (
    <ModuleGuard moduleKey="finance">
      <Box sx={{ maxWidth: 1400, mx: "auto", pb: 6 }}>
        {/* Header bar */}
        <Box sx={{ mb: 2.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
              Finance & Accounting
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.3 }}>
              Manage fee structures, student dues collection, staff payroll, and institutional expenses.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip label="Fiscal Year: 2026" size="small" variant="outlined" sx={{ fontWeight: 600, color: "#475569" }} />
            <Chip label="Active" size="small" color="success" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
          </Box>
        </Box>

        {/* Navigation Tabs Bar */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 2.5,
            bgcolor: "#ffffff",
            mb: 3,
            px: 1,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)"
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                minHeight: 48,
                py: 1,
                px: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "#64748b",
                "&.Mui-selected": {
                  color: "#1e3a8a",
                  fontWeight: 700,
                },
              },
              "& .MuiTabs-indicator": {
                height: 3,
                borderRadius: "3px 3px 0 0",
                backgroundColor: "#1e3a8a",
              },
            }}
          >
            {FINANCE_TABS.map((tab, idx) => (
              <Tab
                key={idx}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>

        {/* Page Content */}
        {children}
      </Box>
    </ModuleGuard>
  );
}
