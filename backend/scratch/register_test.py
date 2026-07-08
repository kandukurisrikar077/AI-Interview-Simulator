import requests, json
url='http://127.0.0.1:8000/api/v1/auth/register'
payload={
    "email":"rahul@techpova.com",
    "password":"Rahul@123",
    "full_name":"rahul",
    "role":"recruiter",
    "company_name":"TechPova Solutions Pvt. Ltd."
}
resp=requests.post(url,json=payload)
print('Status:', resp.status_code)
print('Response:', resp.text)
