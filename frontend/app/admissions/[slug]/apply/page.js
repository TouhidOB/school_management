"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ApplyPage() {
  const { slug } = useParams();
  const [school, setSchool] = useState(null);
  const [form, setForm] = useState({
    full_name: "", dob: "", gender: "", class_applied: "", phone: "", email: "",
    address: "", permanent_address: "", present_thana: "", present_zilla: "", present_postal_code: "", permanent_thana: "", permanent_zilla: "", permanent_postal_code: "", previous_school: "", father_name: "", father_phone: "",
    mother_name: "", mother_phone: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.publicGet(`/public/schools/${slug}/`).then(setSchool).catch(() => setSchool(false));
  }, [slug]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = { ...form };
    if (payload.dob === "") payload.dob = null;
    
    // Normalize into guardians array for the API
    payload.guardians = [];
    if (payload.father_name || payload.father_phone) {
      payload.guardians.push({
        relation: 'father',
        name: payload.father_name,
        phone: payload.father_phone,
        occupation: '',
        email: ''
      });
    }
    if (payload.mother_name || payload.mother_phone) {
      payload.guardians.push({
        relation: 'mother',
        name: payload.mother_name,
        phone: payload.mother_phone,
        occupation: '',
        email: ''
      });
    }
    
    // Remove flat fields so they aren't sent to the API
    delete payload.father_name;
    delete payload.father_phone;
    delete payload.mother_name;
    delete payload.mother_phone;
    try {
      await api.publicPost(`/public/schools/${slug}/apply/`, payload);
      setResult("submitted");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (school === false) {
    return <div className="container py-5"><div className="alert alert-warning">School not found or not accepting admissions.</div></div>;
  }

  if (result === "submitted") {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-check-circle-fill text-success display-3" />
        <h1 className="h3 mt-3">Application submitted</h1>
        <p className="text-muted">{school?.name} has received your application.</p>
        <Link href="/admissions" className="btn btn-outline-primary mt-2">Back to directory</Link>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 760 }}>
      <Link href="/admissions" className="text-decoration-none small">
        <i className="bi bi-arrow-left me-1" /> All schools
      </Link>
      <h1 className="h3 mt-2 mb-1">Apply to {school?.name || "…"}</h1>
      {school?.admission_instructions && (
        <p className="text-muted">{school.admission_instructions}</p>
      )}

      <div className="card border-0 shadow-sm mt-3">
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Applicant name *</label>
              <input className="form-control" value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Date of birth</label>
              <input type="date" className="form-control" value={form.dob}
                onChange={(e) => set("dob", e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender}
                onChange={(e) => set("gender", e.target.value)}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Class applying for</label>
              <input className="form-control" value={form.class_applied}
                onChange={(e) => set("class_applied", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone}
                onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email}
                onChange={(e) => set("email", e.target.value)} />
            </div>
            
            <div className="col-12 mt-3"><h6 className="text-secondary mb-1">Present Address</h6></div>
            <div className="col-12">
              <label className="form-label">Street/House Address</label>
              <textarea className="form-control" rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Thana</label>
              <input type="text" className="form-control" value={form.present_thana} onChange={(e) => set("present_thana", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Zilla</label>
              <input type="text" className="form-control" value={form.present_zilla} onChange={(e) => set("present_zilla", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Postal Code</label>
              <input type="text" className="form-control" value={form.present_postal_code} onChange={(e) => set("present_postal_code", e.target.value)} />
            </div>

            <div className="col-12 mt-3"><h6 className="text-secondary mb-1">Permanent Address</h6></div>
            <div className="col-12">
              <label className="form-label">Street/House Address</label>
              <textarea className="form-control" rows={2} value={form.permanent_address} onChange={(e) => set("permanent_address", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Thana</label>
              <input type="text" className="form-control" value={form.permanent_thana} onChange={(e) => set("permanent_thana", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Zilla</label>
              <input type="text" className="form-control" value={form.permanent_zilla} onChange={(e) => set("permanent_zilla", e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Postal Code</label>
              <input type="text" className="form-control" value={form.permanent_postal_code} onChange={(e) => set("permanent_postal_code", e.target.value)} />
            </div>
            
            <div className="col-12 mt-3"><h6 className="text-secondary mb-1">Parents/Guardian Info</h6></div>
            
            <div className="col-md-6">
              <label className="form-label">Father&apos;s name</label>
              <input className="form-control" value={form.father_name}
                onChange={(e) => set("father_name", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Father&apos;s phone</label>
              <input className="form-control" value={form.father_phone}
                onChange={(e) => set("father_phone", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Mother&apos;s name</label>
              <input className="form-control" value={form.mother_name}
                onChange={(e) => set("mother_name", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Mother&apos;s phone</label>
              <input className="form-control" value={form.mother_phone}
                onChange={(e) => set("mother_phone", e.target.value)} />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
