import pytest
from backend.app import app
from backend.database import SessionLocal

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_attendance_departments_endpoint(client):
    response = client.get('/api/dashboard/attendance-departments')
    assert response.status_code == 401  # Unauthorized without token

def test_attendance_departments_with_auth(client):
    # Use the provided valid paseto token for testing authorized access
    token = 'v2.local.aAjgNmqKdV1cIlcnCpFiGdKZLUwlGwNzLV_nW4Nim0akWopRk1byOum3khd3gzrYgBdWgokRNFp6l-LsahHLemqGr9iaQsstYm1sbYs1UsaseUTc1i8kXm1I_ihjWc5RjglRyKRJhEYM41N6P3A-HwPlLoKyWbIDveY19lRnGa43wfO_djcnmmT2-hOY6usE7wDaPoVa'
    headers = {
        'Authorization': f'Bearer {token}'
    }
    response = client.get('/api/dashboard/attendance-departments', headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'on_time_departments' in data
    assert 'late_departments' in data
    assert 'missed_departments' in data
    assert 'missed_count' in data
    assert isinstance(data['on_time_departments'], list)
    assert isinstance(data['late_departments'], list)
    assert isinstance(data['missed_departments'], list)
    assert isinstance(data['missed_count'], int)
