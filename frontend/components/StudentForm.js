"use client";

// Shared create/edit form for a student. `id` present => edit mode (loads the
// record and PATCHes); absent => create mode (POSTs). Class/section dropdowns
// are populated from the tenant-scoped academics endpoints.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
  Divider
} from "@mui/material";

const EMPTY = {
  photo: null,
  full_name: "",
  admission_number: "",
  roll_number: "",
  gender: "",
  dob: "",
  blood_group: "",
  current_class: "",
  current_section: "",
  academic_year: "",
  admission_date: "",
  address: "",
  permanent_address: "",
  present_thana: "",
  present_zilla: "",
  present_postal_code: "",
  permanent_thana: "",
  permanent_zilla: "",
  permanent_postal_code: "",
  emergency_contact: "",
  user_email: "",
  status: "active",
  father_name: "",
  father_phone: "",
  mother_name: "",
  mother_phone: "",
};

export default function StudentForm({ id }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [previewIds, setPreviewIds] = useState({ admission_number: "Auto-generated", roll_number: "Auto-generated" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function generateAccount() {
    setBusy(true);
    try {
      const res = await api.post(`/students/${id}/create_user_account/`, {});
      setForm(f => ({ ...f, user_email: res.email }));
      alert(`Account created! Email: ${res.email}, Password: student123`);
    } catch (e) {
      setError(e.message || "Failed to create account");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    api.get("/academic-years/?page_size=200").then((d) => {
      const list = d.results || d;
      setAcademicYears(list);
      if (!id) {
        const curr = list.find((y) => y.is_current) || list[0];
        if (curr) {
          setForm((f) => ({ ...f, academic_year: f.academic_year || curr.id }));
        }
      }
    }).catch(() => {});
    api.get("/classes/?page_size=200").then((d) => setClasses(d.results || d)).catch(() => {});
    api.get("/sections/?page_size=500").then((d) => setSections(d.results || d)).catch(() => {});
    if (id) {
      api
        .get(`/students/${id}/`)
        .then((s) =>
          {
            const fData = { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, s[k] ?? EMPTY[k]])) };
            if (s.guardians && s.guardians.length > 0) {
              const father = s.guardians.find(g => g.relation === 'father');
              const mother = s.guardians.find(g => g.relation === 'mother');
              if (father) { fData.father_name = father.name; fData.father_phone = father.phone; }
              if (mother) { fData.mother_name = mother.name; fData.mother_phone = mother.phone; }
            }
            setForm(fData);
          if (fData.photo) setPhotoPreview(fData.photo);
          }
        )
        .catch(() => setError("Could not load student."));
    }
  }, [id]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = { ...form };
    delete payload.photo;
    delete payload.user_email;
    delete payload.user_id;
    ["current_class", "current_section", "academic_year", "dob", "admission_date"].forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });
    
    // Auto-generation flags for backend if new
    if (!id) {
       payload.admission_number = 'auto';
       payload.roll_number = 'auto';
    }
    
    payload.guardians = [];
    if (payload.father_name || payload.father_phone) {
      payload.guardians.push({ relation: 'father', name: payload.father_name, phone: payload.father_phone, occupation: '', email: '' });
    }
    if (payload.mother_name || payload.mother_phone) {
      payload.guardians.push({ relation: 'mother', name: payload.mother_name, phone: payload.mother_phone, occupation: '', email: '' });
    }
    delete payload.father_name;
    delete payload.father_phone;
    delete payload.mother_name;
    delete payload.mother_phone;
    try {
      let studentId = id;
      if (id) {
        await api.patch(`/students/${id}/`, payload);
      } else {
        const res = await api.post("/students/", payload);
        studentId = res.id;
      }
      
      // Upload photo if selected
      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        await api.patch(`/students/${studentId}/`, fd, { isForm: true });
      }
      
      router.push("/students");
    } catch (err) {
      setError(
        err.data
          ? Object.entries(err.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : err.message
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!id) {
      const qs = new URLSearchParams();
      if (form.current_class) qs.append("class_id", form.current_class);
      if (form.current_section) qs.append("section_id", form.current_section);
      
      api.get(`/students/next_ids/?${qs.toString()}`)
        .then(res => setPreviewIds({
          admission_number: res.admission_number || "Auto-generated",
          roll_number: res.roll_number || "Auto-generated"
        }))
        .catch(() => {});
    }
  }, [form.current_class, form.current_section, id]);

  const sectionsForClass = form.current_class
    ? sections.filter((s) => String(s.school_class) === String(form.current_class))
    : sections;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        {id ? "Edit Student" : "Add Student"}
      </Typography>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <form onSubmit={onSubmit}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>1. Basic Details</Typography>
            <Grid container spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
              <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: 'grey.200', mx: 'auto', mb: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">No Photo</Typography>
                  )}
                </Box>
                <Button variant="outlined" component="label" size="small">
                  Upload Photo
                  <input type="file" hidden accept="image/*" onChange={(e) => {
                    if (e.target.files[0]) {
                      setPhotoFile(e.target.files[0]);
                      setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </Button>
              </Grid>
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Full name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Admission ID" value={id ? form.admission_number : previewIds.admission_number} disabled={!id} helperText="Platform generated format" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Roll #" value={id ? form.roll_number : previewIds.roll_number} disabled={!id} helperText="Auto-increments by class" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Gender" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                      <MenuItem value=""><em>—</em></MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="date" label="Date of birth" value={form.dob || ""} onChange={(e) => update("dob", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Blood group" value={form.blood_group || ""} onChange={(e) => update("blood_group", e.target.value)}>
                      <MenuItem value=""><em>—</em></MenuItem>
                      <MenuItem value="A+">A+</MenuItem>
                      <MenuItem value="A-">A-</MenuItem>
                      <MenuItem value="B+">B+</MenuItem>
                      <MenuItem value="B-">B-</MenuItem>
                      <MenuItem value="AB+">AB+</MenuItem>
                      <MenuItem value="AB-">AB-</MenuItem>
                      <MenuItem value="O+">O+</MenuItem>
                      <MenuItem value="O-">O-</MenuItem>
                      <MenuItem value="Not K">Not K</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select fullWidth label="Status" value={form.status} onChange={(e) => update("status", e.target.value)}>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="transferred">Transferred</MenuItem>
                      <MenuItem value="alumni">Alumni</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>2. Academic Placement</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <TextField 
                  select 
                  fullWidth 
                  label="Academic Year" 
                  value={form.academic_year || ""} 
                  required 
                  onChange={(e) => update("academic_year", e.target.value)}
                >
                  <MenuItem value=""><em>Select Year</em></MenuItem>
                  {academicYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>
                      {y.name} {y.is_current ? "(Current)" : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Class" value={form.current_class || ""} required onChange={(e) => { update("current_class", e.target.value); update("current_section", ""); }}>
                  <MenuItem value=""><em>—</em></MenuItem>
                  {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Section" value={form.current_section || ""} required onChange={(e) => update("current_section", e.target.value)}>
                  <MenuItem value=""><em>—</em></MenuItem>
                  {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.school_class_name} - {s.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="date" label="Admission date" value={form.admission_date || ""} required onChange={(e) => update("admission_date", e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>3. Parents / Guardian Info</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Father's Name" value={form.father_name} onChange={(e) => update("father_name", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Father's Phone" value={form.father_phone} onChange={(e) => update("father_phone", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Mother's Name" value={form.mother_name} onChange={(e) => update("mother_name", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Mother's Phone" value={form.mother_phone} onChange={(e) => update("mother_phone", e.target.value)} />
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>4. Contact Info</Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Present Address</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={12}>
                <TextField fullWidth label="Street/House Address" value={form.address || ""} onChange={(e) => update("address", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Thana" value={form.present_thana || ""} onChange={(e) => update("present_thana", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Zilla" value={form.present_zilla || ""} onChange={(e) => update("present_zilla", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Postal Code" value={form.present_postal_code || ""} onChange={(e) => update("present_postal_code", e.target.value)} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Permanent Address</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={12}>
                <TextField fullWidth label="Street/House Address" value={form.permanent_address || ""} onChange={(e) => update("permanent_address", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Thana" value={form.permanent_thana || ""} onChange={(e) => update("permanent_thana", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Zilla" value={form.permanent_zilla || ""} onChange={(e) => update("permanent_zilla", e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Postal Code" value={form.permanent_postal_code || ""} onChange={(e) => update("permanent_postal_code", e.target.value)} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Other Contacts</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Emergency contact" value={form.emergency_contact || ""} onChange={(e) => update("emergency_contact", e.target.value)} />
              </Grid>
            </Grid>

            {id && (
              <>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>5. User Account</Typography>
                <Grid container spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Login Email" value={form.user_email || "No account generated yet"} disabled />
                  </Grid>
                  {!form.user_email && (
                    <Grid item xs={12} md={6}>
                      <Button variant="outlined" onClick={generateAccount} disabled={busy}>Generate Account</Button>
                    </Grid>
                  )}
                </Grid>
              </>
            )}

            <Grid container>
              <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" disabled={busy} size="large">
                  {busy ? "Saving…" : "Save Student"}
                </Button>
                <Button variant="outlined" onClick={() => router.push("/students")} size="large">
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
