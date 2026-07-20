import urllib.request
import json

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/api/users') as response:
        users = json.loads(response.read().decode())
    print('Total users:', len(users))
    
    for u in users:
        url = f'http://127.0.0.1:8000/api/recommendations/home?user_id={u["_id"]}&limit=50'
        with urllib.request.urlopen(url) as response:
            res = json.loads(response.read().decode())
            print(f'User {u["_id"]}: {len(res)} recommendations')
            
    print('All users OK!')
except Exception as e:
    print('Error:', e)
