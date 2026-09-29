import re

with open("frontend/context/AuthContext.js", "r") as f:
    text = f.read()

old_catch = ".catch(() => tokens.clear())"
new_catch = """.catch((err) => {
          console.error("Auth fetch error:", err);
          if (err?.status === 401) {
            tokens.clear();
          }
        })"""

text = text.replace(old_catch, new_catch)

with open("frontend/context/AuthContext.js", "w") as f:
    f.write(text)
