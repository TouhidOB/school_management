with open("frontend/components/InlineCrud.js", "r") as f:
    text = f.read()

# Add TablePagination to imports
text = text.replace(
    "TableHead,\n  TableRow,\n  IconButton,\n  Alert,\n  Tooltip\n} from \"@mui/material\";",
    "TableHead,\n  TableRow,\n  IconButton,\n  Alert,\n  Tooltip,\n  TablePagination\n} from \"@mui/material\";"
)

# Add pagination and filter state
state_search = "  const [loading, setLoading] = useState(true);"
state_replacement = """  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});"""
text = text.replace(state_search, state_replacement)

# Add filter rendering and row slicing
# We need to find where <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}> is for the table.
card_search = """        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <TableContainer>"""

card_replacement = """        <Grid item xs={12} lg={8}>
          {filters && filters.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              {filters.map((fKey) => {
                const f = fields.find((field) => field.key === fKey);
                if (!f) return null;
                return (
                  <TextField
                    key={fKey}
                    select
                    label={`Filter by ${f.label.replace(' (optional)', '')}`}
                    value={filterValues[fKey] || ''}
                    onChange={(e) => setFilterValues({ ...filterValues, [fKey]: e.target.value })}
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value=""><em>All</em></MenuItem>
                    {(f.options || optionSets[fKey] || []).map((o) => (
                      <MenuItem key={o.id ?? o.value ?? o} value={o.id ?? o.value ?? o}>
                        {typeof o === "object" ? (o.label ?? optLabel(f, o)) : o}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              })}
            </Box>
          )}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <TableContainer>"""

text = text.replace(card_search, card_replacement)

# Filter rows before paginating
rows_map_search = """                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4, color: 'text.secondary' }}>No records.</TableCell></TableRow>
                  ) : (
                    rows.map((row) => ("""

rows_map_replacement = """                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 4, color: 'text.secondary' }}>No records.</TableCell></TableRow>
                  ) : (
                    rows
                      .filter((row) => {
                         if (!filters || filters.length === 0) return true;
                         for (const fKey of filters) {
                           if (filterValues[fKey] && row[fKey] !== filterValues[fKey]) {
                             return false;
                           }
                         }
                         return true;
                      })
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => ("""

text = text.replace(rows_map_search, rows_map_replacement)

# Add TablePagination
table_close_search = """              </Table>
            </TableContainer>
          </Card>"""

table_close_replacement = """              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={rows.filter((row) => {
                 if (!filters || filters.length === 0) return true;
                 for (const fKey of filters) {
                   if (filterValues[fKey] && row[fKey] !== filterValues[fKey]) {
                     return false;
                   }
                 }
                 return true;
              }).length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Card>"""

text = text.replace(table_close_search, table_close_replacement)

# Update component definition to accept `filters`
text = text.replace(
    "export default function InlineCrud({ title, endpoint, columns, fields, help }) {",
    "export default function InlineCrud({ title, endpoint, columns, fields, help, filters }) {"
)

with open("frontend/components/InlineCrud.js", "w") as f:
    f.write(text)

print("Patched InlineCrud.js")
