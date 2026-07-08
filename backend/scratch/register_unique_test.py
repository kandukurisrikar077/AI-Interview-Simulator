import uuid, requests
url='http://127.0.0.1:8000/api/v1/auth/register'
unique_email = f'test_{uuid.uuid4().hex[:6]}@example.com'
payload={
    "email": unique_email,
    "password":"Test1234",
    "full_name":"Test User",
    "role":"recruiter",
    "company_name":"TestCo"
}
resp=requests.post(url, json=payload)
print('Status:', resp.status_code)
print('Response:', resp.text)
