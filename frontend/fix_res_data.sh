#!/bin/bash
find app/\(super-admin\) -name "*.js" -type f | while read file; do
    # For setData, setFormData -> replace res.data with res
    sed -i '' 's/setData(res\.data)/setData(res)/g' "$file"
    sed -i '' 's/setFormData(res\.data)/setFormData(res)/g' "$file"
    # For setting arrays (e.g. setSchools, setUsers) -> replace setXXX(res.data) with setXXX(res.results || res)
    sed -i '' -E 's/set([A-Za-z]+)\(res\.data\)/set\1(res.results || res)/g' "$file"
    # Wait, there's also router.push(`/platform/tenants/${res.data.id}`) -> res.id
    sed -i '' 's/res\.data\.id/res.id/g' "$file"
done
