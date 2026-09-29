"use client";

// Exam admit card for one student: identity + their class's exam schedule.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";

export default function AdmitCardPage() {
  const { id, studentId } = useParams();
  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [rows, setRows] = useState([]);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    api.get(`/exam-sessions/${id}/`).then(setSession).catch(() => {});
    api.get("/school/").then(setSchool).catch(() => {});
    api.get(`/students/${studentId}/`).then((st) => {
      setStudent(st);
      api.get(`/exam-sessions/${id}/routine/`).then((d) => {
        setRows(d.filter((r) => String(r.school_class) === String(st.current_class)));
      }).catch(() => {});
    }).catch(() => {});
  }, [id, studentId]);

  if (!student) return <div className="p-4"><div className="spinner-border text-primary" /></div>;
  const color = school?.primary_color || "#2563eb";

  return (
    <PrintFrame title="Admit Card">
      <div className="print-doc" style={{ width: 640, padding: 28, fontFamily: "system-ui" }}>
        <div className="d-flex justify-content-between align-items-center" style={{ borderBottom: `3px solid ${color}`, paddingBottom: 10 }}>
          <div>
            <h3 style={{ color, margin: 0 }}>{school?.name || "School"}</h3>
            <div className="text-muted small">{school?.address}</div>
          </div>
          <div className="text-end">
            <div style={{ fontWeight: 700 }}>ADMIT CARD</div>
            <div className="small">{session?.name}</div>
          </div>
        </div>

        <div className="d-flex gap-3 mt-3">
          <div style={{ width: 80, height: 96, background: "#f1f5f9", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
            {student.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
          </div>
          <table className="table table-sm mb-0">
            <tbody>
              <tr><th>Name</th><td>{student.full_name}</td></tr>
              <tr><th>Admission #</th><td>{student.admission_number}</td></tr>
              <tr><th>Class</th><td>{student.class_name} {student.section_name && `(${student.section_name})`}</td></tr>
              <tr><th>Roll</th><td>{student.roll_number || "—"}</td></tr>
            </tbody>
          </table>
        </div>

        <h4 className="h6 mt-3">Exam schedule</h4>
        <table className="table table-bordered table-sm">
          <thead><tr style={{ background: "#f1f5f9" }}><th>Date</th><th>Time</th><th>Subject</th><th>Room</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={4} className="text-muted text-center">No subjects for this class.</td></tr> :
              rows.map((r) => (
                <tr key={r.id}><td>{r.exam_date || "—"}</td><td>{r.start_time || "—"}</td><td>{r.subject_name}</td><td>{r.exam_room || "—"}</td></tr>
              ))}
          </tbody>
        </table>

        <div className="d-flex justify-content-end mt-4 pt-3">
          <div className="text-center small text-muted">______________________<br />Controller of Examinations</div>
        </div>
      </div>
    </PrintFrame>
  );
}
