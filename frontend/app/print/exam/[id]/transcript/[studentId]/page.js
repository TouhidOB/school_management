"use client";

// Student transcript / mark sheet for one exam session.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";

export default function TranscriptPage() {
  const { id, studentId } = useParams();
  const [t, setT] = useState(null);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    api.get(`/exam-sessions/${id}/transcript/${studentId}/`).then(setT).catch(() => {});
    api.get("/school/").then(setSchool).catch(() => {});
  }, [id, studentId]);

  if (!t) return <div className="p-4"><div className="spinner-border text-primary" /></div>;
  const color = school?.primary_color || "#2563eb";

  return (
    <PrintFrame title="Transcript">
      <div className="print-doc" style={{ width: 700, padding: 32, fontFamily: "system-ui" }}>
        <div className="text-center" style={{ borderBottom: `3px solid ${color}`, paddingBottom: 12 }}>
          <h2 style={{ color, margin: 0 }}>{school?.name || "School"}</h2>
          <div style={{ fontWeight: 700, marginTop: 6 }}>{t.session} — Mark Sheet</div>
        </div>

        <div className="d-flex justify-content-between my-3">
          <div><strong>Student:</strong> {t.student}</div>
          <div><strong>Percentage:</strong> {t.percentage}%</div>
        </div>

        <table className="table table-bordered">
          <thead><tr style={{ background: "#f1f5f9" }}><th>Subject</th><th className="text-center">Total</th><th className="text-center">Pass</th><th className="text-center">Obtained</th><th className="text-center">Grade</th></tr></thead>
          <tbody>
            {t.lines.length === 0 ? <tr><td colSpan={5} className="text-muted text-center">No results.</td></tr> :
              t.lines.map((l, i) => (
                <tr key={i}>
                  <td>{l.subject}</td>
                  <td className="text-center">{l.total_marks}</td>
                  <td className="text-center">{l.pass_marks}</td>
                  <td className="text-center">{l.is_absent ? "Absent" : l.marks_obtained}</td>
                  <td className="text-center">{l.grade || "—"}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr><th colSpan={3} className="text-end">Total</th><th className="text-center">{t.total_obtained} / {t.total_possible}</th><th></th></tr>
          </tfoot>
        </table>

        <div className="d-flex justify-content-between mt-5 pt-3">
          <div className="text-center small text-muted">______________________<br />Class teacher</div>
          <div className="text-center small text-muted">______________________<br />Principal</div>
        </div>
      </div>
    </PrintFrame>
  );
}
