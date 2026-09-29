"use client";

// Daily staff register: mark each active teacher present + optional in/out.
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function StaffAttendancePage() {
  const [teachers, setTeachers] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({});
  const [msg, setMsg] = useState("");

  async function load() {
    const [ts, existing] = await Promise.all([
      api.get("/teachers/?status=active&page_size=500"),
      api.get(`/staff-attendance/?date=${date}&page_size=500`),
    ]);
    const by = {};
    (existing.results || existing).forEach((r) => (by[r.teacher] = r));
    const m = {};
    (ts.results || ts).forEach((t) => {
      const ex = by[t.id];
      m[t.id] = { is_present: ex ? ex.is_present : true, check_in: ex?.check_in || "", check_out: ex?.check_out || "", recordId: ex?.id || null };
    });
    setTeachers(ts.results || ts);
    setMarks(m);
  }
  useEffect(() => { load(); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  function upd(id, patch) {
    setMarks((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  }

  async function save() {
    setMsg("Saving…");
    for (const t of teachers) {
      const mk = marks[t.id];
      const body = {
        teacher: t.id, date, is_present: mk.is_present,
        check_in: mk.check_in || null, check_out: mk.check_out || null,
      };
      if (mk.recordId) await api.patch(`/staff-attendance/${mk.recordId}/`, body);
      else await api.post("/staff-attendance/", body);
    }
    setMsg("Saved ✓");
    load();
  }

  const presentCount = Object.values(marks).filter((m) => m.is_present).length;

  return (
    <div>
      <h1 className="h3 mb-3">Staff Attendance</h1>
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body d-flex gap-3 align-items-end">
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="ms-auto text-muted">{presentCount} / {teachers.length} present {msg && `· ${msg}`}</div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body table-responsive">
          {teachers.length === 0 ? <p className="text-muted mb-0">No active teachers.</p> : (
            <>
              <table className="table align-middle mb-0">
                <thead className="table-light"><tr><th>Teacher</th><th>Present</th><th>Check-in</th><th>Check-out</th></tr></thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id}>
                      <td>{t.display_name}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input type="checkbox" className="form-check-input" checked={!!marks[t.id]?.is_present}
                            onChange={(e) => upd(t.id, { is_present: e.target.checked })} />
                        </div>
                      </td>
                      <td><input type="time" className="form-control form-control-sm" style={{ width: 130 }} value={marks[t.id]?.check_in || ""} onChange={(e) => upd(t.id, { check_in: e.target.value })} /></td>
                      <td><input type="time" className="form-control form-control-sm" style={{ width: 130 }} value={marks[t.id]?.check_out || ""} onChange={(e) => upd(t.id, { check_out: e.target.value })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-success mt-3" onClick={save}><i className="bi bi-check-lg me-1" /> Save</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
