"use client";

// Classroom detail: Feed, Notes, Assignments (+ submissions/grading),
// Participants. Tabbed, all data scoped to this room.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const TABS = ["Feed", "Notes", "Assignments", "Participants"];

export default function RoomDetailPage() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [tab, setTab] = useState("Feed");

  useEffect(() => {
    api.get(`/rooms/${id}/`).then(setRoom).catch(() => {});
  }, [id]);

  if (!room) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <Link href="/rooms" className="small text-decoration-none">
        <i className="bi bi-arrow-left me-1" /> Classrooms
      </Link>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">{room.name}</h1>
        <span className="badge text-bg-light">Join code: <code>{room.room_code}</code></span>
      </div>

      <ul className="nav nav-tabs mb-3">
        {TABS.map((t) => (
          <li className="nav-item" key={t}>
            <button className={`nav-link ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
          </li>
        ))}
      </ul>

      {tab === "Feed" && <Feed roomId={id} />}
      {tab === "Notes" && <Notes roomId={id} />}
      {tab === "Assignments" && <Assignments roomId={id} />}
      {tab === "Participants" && <Participants roomId={id} />}
    </div>
  );
}

function Feed({ roomId }) {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ content: "", post_type: "announcement", is_pinned: false });

  function load() {
    api.get(`/room-posts/?room=${roomId}&page_size=100`).then((d) => setPosts(d.results || d)).catch(() => {});
  }
  useEffect(load, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function post(e) {
    e.preventDefault();
    await api.post("/room-posts/", { ...form, room: Number(roomId) });
    setForm({ content: "", post_type: "announcement", is_pinned: false });
    load();
  }

  return (
    <div className="row g-3">
      <div className="col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h2 className="h6">New post</h2>
            <form onSubmit={post}>
              <select className="form-select mb-2" value={form.post_type} onChange={(e) => setForm({ ...form, post_type: e.target.value })}>
                <option value="announcement">Announcement</option>
                <option value="note">Note</option>
                <option value="result">Result</option>
              </select>
              <textarea className="form-control mb-2" rows={3} placeholder="Write something…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
              <div className="form-check mb-2">
                <input type="checkbox" className="form-check-input" id="pin" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} />
                <label className="form-check-label" htmlFor="pin">Pin</label>
              </div>
              <button className="btn btn-primary btn-sm">Post</button>
            </form>
          </div>
        </div>
      </div>
      <div className="col-lg-7">
        {posts.length === 0 ? <p className="text-muted">No posts yet.</p> : posts.map((p) => (
          <div className="card border-0 shadow-sm mb-2" key={p.id}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <span className="badge text-bg-light text-capitalize">{p.post_type}</span>
                {p.is_pinned && <i className="bi bi-pin-angle-fill text-warning" />}
              </div>
              <p className="mb-1 mt-2" style={{ whiteSpace: "pre-wrap" }}>{p.content}</p>
              <div className="text-muted small">{(p.published_at || "").slice(0, 16).replace("T", " ")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Notes({ roomId }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", topic: "", chapter: "", is_important: false });

  function load() {
    api.get(`/room-notes/?room=${roomId}&page_size=100`).then((d) => setRows(d.results || d)).catch(() => {});
  }
  useEffect(load, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function add(e) {
    e.preventDefault();
    await api.post("/room-notes/", { ...form, room: Number(roomId) });
    setForm({ title: "", description: "", topic: "", chapter: "", is_important: false });
    load();
  }

  return (
    <div className="row g-3">
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm"><div className="card-body">
          <h2 className="h6">Add note</h2>
          <form onSubmit={add}>
            <input className="form-control mb-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="form-control mb-2" rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="row g-2 mb-2">
              <div className="col"><input className="form-control" placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
              <div className="col"><input className="form-control" placeholder="Chapter" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} /></div>
            </div>
            <div className="form-check mb-2">
              <input type="checkbox" className="form-check-input" id="imp" checked={form.is_important} onChange={(e) => setForm({ ...form, is_important: e.target.checked })} />
              <label className="form-check-label" htmlFor="imp">Important</label>
            </div>
            <button className="btn btn-primary btn-sm">Add</button>
          </form>
        </div></div>
      </div>
      <div className="col-lg-8">
        <div className="card border-0 shadow-sm"><div className="card-body table-responsive">
          <table className="table mb-0"><thead className="table-light"><tr><th>Title</th><th>Topic</th><th>Chapter</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={4} className="text-muted text-center py-3">No notes.</td></tr> : rows.map((n) => (
                <tr key={n.id}><td>{n.is_important && <i className="bi bi-star-fill text-warning me-1" />}{n.title}</td><td>{n.topic || "—"}</td><td>{n.chapter || "—"}</td><td></td></tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>
    </div>
  );
}

function Assignments({ roomId }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: "", instructions: "", due_datetime: "", total_marks: 100 });
  const [openId, setOpenId] = useState(null);

  function load() {
    api.get(`/assignments/?room=${roomId}&page_size=100`).then((d) => setRows(d.results || d)).catch(() => {});
  }
  useEffect(load, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function add(e) {
    e.preventDefault();
    const payload = { ...form, room: Number(roomId) };
    if (!payload.due_datetime) payload.due_datetime = new Date().toISOString();
    else payload.due_datetime = new Date(payload.due_datetime).toISOString();
    await api.post("/assignments/", payload);
    setForm({ title: "", instructions: "", due_datetime: "", total_marks: 100 });
    load();
  }

  return (
    <div className="row g-3">
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm"><div className="card-body">
          <h2 className="h6">New assignment</h2>
          <form onSubmit={add}>
            <input className="form-control mb-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea className="form-control mb-2" rows={2} placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            <label className="form-label small">Due</label>
            <input type="datetime-local" className="form-control mb-2" value={form.due_datetime} onChange={(e) => setForm({ ...form, due_datetime: e.target.value })} />
            <label className="form-label small">Total marks</label>
            <input type="number" className="form-control mb-2" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) })} />
            <button className="btn btn-primary btn-sm">Create</button>
          </form>
        </div></div>
      </div>
      <div className="col-lg-8">
        {rows.length === 0 ? <p className="text-muted">No assignments.</p> : rows.map((a) => (
          <div className="card border-0 shadow-sm mb-2" key={a.id}><div className="card-body">
            <div className="d-flex justify-content-between">
              <strong>{a.title}</strong>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                {openId === a.id ? "Hide" : "Submissions"}
              </button>
            </div>
            <div className="text-muted small">Due {(a.due_datetime || "").slice(0, 16).replace("T", " ")} · {a.total_marks} marks</div>
            {openId === a.id && <Submissions assignmentId={a.id} totalMarks={a.total_marks} />}
          </div></div>
        ))}
      </div>
    </div>
  );
}

function Submissions({ assignmentId, totalMarks }) {
  const [subs, setSubs] = useState([]);
  function load() {
    api.get(`/submissions/?assignment=${assignmentId}&page_size=200`).then((d) => setSubs(d.results || d)).catch(() => {});
  }
  useEffect(load, [assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function grade(sub) {
    const marks = prompt(`Marks (out of ${totalMarks}) for ${sub.student_name}:`, sub.marks_obtained ?? "");
    if (marks === null) return;
    const feedback = prompt("Feedback (optional):", sub.feedback || "") || "";
    await api.post(`/submissions/${sub.id}/grade/`, { marks_obtained: Number(marks), feedback });
    load();
  }

  return (
    <div className="mt-2 border-top pt-2">
      {subs.length === 0 ? <div className="text-muted small">No submissions.</div> : (
        <table className="table table-sm mb-0">
          <tbody>
            {subs.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.student_name}</td>
                <td>{sub.is_late && <span className="badge text-bg-warning">late</span>}</td>
                <td>{sub.marks_obtained != null ? `${sub.marks_obtained}/${totalMarks}` : <span className="text-muted">ungraded</span>}</td>
                <td className="text-end"><button className="btn btn-sm btn-outline-success" onClick={() => grade(sub)}>Grade</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Participants({ roomId }) {
  const [members, setMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [pick, setPick] = useState("");

  function load() {
    api.get(`/room-memberships/?room=${roomId}&page_size=500`).then((d) => setMembers(d.results || d)).catch(() => {});
  }
  useEffect(() => {
    load();
    api.get("/students/?page_size=500").then((d) => setStudents(d.results || d)).catch(() => {});
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addMember(e) {
    e.preventDefault();
    if (!pick) return;
    await api.post("/room-memberships/", { room: Number(roomId), student: Number(pick), is_active: true });
    setPick("");
    load();
  }
  async function remove(id) {
    await api.del(`/room-memberships/${id}/`);
    load();
  }

  return (
    <div className="card border-0 shadow-sm"><div className="card-body">
      <form onSubmit={addMember} className="d-flex gap-2 mb-3" style={{ maxWidth: 480 }}>
        <select className="form-select" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Add student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_number})</option>)}
        </select>
        <button className="btn btn-primary">Add</button>
      </form>
      {members.length === 0 ? <p className="text-muted mb-0">No participants.</p> : (
        <ul className="list-group list-group-flush">
          {members.map((m) => (
            <li key={m.id} className="list-group-item px-0 d-flex justify-content-between">
              {m.student_name}
              <button className="btn btn-sm btn-outline-danger" onClick={() => remove(m.id)}><i className="bi bi-x" /></button>
            </li>
          ))}
        </ul>
      )}
    </div></div>
  );
}
