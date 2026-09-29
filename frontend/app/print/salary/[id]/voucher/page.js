"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";

// Helper to convert number to Bangladeshi Taka in words
function numberToWordsBDT(num) {
  const n = Math.floor(Number(num) || 0);
  if (n === 0) return "Zero Taka Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", 
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(number) {
    let current = "";
    if (number >= 100) {
      current += ones[Math.floor(number / 100)] + " Hundred ";
      number %= 100;
    }
    if (number >= 20) {
      current += tens[Math.floor(number / 20)] + " ";
      number %= 20;
    }
    if (number > 0) {
      current += ones[number] + " ";
    }
    return current.trim();
  }

  let crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let words = "";
  if (crore > 0) words += convertLessThanThousand(crore) + " Crore ";
  if (lakh > 0) words += convertLessThanThousand(lakh) + " Lakh ";
  if (thousand > 0) words += convertLessThanThousand(thousand) + " Thousand ";
  if (remainder > 0) words += convertLessThanThousand(remainder) + " ";

  return words.trim() + " Taka Only";
}

export default function SalaryVoucherPage() {
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    api.get(`/salary-payments/${id}/`).then(setVoucher).catch(() => {});
    api.get("/school/").then(setSchool).catch(() => {});
  }, [id]);

  if (!voucher) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          <div style={{ fontWeight: 600 }}>Loading Salary Voucher...</div>
        </div>
      </div>
    );
  }

  const primaryColor = school?.primary_color || "#1e3a8a";

  const formatMoney = (amount) => {
    return "৳" + parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formattedVoucherNo = `VCH-${String(voucher.id).padStart(4, '0')}`;

  return (
    <PrintFrame title={`Salary Voucher - ${voucher.employee_name} (${formattedVoucherNo})`}>
      <div
        className="print-doc"
        style={{
          width: 800,
          margin: "0 auto",
          backgroundColor: "#ffffff",
          padding: "40px 48px",
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
          color: "#0f172a",
          position: "relative",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          borderRadius: 12,
          border: "1px solid #e2e8f0"
        }}
      >
        {/* Paid Stamp Watermark */}
        <div
          style={{
            position: "absolute",
            top: "38%",
            right: "10%",
            transform: "rotate(-18deg)",
            border: "4px solid #16a34a",
            color: "#16a34a",
            padding: "8px 26px",
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: "uppercase",
            borderRadius: 10,
            opacity: 0.22,
            pointerEvents: "none",
            userSelect: "none"
          }}
        >
          PAID
        </div>

        {/* Top Header Block */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: `3px solid ${primaryColor}`,
            paddingBottom: 18,
            marginBottom: 24
          }}
        >
          <div style={{ maxWidth: 460 }}>
            {school?.logo && (
              <img
                src={school.logo}
                alt="Logo"
                style={{ height: 50, objectFit: "contain", marginBottom: 8 }}
              />
            )}
            <h1 style={{ color: primaryColor, margin: 0, fontWeight: 800, fontSize: 25, letterSpacing: -0.5 }}>
              {school?.name || "Famous Academy"}
            </h1>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4, lineHeight: 1.5 }}>
              {school?.address && <div>{school.address}</div>}
              <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                {school?.phone && <span><strong>Phone:</strong> {school.phone}</span>}
                {school?.email && <span><strong>Email:</strong> {school.email}</span>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                backgroundColor: primaryColor,
                color: "#ffffff",
                padding: "6px 16px",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 1.5,
                borderRadius: 6,
                display: "inline-block",
                marginBottom: 8,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              SALARY PAYMENT VOUCHER
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", fontFamily: "monospace" }}>
              {formattedVoucherNo}
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
              Date: <strong style={{ color: "#0f172a" }}>{voucher.payment_date}</strong>
            </div>
            <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>
              ✓ Central Treasury Debited
            </div>
          </div>
        </div>

        {/* 2-Column Info Cards: Employee on Left, Payroll on Right */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {/* Employee Card */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "14px 18px"
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: primaryColor,
                marginBottom: 8,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 4
              }}
            >
              Employee Details
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
              {voucher.employee_name}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", rowGap: 4, fontSize: 13, color: "#334155" }}>
              <span style={{ color: "#64748b" }}>Employee ID:</span>
              <strong style={{ fontFamily: "monospace" }}>{voucher.employee_id || `EMP-${voucher.id}`}</strong>
              
              <span style={{ color: "#64748b" }}>Designation:</span>
              <strong>{voucher.designation || "Staff Member"}</strong>

              <span style={{ color: "#64748b" }}>Category:</span>
              <span style={{ textTransform: "capitalize" }}>
                <strong>{voucher.employee_type_display || voucher.employee_type}</strong>
              </span>
            </div>
          </div>

          {/* Payroll Period Card */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "14px 18px"
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: primaryColor,
                marginBottom: 8,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 4
              }}
            >
              Payroll Period & Payment Mode
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
              {voucher.period_label || voucher.payment_date}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", rowGap: 4, fontSize: 13, color: "#334155" }}>
              <span style={{ color: "#64748b" }}>Payment Basis:</span>
              <strong style={{ textTransform: "capitalize" }}>
                {voucher.payment_basis_display || voucher.payment_basis}
              </strong>

              <span style={{ color: "#64748b" }}>Payment Method:</span>
              <strong style={{ textTransform: "capitalize" }}>
                {voucher.payment_method_display || voucher.payment_method}
              </strong>

              <span style={{ color: "#64748b" }}>Transaction Ref:</span>
              <span style={{ fontFamily: "monospace" }}>
                {voucher.transaction_id || "Cash Treasury Debit"}
              </span>
            </div>
          </div>
        </div>

        {/* Payout Breakdown Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 20,
            fontSize: 13,
            border: "1px solid #cbd5e1"
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
              <th style={{ width: 45, textAlign: "center", padding: "10px 8px", color: "#334155", fontWeight: 700 }}>#</th>
              <th style={{ textAlign: "left", padding: "10px 14px", color: "#334155", fontWeight: 700 }}>
                Compensation Item / Earnings & Deductions Description
              </th>
              <th style={{ width: 140, textAlign: "center", padding: "10px 10px", color: "#334155", fontWeight: 700 }}>
                Type
              </th>
              <th style={{ width: 160, textAlign: "right", padding: "10px 14px", color: "#334155", fontWeight: 700 }}>
                Amount (BDT)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ textAlign: "center", color: "#64748b", padding: "11px 8px" }}>1</td>
              <td style={{ padding: "11px 14px", fontWeight: 600, color: "#0f172a" }}>
                Basic Salary / Wages ({voucher.payment_basis_display || voucher.payment_basis})
              </td>
              <td style={{ textAlign: "center", padding: "11px 10px", color: "#475569" }}>
                Base Pay
              </td>
              <td style={{ textAlign: "right", padding: "11px 14px", fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>
                {formatMoney(voucher.basic_salary)}
              </td>
            </tr>

            {Number(voucher.allowance) > 0 && (
              <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f0fdf4" }}>
                <td style={{ textAlign: "center", color: "#16a34a", padding: "11px 8px" }}>2</td>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: "#16a34a" }}>
                  Special Allowances / Performance Bonus
                </td>
                <td style={{ textAlign: "center", padding: "11px 10px", color: "#16a34a", fontWeight: 600 }}>
                  Addition (+)
                </td>
                <td style={{ textAlign: "right", padding: "11px 14px", fontWeight: 700, color: "#16a34a", fontFamily: "monospace", fontSize: 14 }}>
                  +{formatMoney(voucher.allowance)}
                </td>
              </tr>
            )}

            {Number(voucher.deduction) > 0 && (
              <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fef2f2" }}>
                <td style={{ textAlign: "center", color: "#dc2626", padding: "11px 8px" }}>
                  {Number(voucher.allowance) > 0 ? 3 : 2}
                </td>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: "#dc2626" }}>
                  Authorized Deductions / Leaves / Penalty
                </td>
                <td style={{ textAlign: "center", padding: "11px 10px", color: "#dc2626", fontWeight: 600 }}>
                  Deduction (-)
                </td>
                <td style={{ textAlign: "right", padding: "11px 14px", fontWeight: 700, color: "#dc2626", fontFamily: "monospace", fontSize: 14 }}>
                  -{formatMoney(voucher.deduction)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#ecfdf5", borderTop: "2px solid #86efac", borderBottom: "2px solid #86efac" }}>
              <td colSpan={3} style={{ textAlign: "right", padding: "12px 14px", fontWeight: 800, fontSize: 15, color: "#15803d" }}>
                Total Net Salary Disbursed & Paid:
              </td>
              <td style={{ textAlign: "right", padding: "12px 14px", fontWeight: 900, fontFamily: "monospace", fontSize: 17, color: "#15803d" }}>
                {formatMoney(voucher.amount_paid)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in Words */}
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 13,
            color: "#1e293b",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <span style={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.5 }}>
            Amount in Words:
          </span>
          <span style={{ fontWeight: 700, color: "#0f172a", fontStyle: "italic" }}>
            {numberToWordsBDT(voucher.amount_paid)}
          </span>
        </div>

        {voucher.notes && (
          <div
            style={{
              padding: "10px 16px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 12,
              color: "#334155",
              marginBottom: 20
            }}
          >
            <strong>Remarks / Notes:</strong> {voucher.notes}
          </div>
        )}

        {/* Official Notice */}
        <div
          style={{
            padding: "8px 14px",
            backgroundColor: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: 6,
            fontSize: 11,
            color: "#64748b",
            lineHeight: 1.4,
            marginBottom: 36
          }}
        >
          <strong>Notice:</strong> This is an officially generated computer payroll voucher from {school?.name || "Famous Academy"}.
          Debited directly from the School Central Treasury Account. Please retain this voucher for taxation and audit records.
        </div>

        {/* SIGNATURE & AUTHORIZATION SECTION (CIRCLED IN USER FEEDBACK) */}
        {/* Professional 3-column layout distributed horizontally across the bottom */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 40,
            paddingTop: 10
          }}
        >
          {/* Column 1: Employee / Payee */}
          <div style={{ width: 210, textAlign: "center" }}>
            <div style={{ height: 38 }}></div>
            <div style={{ borderTop: "1.5px solid #475569", paddingTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Employee / Payee
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Received with Thanks
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginTop: 3 }}>
                {voucher.employee_name}
              </div>
            </div>
          </div>

          {/* Column 2: Cashier / Accounts Officer */}
          <div style={{ width: 210, textAlign: "center" }}>
            <div style={{ height: 38 }}></div>
            <div style={{ borderTop: "1.5px solid #475569", paddingTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Accounts Officer / Cashier
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Disbursed & Debited
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginTop: 3 }}>
                Date: {voucher.payment_date}
              </div>
            </div>
          </div>

          {/* Column 3: Head of Institution / Bursar */}
          <div style={{ width: 210, textAlign: "center" }}>
            <div style={{ height: 38, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div
                style={{
                  border: "1px dashed #cbd5e1",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.5
                }}
              >
                Seal
              </div>
            </div>
            <div style={{ borderTop: "1.5px solid #475569", paddingTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Head of Institution
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Principal / Authorized Bursar
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#334155", marginTop: 3 }}>
                Approved & Passed
              </div>
            </div>
          </div>
        </div>
      </div>
    </PrintFrame>
  );
}

