import requests

res = requests.post('http://localhost/api/auth/token/', json={'username': 'super@demo.local', 'password': 'demo12345'})
token = res.json()['access']

headers = {'Authorization': f'Bearer {token}'}
r = requests.get('http://localhost/api/expenses/', headers=headers)
print("EXPENSES:", r.status_code, r.text)

r2 = requests.get('http://localhost/api/invoices/', headers=headers)
print("INVOICES:", r2.status_code, len(r2.json().get('results', [])))
