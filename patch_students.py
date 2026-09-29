with open("frontend/app/(app)/students/page.js", "r") as f:
    text = f.read()

search_text = """        <Button 
          component={Link} 
          href="/students/new" 
          variant="contained" 
          startIcon={<AddIcon />}
        >
          Add Student
        </Button>"""

replace_text = """        <Box sx={{ display: 'flex', gap: 2 }}>
          {filterClass && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<BadgeIcon />}
              component="a"
              href={`/print/class/${filterClass}/id-cards`}
              target="_blank"
            >
              Print Class IDs
            </Button>
          )}
          <Button 
            component={Link} 
            href="/students/new" 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Add Student
          </Button>
        </Box>"""

if search_text in text:
    text = text.replace(search_text, replace_text)
else:
    print("Could not find search_text")

with open("frontend/app/(app)/students/page.js", "w") as f:
    f.write(text)

print("Patched students page header")
