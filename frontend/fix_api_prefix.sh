#!/bin/bash
find app/\(super-admin\) -name "*.js" -type f | while read file; do
    sed -i '' 's|api\.get("/api/|api.get("/|g' "$file"
    sed -i '' 's|api\.post("/api/|api.post("/|g' "$file"
    sed -i '' 's|api\.patch("/api/|api.patch("/|g' "$file"
    sed -i '' 's|api\.delete("/api/|api.delete("/|g' "$file"
    sed -i '' 's|api\.put("/api/|api.put("/|g' "$file"
done
