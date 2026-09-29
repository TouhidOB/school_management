with open("frontend/app/admissions/[slug]/apply/page.js", "r") as f:
    text = f.read()

# add fields to state
text = text.replace(
    'address: "", permanent_address: "", previous_school:',
    'address: "", permanent_address: "", present_thana: "", present_zilla: "", present_postal_code: "", permanent_thana: "", permanent_zilla: "", permanent_postal_code: "", previous_school:'
)

html_old = """            <div className="col-md-6">
              <label className="form-label">Present Address</label>
              <textarea className="form-control" rows={2} value={form.address}
                onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Permanent Address</label>
              <textarea className="form-control" rows={2} value={form.permanent_address}
                onChange={(e) => set("permanent_address", e.target.value)} />
            </div>"""

html_new = """            
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
            """

if html_old in text:
    text = text.replace(html_old, html_new)
    with open("frontend/app/admissions/[slug]/apply/page.js", "w") as f:
        f.write(text)
    print("Patched admission form successfully")
else:
    print("Failed to find admission form snippet")
