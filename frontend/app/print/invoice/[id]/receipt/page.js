"use client";

// Professional Money Receipt / Invoice for students, accountants, and parents.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";

export default function ReceiptPage() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    api.get(`/invoices/${id}/`).then(setInv).catch(() => {});
    api.get("/school/").then(setSchool).catch(() => {});
  }, [id]);

  if (!inv) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Invoice Receipt...</span>
        </div>
      </div>
    );
  }

  const color = school?.primary_color || "#1e3a8a";
  const paid = (inv.payments || []).reduce((t, p) => t + Number(p.amount_paid), 0);
  const due = Math.max(0, Number(inv.grand_total) - paid);
  const isPaid = inv.status === "paid" || due === 0;

  const formatMoney = (amount) => {
    return "৳" + parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <PrintFrame title={`Invoice Receipt - ${inv.invoice_number}`}>
      <div
        className="print-doc bg-white"
        style={{
          width: 780,
          padding: "36px 42px",
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#1e293b",
          position: "relative",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          borderRadius: 8
        }}
      >
        {/* Paid Stamp Watermark */}
        {isPaid && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              right: "12%",
              transform: "rotate(-18deg)",
              border: "4px solid #16a34a",
              color: "#16a34a",
              padding: "8px 24px",
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: "uppercase",
              borderRadius: 8,
              opacity: 0.25,
              pointerEvents: "none",
              userSelect: "none"
            }}
          >
            PAID
          </div>
        )}

        {/* Header Block */}
        <div
          className="d-flex justify-content-between align-items-start pb-3 mb-3"
          style={{ borderBottom: `3px solid ${color}` }}
        >
          <div style={{ maxWidth: 460 }}>
            {school?.logo && (
              <img
                src={school.logo}
                alt="Logo"
                style={{ height: 48, objectFit: "contain", marginBottom: 8 }}
              />
            )}
            <h2 style={{ color, margin: 0, fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>
              {school?.name || "Famous Academy"}
            </h2>
            <div className="small text-muted mt-1" style={{ fontSize: 13, lineHeight: 1.4 }}>
              {school?.address && <div>{school.address}</div>}
              {(school?.phone || school?.email) && (
                <div>
                  {school?.phone && <span>Phone: {school.phone}</span>}
                  {school?.phone && school?.email && <span> · </span>}
                  {school?.email && <span>Email: {school.email}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="text-end">
            <div
              style={{
                background: color,
                color: "#ffffff",
                padding: "4px 14px",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: 1.5,
                borderRadius: 4,
                display: "inline-block",
                marginBottom: 6
              }}
            >
              FEE INVOICE & RECEIPT
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              #{inv.invoice_number}
            </div>
            <div className="small text-muted" style={{ fontSize: 12 }}>
              Date: <strong>{inv.invoice_date}</strong>
            </div>
            {inv.due_date && (
              <div className="small" style={{ fontSize: 12, color: due > 0 ? "#dc2626" : "#64748b" }}>
                Due: <strong>{inv.due_date}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Student & Invoice Meta Information Card */}
        <div
          className="p-3 mb-4 rounded"
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0"
          }}
        >
          <div className="row g-2">
            <div className="col-7">
              <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
                Billed To (Student)
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                {inv.student_name}
              </div>
              <div className="small text-muted mt-0.5">
                {inv.student_class && <span>Class: <strong>{inv.student_class}</strong></span>}
                {inv.student_class && inv.student_roll && <span> · </span>}
                {inv.student_roll && <span>Roll No: <strong>{inv.student_roll}</strong></span>}
              </div>
            </div>

            <div className="col-5 text-end">
              <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
                Payment Status
              </div>
              <div className="mt-1">
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    backgroundColor: isPaid ? "#dcfce7" : due < Number(inv.grand_total) ? "#fef3c7" : "#fee2e2",
                    color: isPaid ? "#15803d" : due < Number(inv.grand_total) ? "#b45309" : "#b91c1c",
                    border: `1px solid ${isPaid ? "#86efac" : due < Number(inv.grand_total) ? "#fde68a" : "#fca5a5"}`
                  }}
                >
                  {inv.status_display || inv.status?.replace("_", " ")}
                </span>
              </div>
              <div className="small text-muted mt-1" style={{ fontSize: 11 }}>
                Academic Year: <strong>{inv.academic_year_name || "Current Year"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="table table-bordered mb-4" style={{ fontSize: 13, borderColor: "#e2e8f0" }}>
          <thead style={{ background: "#f1f5f9" }}>
            <tr>
              <th style={{ width: 40, textAlign: "center", color: "#475569" }}>#</th>
              <th style={{ color: "#475569", fontWeight: 700 }}>Particulars / Fee Description</th>
              <th className="text-end" style={{ width: 140, color: "#475569", fontWeight: 700 }}>Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {(inv.line_items && inv.line_items.length > 0) ? (
              inv.line_items.map((li, i) => (
                <tr key={i}>
                  <td className="text-center text-muted" style={{ fontWeight: 500 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: "#1e293b" }}>
                    {li.description || li.label || li.name || "Fee Item"}
                  </td>
                  <td className="text-end" style={{ fontWeight: 600, fontFamily: "monospace" }}>
                    {formatMoney(li.amount)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-center text-muted">1</td>
                <td style={{ fontWeight: 600, color: "#1e293b" }}>General Academic / Promotion Fee</td>
                <td className="text-end" style={{ fontWeight: 600, fontFamily: "monospace" }}>
                  {formatMoney(inv.subtotal || inv.grand_total)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="text-end fw-semibold text-muted" style={{ borderTop: "2px solid #cbd5e1" }}>
                Subtotal
              </td>
              <td className="text-end fw-semibold" style={{ borderTop: "2px solid #cbd5e1", fontFamily: "monospace" }}>
                {formatMoney(inv.subtotal)}
              </td>
            </tr>
            {Number(inv.total_discount) > 0 && (
              <tr>
                <td colSpan={2} className="text-end text-success fw-semibold">
                  Special Discount / Waiver
                </td>
                <td className="text-end text-success fw-semibold" style={{ fontFamily: "monospace" }}>
                  -{formatMoney(inv.total_discount)}
                </td>
              </tr>
            )}
            {Number(inv.late_fine) > 0 && (
              <tr>
                <td colSpan={2} className="text-end text-danger fw-semibold">
                  Late Fine / Penalty
                </td>
                <td className="text-end text-danger fw-semibold" style={{ fontFamily: "monospace" }}>
                  +{formatMoney(inv.late_fine)}
                </td>
              </tr>
            )}
            <tr style={{ background: "#f8fafc", fontSize: 15 }}>
              <td colSpan={2} className="text-end fw-bold" style={{ color: "#0f172a" }}>
                Grand Total Payable
              </td>
              <td className="text-end fw-bold" style={{ color: "#0f172a", fontFamily: "monospace" }}>
                {formatMoney(inv.grand_total)}
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="text-end fw-bold text-success">
                Total Amount Paid
              </td>
              <td className="text-end fw-bold text-success" style={{ fontFamily: "monospace" }}>
                {formatMoney(paid)}
              </td>
            </tr>
            <tr style={{ background: due > 0 ? "#fef2f2" : "#f0fdf4" }}>
              <td colSpan={2} className="text-end fw-bold" style={{ color: due > 0 ? "#b91c1c" : "#15803d" }}>
                Balance Due
              </td>
              <td className="text-end fw-bold" style={{ color: due > 0 ? "#b91c1c" : "#15803d", fontFamily: "monospace", fontSize: 15 }}>
                {formatMoney(due)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment Receipts History */}
        {(inv.payments || []).length > 0 && (
          <div className="mb-4">
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#475569", marginBottom: 8 }}>
              Recorded Payment History
            </h4>
            <table className="table table-sm table-bordered" style={{ fontSize: 12, borderColor: "#e2e8f0" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={{ color: "#475569" }}>Receipt Date</th>
                  <th style={{ color: "#475569" }}>Method</th>
                  <th style={{ color: "#475569" }}>Transaction / Ref #</th>
                  <th className="text-end" style={{ color: "#475569" }}>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {inv.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{(p.paid_at || "").slice(0, 10)}</td>
                    <td className="text-capitalize">{p.method_display || p.payment_method || "Cash"}</td>
                    <td className="font-monospace text-muted">{p.transaction_id || "—"}</td>
                    <td className="text-end fw-bold text-success" style={{ fontFamily: "monospace" }}>
                      {formatMoney(p.amount_paid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Instructions & Footnote */}
        <div
          className="p-2.5 rounded mb-5"
          style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", fontSize: 11, color: "#64748b", lineHeight: 1.4 }}
        >
          <strong>Notice:</strong> This is an officially generated computer bill/receipt from {school?.name || "Famous Academy"}.
          Please preserve this receipt for fee clearance, examinations, and academic promotion verification.
        </div>

        {/* Formal Signature Blocks */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            textAlign: "center",
            marginTop: 40,
            paddingTop: 10
          }}
        >
          <div className="text-center" style={{ width: 180 }}>
            <div style={{ borderBottom: "1px solid #94a3b8", height: 28, marginBottom: 6 }}></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Student / Parent</div>
            <div className="text-muted" style={{ fontSize: 10 }}>Acknowledged</div>
          </div>

          <div className="text-center" style={{ width: 180 }}>
            <div style={{ borderBottom: "1px solid #94a3b8", height: 28, marginBottom: 6 }}></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Cashier / Accounts Office</div>
            <div className="text-muted" style={{ fontSize: 10 }}>Received & Verified</div>
          </div>

          <div className="text-center" style={{ width: 180 }}>
            <div style={{ borderBottom: "1px solid #94a3b8", height: 28, marginBottom: 6 }}></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Head of Institution / Bursar</div>
            <div className="text-muted" style={{ fontSize: 10 }}>Official Seal</div>
          </div>
        </div>
      </div>
    </PrintFrame>
  );
}

