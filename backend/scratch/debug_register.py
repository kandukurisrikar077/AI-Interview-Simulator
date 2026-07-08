import requests
import json

payload = {
    "email": "rahul@techpova.com",
    "password": "Rahul@123",
    "full_name": "rahul",
    "role": "recruiter",
    "company_name": "TechPova Solutions Pvt. Ltd."
}

try:
    res = requests.post("http://127.0.0.1:8000/api/v1/auth/register", json=payload)
    print("STATUS CODE:", res.status_code)
    try:
        print("RESPONSE:", json.dumps(res.json(), indent=2))
    except Exception:
        print("RESPONSE TEXT:", res.text)
except Exception as e:
    print("REQUEST ERROR:", e)
