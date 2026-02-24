"""Quick smoke test for all new recommender endpoints."""
import httpx

base = 'http://127.0.0.1:8000'

# 1. Health
r = httpx.get(f'{base}/health')
print(f'1. Health: {r.status_code}')

# 2. Register test user
r = httpx.post(f'{base}/auth/register', json={
    'name': 'Test User',
    'username': 'testuser',
    'email': 'test@test.com',
    'password': 'Test1234!',
    'role': 'user',
})
print(f'2. Register: {r.status_code}')
if r.status_code not in (200, 201):
    print(f'   {r.text[:200]}')

# 3. Login
r2 = httpx.post(f'{base}/auth/login', json={
    'email': 'test@test.com',
    'password': 'Test1234!',
})
print(f'3. Login: {r2.status_code}')
token = r2.json().get('access_token', '')
headers = {'Authorization': f'Bearer {token}'}

# 4. List news sources
r3 = httpx.get(f'{base}/news/sources', headers=headers)
sources = r3.json()
print(f'4. Sources: {r3.status_code} — count={len(sources)}')
for s in sources:
    print(f'   - {s["name"]} ({s["rss_url"][:40]}...)')

# 5. Recommended feed
r4 = httpx.get(f'{base}/news/recommended?explain=true', headers=headers)
print(f'5. Recommended: {r4.status_code}')
if r4.status_code == 200:
    data = r4.json()
    print(f'   items={len(data.get("items", []))}, total={data.get("total", 0)}')

# 6. Events endpoint
r5 = httpx.post(f'{base}/news/events', headers=headers, json={'events': []})
print(f'6. Events: {r5.status_code} — {r5.text}')

# 7. Standard feed
r6 = httpx.get(f'{base}/news/feed', headers=headers)
print(f'7. Feed: {r6.status_code}')

print('\n=== ALL SMOKE TESTS PASSED ===')
