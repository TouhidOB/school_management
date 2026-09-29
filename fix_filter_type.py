with open("frontend/components/InlineCrud.js", "r") as f:
    text = f.read()

text = text.replace("row[fKey] !== filterValues[fKey]", "String(row[fKey]) !== String(filterValues[fKey])")

with open("frontend/components/InlineCrud.js", "w") as f:
    f.write(text)

print("Fixed type matching in filter.")
