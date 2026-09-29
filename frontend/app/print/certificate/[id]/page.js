"use client";

// Certificate print with {placeholder} substitution from the student + school,
// including gender-correct pronouns. Unknown tokens are left untouched.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import PrintFrame from "@/components/PrintFrame";

function buildContext(cert, student, school) {
  const g = (student?.gender || "").toLowerCase();
  const he_she = g === "female" ? "she" : g === "male" ? "he" : "they";
  const him_her = g === "female" ? "her" : g === "male" ? "him" : "them";
  const his_her = g === "female" ? "her" : g === "male" ? "his" : "their";
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  const section = student?.section_name || "";
  return {
    student_name: student?.full_name || "",
    first_name: (student?.full_name || "").split(" ")[0],
    admission_no: student?.admission_number || "",
    roll: student?.roll_number || "",
    class: student?.class_name || "",
    section,
    section_clause: section ? `, section ${section}` : "",
    dob: student?.dob || "",
    gender: student?.gender || "",
    school: school?.name || "",
    school_address: school?.address || "",
    date: cert?.issue_date || new Date().toISOString().slice(0, 10),
    ref_no: cert?.reference_no || "",
    he_she, him_her, his_her,
    he_she_cap: cap(he_she), his_her_cap: cap(his_her),
  };
}

function substitute(text, ctx) {
  return (text || "").replace(/\{(\w+)\}/g, (m, key) => (key in ctx ? ctx[key] : m));
}

export default function CertificatePrintPage() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    api.get(`/certificates/${id}/`).then((c) => {
      setCert(c);
      if (c.student) api.get(`/students/${c.student}/`).then(setStudent).catch(() => {});
    }).catch(() => {});
    api.get("/school/").then(setSchool).catch(() => {});
  }, [id]);

  if (!cert) return <div className="p-4"><div className="spinner-border text-primary" /></div>;
  const ctx = buildContext(cert, student, school);
  const color = school?.primary_color || "#2563eb";

  return (
    <PrintFrame title="Certificate">
      <div className="print-doc" style={{ width: 760, padding: 0, fontFamily: "Georgia, serif" }}>
        <div style={{ border: `10px double ${color}`, margin: 16, padding: "40px 48px", minHeight: 500 }}>
          <div className="text-center">
            <h1 style={{ color, letterSpacing: 2 }}>{school?.name || "School"}</h1>
            <div className="text-muted" style={{ fontSize: 13 }}>{school?.address}</div>
            <h2 style={{ marginTop: 28, textTransform: "uppercase", letterSpacing: 4, fontSize: 22 }}>{cert.title}</h2>
            {cert.reference_no && <div className="small text-muted">Ref: {cert.reference_no}</div>}
          </div>

          <div style={{ marginTop: 32, fontSize: 16, lineHeight: 2, whiteSpace: "pre-wrap" }}>
            {substitute(cert.body, ctx)}
          </div>

          <div className="d-flex justify-content-between" style={{ marginTop: 64 }}>
            <div className="text-center small">
              {cert.issue_date}<br />______________________<br />Date
            </div>
            <div className="text-center small">
              {cert.signatory_name || ""}<br />______________________<br />
              {cert.signatory_designation || "Authorized signatory"}
            </div>
          </div>
        </div>
      </div>
    </PrintFrame>
  );
}
