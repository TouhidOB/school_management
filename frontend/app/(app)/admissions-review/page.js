"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STATUS_BADGE = {
  pending: "text-bg-warning",
  approved: "text-bg-success",
  rejected: "text-bg-danger",
};

export default function AdmissionsReviewPage() {
  const [data, setData] = useState({ results: [] });
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [approving, setApproving] = useState(null); // application being approved
  const [placement, setPlacement] = useState({ admission_number: "", current_class: "", current_section: "", roll_number: "" });

  function load() {
    setLoading(true);
    const q = filter ? `?status=${filter}` : "";
    api.get(`/admissions/${q}`).then(setData).catch(() => setData({ results: [] })).finally(() => setLoading(false));
  }
  useEffect(load, [filter]);

  useEffect(() => {
    api.get("/classes/?page_size=200").then((d) => setClasses(d.results || d)).catch(() => {});
    api.get("/sections/?page_size=500").then((d) => setSections(d.results || d)).catch(() => {});
  }, []);

  function openApprove(app) {
    setApproving(app);
    setPlacement({
      admission_number: `${new Date().getFullYear()}-${String(data.results.length + 1).padStart(4, "0")}`,
      current_class: "", current_section: "", roll_number: "",
    });
  }

  async function confirmApprove() {
    const payload = { ...placement };
    ["current_class", "current_section"].forEach((k) => { if (payload[k] === "") payload[k] = null; });
    await api.post(`/admissions/${approving.id}/approve/`, payload);
    setApproving(null);
    load();
  }

  async function reject(id) {
    const reason = prompt("Reason for rejection (optional):") || "";
    await api.post(`/admissions/${id}/reject/`, { reason });
    load();
  }

  const sectionsForClass = placement.current_class
    ? sections.filter((s) => String(s.school_class) === String(placement.current_class))
    : sections;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Admission Applications</h1>
        <select className="form-select w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr><th>Tracking</th><th>Applicant</th><th>Class</th><th>Phone</th><th>Status</th><th className="text-end">Review</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">Loading…</td></tr>
              ) : data.results.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No applications.</td></tr>
              ) : (
                data.results.map((a) => (
                  <tr key={a.id}>
                    <td><code>{a.tracking_code || "—"}</code></td>
                    <td>{a.full_name}</td>
                    <td>{a.class_applied || "—"}</td>
                    <td>{a.phone || "—"}</td>
                    <td><span className={`badge ${STATUS_BADGE[a.status] || "text-bg-light"}`}>{a.status_display}</span></td>
                    <td className="text-end">
                      {a.status === "pending" && (
                        <>
                          <button className="btn btn-sm btn-success me-1" onClick={() => openApprove(a)}>
                            <i className="bi bi-check-lg" /> Approve
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => reject(a.id)}>
                            <i className="bi bi-x-lg" /> Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {approving && (
        <div className="modal d-block" tabIndex={-1} style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Admit {approving.full_name}</h5>
                <button className="btn-close" onClick={() => setApproving(null)} />
              </div>
              <div className="modal-body">
                <p className="text-muted small">Creates a Student record + copies guardians from the application.</p>
                <div className="mb-2">
                  <label className="form-label">Admission number</label>
                  <input className="form-control" value={placement.admission_number}
                    onChange={(e) => setPlacement({ ...placement, admission_number: e.target.value })} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Class</label>
                  <select className="form-select" value={placement.current_class}
                    onChange={(e) => setPlacement({ ...placement, current_class: e.target.value, current_section: "" })}>
                    <option value="">—</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Section</label>
                  <select className="form-select" value={placement.current_section}
                    onChange={(e) => setPlacement({ ...placement, current_section: e.target.value })}>
                    <option value="">—</option>
                    {sectionsForClass.map((s) => <option key={s.id} value={s.id}>{s.school_class_name} - {s.name}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Roll number</label>
                  <input className="form-control" value={placement.roll_number}
                    onChange={(e) => setPlacement({ ...placement, roll_number: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setApproving(null)}>Cancel</button>
                <button className="btn btn-success" onClick={confirmApprove}>
                  <i className="bi bi-check-lg me-1" /> Admit student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
