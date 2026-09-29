"use client";

// Biometric attendance: device config + ingest token, unresolved-punch health,
// recent punches, and fingerprint-ID enrollments.
import { useEffect, useState } from "react";
import InlineCrud from "@/components/InlineCrud";
import { api } from "@/lib/api";

const BRANDS = [
  ["none", "No device (manual)"], ["zkteco", "ZKTeco"], ["essl", "ESSL"],
  ["suprema", "Suprema BioStar"], ["hikvision", "Hikvision"], ["mantra", "Mantra"],
  ["generic", "Generic JSON webhook"],
];

export default function BiometricPage() {
  const [cfg, setCfg] = useState(null);
  const [saved, setSaved] = useState("");

  function load() {
    api.get("/device-settings/").then(setCfg).catch(() => {});
  }
  useEffect(load, []);

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  async function save(e) {
    e.preventDefault();
    setSaved("");
    const updated = await api.patch("/device-settings/", {
      device_brand: cfg.device_brand, device_api_url: cfg.device_api_url,
      device_api_key: cfg.device_api_key, device_api_secret: cfg.device_api_secret,
      attendance_late_after: cfg.attendance_late_after || null,
    });
    setCfg(updated);
    setSaved("Saved ✓");
  }

  async function regen() {
    if (!confirm("Regenerate the device token? The old token stops working immediately.")) return;
    const updated = await api.post("/device-settings/", {});
    setCfg(updated);
    setSaved("Token regenerated ✓");
  }

  if (!cfg) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <h1 className="h3 mb-3">Biometric Attendance</h1>
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h2 className="h6">Device configuration</h2>
              {saved && <div className="alert alert-success py-2">{saved}</div>}
              <form onSubmit={save}>
                <div className="mb-2">
                  <label className="form-label">Device brand</label>
                  <select className="form-select" value={cfg.device_brand} onChange={(e) => set("device_brand", e.target.value)}>
                    {BRANDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Device / cloud API URL</label>
                  <input className="form-control" value={cfg.device_api_url || ""} onChange={(e) => set("device_api_url", e.target.value)} />
                </div>
                <div className="row g-2 mb-2">
                  <div className="col"><label className="form-label">API key</label>
                    <input className="form-control" value={cfg.device_api_key || ""} onChange={(e) => set("device_api_key", e.target.value)} /></div>
                  <div className="col"><label className="form-label">API secret</label>
                    <input className="form-control" placeholder="•••• (write-only)" onChange={(e) => set("device_api_secret", e.target.value)} /></div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Late after (local time)</label>
                  <input type="time" className="form-control" value={cfg.attendance_late_after || ""} onChange={(e) => set("attendance_late_after", e.target.value)} />
                  <div className="form-text">Punches at/after this time mark a student Late instead of Present.</div>
                </div>
                <button className="btn btn-primary btn-sm">Save configuration</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <h2 className="h6">Ingest endpoint</h2>
              <label className="form-label small mb-0">Push URL</label>
              <div className="input-group input-group-sm mb-2">
                <input className="form-control" readOnly value={cfg.ingest_url || ""} />
              </div>
              <label className="form-label small mb-0">Device token (X-Device-Token)</label>
              <div className="input-group input-group-sm mb-2">
                <input className="form-control font-monospace" readOnly value={cfg.device_token || "(set a brand to auto-issue)"} />
                <button className="btn btn-outline-secondary" onClick={regen} type="button">Regenerate</button>
              </div>
              <div className="d-flex gap-3">
                <span className="badge text-bg-warning">Unresolved punches: {cfg.unresolved_punches ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body table-responsive">
              <h2 className="h6">Recent punches</h2>
              <table className="table table-sm mb-0">
                <thead className="table-light"><tr><th>User ID</th><th>Time</th><th>Dir</th><th>Status</th></tr></thead>
                <tbody>
                  {(cfg.recent_punches || []).length === 0 ? (
                    <tr><td colSpan={4} className="text-muted text-center py-2">No punches yet.</td></tr>
                  ) : cfg.recent_punches.map((p) => (
                    <tr key={p.id}>
                      <td>{p.device_user_id}</td>
                      <td>{(p.punched_at || "").slice(0, 16).replace("T", " ")}</td>
                      <td>{p.direction}</td>
                      <td><span className="badge text-bg-light">{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <InlineCrud
          title="Fingerprint enrollments"
          endpoint="/biometric-enrollments/"
          help="Map a device's internal user ID to a student or a teacher."
          columns={[
            { key: "device_user_id", label: "Device user ID" },
            { key: "label", label: "Label" },
            { key: "student", label: "Student", render: (r) => (r.student ? `#${r.student}` : "—") },
            { key: "teacher", label: "Teacher", render: (r) => (r.teacher ? `#${r.teacher}` : "—") },
          ]}
          fields={[
            { key: "device_user_id", label: "Device user ID", required: true },
            { key: "label", label: "Label" },
            { key: "student", label: "Student", type: "select", optionsEndpoint: "/students/?page_size=500", optionLabelFn: (o) => `${o.full_name} (${o.admission_number})` },
            { key: "teacher", label: "Teacher", type: "select", optionsEndpoint: "/teachers/?page_size=500", optionLabel: "display_name" },
          ]}
        />
      </div>
    </div>
  );
}
