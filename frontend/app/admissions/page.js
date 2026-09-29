"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdmissionsDirectory() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .publicGet("/public/schools/")
      .then((d) => setSchools(d.results || d))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-6 fw-bold">Admissions Open</h1>
        <p className="text-muted">Browse schools accepting applications and apply online.</p>
      </div>

      {loading ? (
        <div className="text-center"><div className="spinner-border text-primary" /></div>
      ) : schools.length === 0 ? (
        <p className="text-center text-muted">No schools are accepting admissions right now.</p>
      ) : (
        <div className="row g-4">
          {schools.map((s) => (
            <div className="col-md-6 col-lg-4" key={s.id}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div
                    className="rounded-3 mb-3 d-flex align-items-center justify-content-center"
                    style={{ height: 56, width: 56, background: s.primary_color || "#2563eb" }}
                  >
                    <i className="bi bi-building fs-4 text-white" />
                  </div>
                  <h2 className="h5">{s.name}</h2>
                  <p className="text-muted small mb-2 text-capitalize">
                    {s.school_type?.replace("_", " ")}
                    {s.country ? ` · ${s.country}` : ""}
                  </p>
                  {s.admission_mode === "online" ? (
                    <Link href={`/admissions/${s.slug}/apply`} className="btn btn-primary btn-sm">
                      Apply online
                    </Link>
                  ) : s.admission_google_form_url ? (
                    <a href={s.admission_google_form_url} target="_blank" rel="noreferrer"
                      className="btn btn-outline-primary btn-sm">
                      Application form
                    </a>
                  ) : (
                    <span className="badge text-bg-light">Contact school</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-5">
        <Link href="/login" className="text-decoration-none">
          <i className="bi bi-arrow-left me-1" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
