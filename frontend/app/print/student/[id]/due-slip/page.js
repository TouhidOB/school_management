"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";

export default function StudentDueSlipPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/student-dues/${id}/`),
      api.get("/school/")
    ])
      .then(([duesRes, schoolRes]) => {
        setData(duesRes);
        setSchool(schoolRes);
      })
      .catch((err) => {
        console.error("Failed to load student due statement", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !data) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Student Fee Due Slip...</span>
        </div>
      </div>
    );
  }

  const { student, summary, invoices = [], payments = [] } = data;
  const color = school?.primary_color || "#1e3a8a";
  const isPaid = summary.net_due <= 0 && summary.total_billed > 0;
  const isPending = summary.net_due > 0;

  const formatMoney = (amount) => {
    return "৳" + parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const todayStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <PrintFrame title={`Fee Statement - ${student.full_name} (${student.roll_number})`}>
      <div
        className="print-doc bg-white"
        style={{
          width: 780,
          padding: "36px 42px",
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#1e293b",
          position: "relative",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          borderRadius: 8,
          margin: "0 auto"
        }}
      >
        {/* Paid Stamp Watermark */}
        {isPaid && (
          <div
            style={{
              position: "absolute",
              top: "38%",
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
              opacity: 0.22,
              pointerEvents: "none",
              userSelect: "none"
            }}
          >
            ALL DUES CLEARED
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
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                textTransform: "uppercase",
                background: isPending ? "#fef2f2" : "#ecfdf5",
                color: isPending ? "#dc2626" : "#16a34a",
                border: `1px solid ${isPending ? "#fecaca" : "#a7f3d0"}`
              }}
            >
              {isPending ? "STUDENT FEE DUE STATEMENT" : "FEE CLEARANCE CERTIFICATE"}
            </span>
            <div className="mt-2" style={{ fontSize: 13, color: "#64748b" }}>
              <div><strong>Statement Date:</strong> {todayStr}</div>
              <div><strong>Academic Year:</strong> {student.academic_year || "Current"}</div>
            </div>
          </div>
        </div>

        {/* Student Details Card */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            padding: "12px 18px",
            marginBottom: 20
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.5, marginBottom: 8 }}>
            STUDENT IDENTIFICATION & ENROLLMENT PARTICULARS
          </div>
          <div className="row g-2" style={{ fontSize: 13 }}>
            <div className="col-7">
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 4 }}>
                {student.full_name}
              </div>
              <div>
                <span className="text-muted">Class & Section: </span>
                <strong>{student.class_name}</strong>
                {student.section_name && student.section_name !== "—" && (
                  <span> ({student.section_name})</span>
                )}
              </div>
              {student.phone && student.phone !== "—" && (
                <div>
                  <span className="text-muted">Guardian Contact: </span>
                  <span>{student.phone}</span>
                </div>
              )}
            </div>

            <div className="col-5 text-end">
              <div>
                <span className="text-muted">Roll Number: </span>
                <strong style={{ fontSize: 15, color: "#0f172a" }}>#{student.roll_number}</strong>
              </div>
              <div>
                <span className="text-muted">Student ID: </span>
                <strong style={{ fontFamily: "monospace", color: "#2563eb" }}>{student.admission_number}</strong>
              </div>
              <div className="mt-1">
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: isPending ? "#fee2e2" : "#dcfce7",
                    color: isPending ? "#991b1b" : "#166534"
                  }}
                >
                  Status: {isPending ? "PENDING DUES" : "ALL PAID"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Fee Dues Table */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>
            FEE PARTICULARS & CHARGES BREAKDOWN
          </div>
          <table
            className="table table-bordered mb-0"
            style={{ fontSize: 13, borderColor: "#e2e8f0" }}
          >
            <thead style={{ background: "#f1f5f9" }}>
              <tr>
                <th style={{ width: 36, textAlign: "center", fontWeight: 700 }}>#</th>
                <th style={{ fontWeight: 700 }}>Fee Item / Description</th>
                <th style={{ width: 140, fontWeight: 700 }}>Invoice #</th>
                <th style={{ width: 110, textAlign: "right", fontWeight: 700 }}>Billed</th>
                <th style={{ width: 100, textAlign: "right", fontWeight: 700 }}>Paid</th>
                <th style={{ width: 110, textAlign: "right", fontWeight: 700 }}>Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    No fee records found for this student.
                  </td>
                </tr>
              ) : (
                invoices.map((inv, idx) => {
                  const itemNames = inv.items?.map(it => it.description).join(", ") || inv.invoice_number;
                  return (
                    <tr key={inv.id}>
                      <td style={{ textAlign: "center", color: "#64748b" }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{itemNames}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          Issued: {inv.invoice_date} {inv.due_date ? `· Due: ${inv.due_date}` : ""}
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "#2563eb" }}>
                        {inv.invoice_number}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                        {formatMoney(inv.grand_total)}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", color: "#16a34a" }}>
                        {formatMoney(inv.amount_paid)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          color: inv.due_amount > 0 ? "#dc2626" : "#16a34a"
                        }}
                      >
                        {formatMoney(inv.due_amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Total Dues Box */}
        <div
          className="d-flex justify-content-end mb-4"
        >
          <div
            style={{
              width: 320,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "12px 18px",
              fontSize: 13
            }}
          >
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Total Fees Billed:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                {formatMoney(summary.total_billed)}
              </span>
            </div>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Total Amount Paid:</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#16a34a" }}>
                {formatMoney(summary.total_paid)}
              </span>
            </div>
            <div
              className="d-flex justify-content-between pt-2 mt-2"
              style={{
                borderTop: "2px solid #cbd5e1",
                fontSize: 15,
                fontWeight: 800
              }}
            >
              <span style={{ color: isPending ? "#dc2626" : "#16a34a" }}>
                Net Balance Due:
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: isPending ? "#dc2626" : "#16a34a"
                }}
              >
                {formatMoney(summary.net_due)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Table (if payments exist) */}
        {payments.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>
              RECORDED PAYMENT TRANSACTIONS ({payments.length})
            </div>
            <table
              className="table table-sm table-bordered mb-0"
              style={{ fontSize: 12, borderColor: "#e2e8f0" }}
            >
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={{ fontWeight: 600 }}>Payment Date</th>
                  <th style={{ fontWeight: 600 }}>Invoice #</th>
                  <th style={{ fontWeight: 600 }}>Payment Method</th>
                  <th style={{ fontWeight: 600 }}>Transaction ID / Ref</th>
                  <th style={{ textAlign: "right", fontWeight: 600 }}>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.paid_at).toLocaleDateString("en-GB")}</td>
                    <td style={{ fontFamily: "monospace" }}>{p.invoice_number}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.payment_method}</td>
                    <td style={{ fontFamily: "monospace" }}>{p.transaction_id}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#16a34a" }}>
                      {formatMoney(p.amount_paid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Notice */}
        <div
          style={{
            background: "#f1f5f9",
            border: "1px dashed #cbd5e1",
            borderRadius: 6,
            padding: "10px 14px",
            fontSize: 11,
            color: "#475569",
            marginBottom: 44,
            lineHeight: 1.5
          }}
        >
          <strong>Notice:</strong> This document is an officially generated computer statement from {school?.name || "the institution"}. It details all pending fee allocations and recorded payments for this student. Please retain this slip for student fee clearance, term examination admission, and administrative verification.
        </div>

        {/* Signature Blocks */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            textAlign: "center",
            fontSize: 12,
            color: "#475569",
            paddingTop: 10
          }}
        >
          <div style={{ width: 190 }}>
            <div style={{ borderTop: "1px solid #94a3b8", paddingTop: 6, fontWeight: 600 }}>
              Student / Guardian
            </div>
            <div className="text-muted" style={{ fontSize: 10 }}>Acknowledged Signature</div>
          </div>

          <div style={{ width: 210 }}>
            <div style={{ borderTop: "1px solid #94a3b8", paddingTop: 6, fontWeight: 600 }}>
              Cashier / Accounts Office
            </div>
            <div className="text-muted" style={{ fontSize: 10 }}>Received & Verified</div>
          </div>

          <div style={{ width: 210 }}>
            <div style={{ borderTop: "1px solid #94a3b8", paddingTop: 6, fontWeight: 600 }}>
              Head of Institution
            </div>
            <div className="text-muted" style={{ fontSize: 10 }}>Authorized Official Seal</div>
          </div>
        </div>
      </div>
    </PrintFrame>
  );
}
