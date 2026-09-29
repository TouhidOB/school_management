"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Box, Typography, Card, CardContent, Grid, TextField, MenuItem, Button, 
  Alert, Checkbox, ListItemText, FormControlLabel, Avatar, IconButton, Divider
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const EMPTY = {
  first_name: "", last_name: "", dob: "", gender: "", blood_group: "", photo: null,
  email: "", phone: "", alternate_phone: "", current_address: "", permanent_address: "", same_as_current: false,
  highest_qualification: "", years_of_experience: "", resume: null, subjects: [],
  employee_id: "", joining_date: "", department: "", designation: "", salary_basic: "", contract_type: "permanent", sections: [],
  status: "active",
  emergency_contact_name: "", emergency_contact_relation: "", emergency_contact_phone: "",
  create_user_account: false, password: "", user_email: "", user_id: ""
};

export default function TeacherForm({ id, initialData }) {
  const router = useRouter();
  
  const [form, setForm] = useState({ ...EMPTY });
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewId, setPreviewId] = useState("Auto-generated");
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  
  const [resumeFile, setResumeFile] = useState(null);


  useEffect(() => {
    api.get("/designations/?page_size=200").then(d => setDesignations(d.results)).catch(() => {});
    api.get("/departments/?page_size=200").then(d => setDepartments(d.results)).catch(() => {});
    api.get("/subjects/?page_size=500").then(d => setSubjects(d.results)).catch(() => {});
    if (!id) {
        api.get("/teachers/next_id/").then(d => setPreviewId(d.employee_id || "Auto-generated")).catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (initialData) {
      const merged = { ...EMPTY };
      Object.keys(EMPTY).forEach(k => {
        if (initialData[k] !== undefined && initialData[k] !== null) merged[k] = initialData[k];
      });
      setForm(merged);
      if (initialData.photo) setPhotoPreview(initialData.photo);
    }
  }, [initialData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
    }
  };

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    
    const payload = { ...form };
    
    if (form.same_as_current) {
        payload.permanent_address = form.current_address;
    }
    
    // Clean up empty foreign keys
    if (!payload.designation) payload.designation = null;
    if (!payload.department) payload.department = null;
    if (!payload.dob) payload.dob = null;
    if (!payload.joining_date) payload.joining_date = null;
    if (!payload.years_of_experience) payload.years_of_experience = null;
    
    // Remove read-only / file fields from main JSON payload
    delete payload.photo;
    delete payload.resume;
    delete payload.user_email;
    delete payload.user_id;

    try {
      let savedTeacher;
      if (id) {
        savedTeacher = await api.patch(`/teachers/${id}/`, payload);
      } else {
        savedTeacher = await api.post("/teachers/", payload);
      }

      const teacherId = savedTeacher.id;

      // Upload files if present
      if (photoFile || resumeFile) {
        const fd = new FormData();
        if (photoFile) fd.append("photo", photoFile);
        if (resumeFile) fd.append("resume", resumeFile);
        
        await api.patch(`/teachers/${teacherId}/`, fd, { isForm: true });
      }

      router.push("/teachers");
    } catch (err) {
      setError(
        err.data && typeof err.data === 'object'
          ? Object.entries(err.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : err.message
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  const SectionTitle = ({ title, num }) => (
    <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box component="span" sx={{ bgcolor: 'primary.main', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>
        {num}
      </Box>
      {title}
    </Typography>
  );

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <form onSubmit={onSubmit}>
          
          <SectionTitle num="1" title="Personal Information" />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={photoPreview}
                sx={{ width: 120, height: 120, mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <Button variant="outlined" component="label" startIcon={<PhotoCamera />} size="small">
                Upload Photo
                <input hidden accept="image/*" type="file" onChange={handlePhotoChange} />
              </Button>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="First Name" required value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Last Name" required value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth type="date" label="Date of Birth" required InputLabelProps={{ shrink: true }} value={form.dob || ""} onChange={(e) => set("dob", e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select fullWidth label="Gender" required value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select fullWidth label="Blood Group" value={form.blood_group} onChange={(e) => set("blood_group", e.target.value)}>
                    <MenuItem value=""><em>None</em></MenuItem>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not Known"].map(bg => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 4 }} />
          <SectionTitle num="2" title="Contact Details" />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="email" label="Email Address" required value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Primary Phone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Alternate Phone" value={form.alternate_phone} onChange={(e) => set("alternate_phone", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Current Address" required multiline rows={3} value={form.current_address} onChange={(e) => set("current_address", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <TextField fullWidth label="Permanent Address" multiline rows={3} disabled={form.same_as_current} value={form.same_as_current ? form.current_address : form.permanent_address} onChange={(e) => set("permanent_address", e.target.value)} />
                <FormControlLabel control={<Checkbox checked={form.same_as_current} onChange={(e) => set("same_as_current", e.target.checked)} />} label="Same as Current Address" sx={{ mt: 0.5 }} />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 2 }} />
          <SectionTitle num="3" title="Academic & Professional Background" />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Highest Qualification" required value={form.highest_qualification} onChange={(e) => set("highest_qualification", e.target.value)} helperText="e.g., M.Sc, B.Ed, Ph.D" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Years of Experience" value={form.years_of_experience} onChange={(e) => set("years_of_experience", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Specialization / Subjects" required value={form.subjects} onChange={(e) => set("subjects", typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)} SelectProps={{ multiple: true, renderValue: (selected) => selected.map(sid => subjects.find(s => s.id === sid)?.name).filter(Boolean).join(", ") }}>
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    <Checkbox checked={form.subjects.indexOf(s.id) > -1} />
                    <ListItemText primary={`${s.name} (${s.code})`} secondary={s.school_class_name ? `Class: ${s.school_class_name}` : ''} />
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth sx={{ height: '56px', justifyContent: 'flex-start', px: 2, color: resumeFile ? 'success.main' : 'inherit', borderColor: resumeFile ? 'success.main' : 'inherit' }}>
                {resumeFile ? resumeFile.name : (form.resume ? "Replace Resume / CV" : "Upload Resume / CV")}
                <input hidden accept=".pdf,.doc,.docx" type="file" onChange={handleResumeChange} />
              </Button>
              {form.resume && !resumeFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Current: <a href={form.resume} target="_blank" rel="noreferrer">View File</a>
                </Typography>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ mt: 4 }} />
          <SectionTitle num="4" title="Employment & Institutional Details" />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Employee ID" value={id ? form.employee_id : previewId} disabled={!id} onChange={(e) => set("employee_id", e.target.value)} helperText="Platform generated format" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="date" label="Date of Joining" required InputLabelProps={{ shrink: true }} value={form.joining_date || ""} onChange={(e) => set("joining_date", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Department" value={form.department} onChange={(e) => set("department", e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Designation" value={form.designation} onChange={(e) => set("designation", e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {designations.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Base Salary" value={form.salary_basic} onChange={(e) => set("salary_basic", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Contract Type" required value={form.contract_type} onChange={(e) => set("contract_type", e.target.value)}>
                <MenuItem value="permanent">Permanent</MenuItem>
                <MenuItem value="part_time">Part-time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 4 }} />
          <SectionTitle num="5" title="System Access & Security" />
          {form.user_email ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              This teacher already has a system account linked ({form.user_email}).
            </Alert>
          ) : (
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, border: '1px dashed', borderColor: 'divider', mb: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={form.create_user_account} onChange={e => set("create_user_account", e.target.checked)} />}
                label="Generate User Account for this Teacher"
              />
              {form.create_user_account && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email (Login Username)" value={form.email} disabled size="small" helperText="Uses the contact email address provided above." />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Set Password" value={form.password} onChange={e => set("password", e.target.value)} size="small" helperText="Leave empty to auto-generate." />
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="System Role" value="Teacher" disabled helperText="Fixed by RBAC." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Account Status" required value={form.status} onChange={(e) => set("status", e.target.value)}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="resigned">Resigned</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ mt: 4 }} />
          <SectionTitle num="6" title="Emergency Contact" />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Emergency Contact Name" required value={form.emergency_contact_name} onChange={(e) => set("emergency_contact_name", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Relationship" required value={form.emergency_contact_relation} onChange={(e) => set("emergency_contact_relation", e.target.value)} helperText="e.g., Spouse, Parent" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Emergency Phone" required value={form.emergency_contact_phone} onChange={(e) => set("emergency_contact_phone", e.target.value)} />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 5, display: 'flex', gap: 2, borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
            <Button type="submit" variant="contained" size="large" disabled={busy}>
              {busy ? "Saving…" : "Save Teacher"}
            </Button>
            <Button variant="outlined" size="large" onClick={() => router.push("/teachers")}>
              Cancel
            </Button>
          </Box>
        </form>
      </CardContent>

    </Card>
  );
}
