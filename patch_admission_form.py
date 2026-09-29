with open("frontend/app/admissions/[slug]/apply/page.js", "r") as f:
    text = f.read()

text = text.replace('address: "", previous_school:', 'address: "", permanent_address: "", previous_school:')

html_old = """            <div className="col-md-6 mb-3">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} value={form.address}
                onChange={(e) => set("address", e.target.value)} />
            </div>"""
html_new = """            <div className="col-md-6 mb-3">
              <label className="form-label">Present Address</label>
              <textarea className="form-control" rows={2} value={form.address}
                onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Permanent Address</label>
              <textarea className="form-control" rows={2} value={form.permanent_address}
                onChange={(e) => set("permanent_address", e.target.value)} />
            </div>"""

if html_old in text:
    text = text.replace(html_old, html_new)
    with open("frontend/app/admissions/[slug]/apply/page.js", "w") as f:
        f.write(text)
    print("Patched admission form successfully")
else:
    print("Failed to find admission form snippet")
