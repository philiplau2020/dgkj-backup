import requests
r = requests.post('http://127.0.0.1:8080/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
print('Status:', r.status_code)
print('Response:', r.text)
