import requests

r = requests.get('http://localhost/api/students/7/')
print(r.json())
