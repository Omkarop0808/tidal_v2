import pytest
from services.dispatch import dispatch_service

def test_optimize_dispatch_empty():
    assert dispatch_service.optimize_dispatch([], []) == []

def test_optimize_dispatch_basic():
    hotspots = [{'id': 'h1', 'estimated_debris_kg': 100, 'zone_name': 'Z1', 'lat': 19.135, 'lon': 72.814}]
    fleet = [{'vessel': 'V1', 'capacity_kg': 200, 'current_location': 'Colaba Base'}]
    
    assignments = dispatch_service.optimize_dispatch(hotspots, fleet)
    assert len(assignments) == 1
    assert assignments[0]['vessel_name'] == 'V1'
    assert assignments[0]['target_zone'] == 'Z1'
    assert 'distance_nm' in assignments[0]
    assert assignments[0]['distance_nm'] > 0
    assert assignments[0]['eta_hours'] > 0
