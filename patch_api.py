with open("frontend/lib/api.js", "r") as f:
    text = f.read()

text = text.replace(
    'put: (p, body) => request(p, { method: "PUT", body }),',
    'put: (p, body, o) => request(p, { method: "PUT", body, ...o }),'
)
text = text.replace(
    'patch: (p, body) => request(p, { method: "PATCH", body }),',
    'patch: (p, body, o) => request(p, { method: "PATCH", body, ...o }),'
)

with open("frontend/lib/api.js", "w") as f:
    f.write(text)
