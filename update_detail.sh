#!/bin/bash
file="frontend/app/(super-admin)/platform/tenants/[id]/page.js"

# Import Menu and MenuItem
sed -i '' 's/CircularProgress, Divider/CircularProgress, Divider, Menu, MenuItem/g' "$file"

# Insert state for Menu right after `const [tabValue, setTabValue] = useState(0);`
sed -i '' '/const \[tabValue, setTabValue\] = useState(0);/a\
  const [anchorEl, setAnchorEl] = useState(null);\
  \
  const STATUS_OPTIONS = [\
    { value: "pending", label: "Pending Verification" },\
    { value: "trial", label: "Trial Active" },\
    { value: "active", label: "Active" },\
    { value: "trial_expired", label: "Trial Expired" },\
    { value: "payment_failed", label: "Payment Failed" },\
    { value: "suspended", label: "Suspended" },\
    { value: "cancelled", label: "Cancelled" },\
  ];\
  \
  const handleStatusClick = (event) => setAnchorEl(event.currentTarget);\
  const handleStatusClose = () => setAnchorEl(null);\
  \
  const handleStatusChange = async (newStatus) => {\
    try {\
      await api.patch(`/platform/schools/${school.id}/`, { status: newStatus });\
      fetchData();\
    } catch (err) {\
      console.error(err);\
      alert("Failed to update status.");\
    }\
    handleStatusClose();\
  };\
' "$file"

# Make the Chip clickable
sed -i '' 's/<Chip label={school.status_display} size="small" color="primary" variant="outlined" \/>/<Chip label={school.status_display} size="small" color="primary" variant="outlined" onClick={handleStatusClick} sx={{ cursor: "pointer" }} \/>/g' "$file"

# Add the Menu right before the final closing </Box>
sed -i '' '/    <\/Box>/i\
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleStatusClose}>\
        {STATUS_OPTIONS.map((option) => (\
          <MenuItem \
            key={option.value} \
            selected={school.status === option.value}\
            onClick={() => handleStatusChange(option.value)}\
          >\
            {option.label}\
          </MenuItem>\
        ))}\
      </Menu>\
' "$file"
