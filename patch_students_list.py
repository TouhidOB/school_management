import re

with open("frontend/app/(app)/students/page.js", "r") as f:
    text = f.read()

# 1. Imports
text = text.replace(
    '  Pagination,\n} from "@mui/material";',
    '  Pagination,\n  MenuItem,\n} from "@mui/material";'
)

# 2. State
state_block = """  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);"""

new_state_block = """  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    api.get("/classes/?page_size=200").then(d => setClasses(d.results)).catch(() => {});
    api.get("/sections/?page_size=500").then(d => setSections(d.results)).catch(() => {});
  }, []);"""

text = text.replace(state_block, new_state_block)

# 3. load func
load_block = """  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    api
      .get(`/students/?${params}`)"""

new_load_block = """  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (filterClass) params.set("current_class", filterClass);
    if (filterSection) params.set("current_section", filterSection);
    api
      .get(`/students/?${params}`)"""

text = text.replace(load_block, new_load_block)
text = text.replace('[page, search]);', '[page, search, filterClass, filterSection]);')

# 4. UI
ui_block = """          <Box sx={{ p: 2, pb: 0 }}>
            <TextField
              size="small"
              placeholder="Search name, admission or roll no."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              sx={{ maxWidth: 360, width: '100%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>"""

new_ui_block = """          <Box sx={{ p: 2, pb: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search name, admission or roll no."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              sx={{ maxWidth: 360, width: '100%', flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Class"
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setFilterSection("");
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField
              select
              size="small"
              label="Section"
              value={filterSection}
              onChange={(e) => {
                setFilterSection(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
              disabled={!filterClass}
            >
              <MenuItem value="">All Sections</MenuItem>
              {sections
                .filter(s => String(s.school_class) === String(filterClass))
                .map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)
              }
            </TextField>
          </Box>"""

text = text.replace(ui_block, new_ui_block)

with open("frontend/app/(app)/students/page.js", "w") as f:
    f.write(text)
print("Patched successfully")
