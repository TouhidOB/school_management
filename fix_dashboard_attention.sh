#!/bin/bash
file="frontend/app/(super-admin)/platform/page.js"

# Add empty state to Attention Center
sed -i '' '/{attention_center.map((item) => (/i\
                  {attention_center.length === 0 && (\
                    <TableRow>\
                      <TableCell colSpan={5} align="center" sx={{ py: 10, color: "text.secondary" }}>\
                        🎉 All clear! No issues require your attention right now.\
                      </TableCell>\
                    </TableRow>\
                  )}\
' "$file"

