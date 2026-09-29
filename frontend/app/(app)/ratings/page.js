"use client";

// Rating periods CRUD + a live leaderboard of teachers by average score.
import { useEffect, useState } from "react";
import InlineCrud from "@/components/InlineCrud";
import { api } from "@/lib/api";

export default function RatingsPage() {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    // Aggregate teachers from their ratings for a simple dashboard.
    api.get("/teacher-ratings/?page_size=500").then((d) => {
      const rows = d.results || d;
      const byTeacher = {};
      rows.forEach((r) => {
        byTeacher[r.teacher] = byTeacher[r.teacher] || { sum: 0, n: 0, teacher: r.teacher };
        byTeacher[r.teacher].sum += r.score_overall || 0;
        byTeacher[r.teacher].n += 1;
      });
      setBoard(
        Object.values(byTeacher)
          .map((t) => ({ ...t, avg: (t.sum / t.n).toFixed(2) }))
          .sort((a, b) => b.avg - a.avg)
      );
    }).catch(() => {});
  }, []);

  return (
    <div>
      <InlineCrud
        title="Rating Periods"
        endpoint="/rating-periods/"
        columns={[
          { key: "name", label: "Period" },
          { key: "start_date", label: "Start" },
          { key: "end_date", label: "End" },
          { key: "is_active", label: "Active", render: (r) => (r.is_active ? "Yes" : "No") },
        ]}
        fields={[
          { key: "name", label: "Name (e.g. Term 1 - 2026)", required: true },
          { key: "start_date", label: "Start date", type: "date", required: true },
          { key: "end_date", label: "End date", type: "date", required: true },
          { key: "is_active", label: "Active", type: "checkbox" },
        ]}
      />

      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h2 className="h6">Teacher leaderboard (by average overall)</h2>
          {board.length === 0 ? (
            <p className="text-muted mb-0">No ratings submitted yet.</p>
          ) : (
            <ol className="mb-0">
              {board.map((t) => (
                <li key={t.teacher}>Teacher #{t.teacher} — <strong>{t.avg}</strong> ({t.n} ratings)</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
