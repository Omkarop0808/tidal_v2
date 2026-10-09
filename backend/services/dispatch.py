import numpy as np
from scipy.optimize import linear_sum_assignment
from google import genai
from google.genai import types
from groq import Groq
import os

# Naval staging bases across Greater Mumbai Coastline
NAVAL_BASES = {
    "Colaba Base": {"lat": 18.9067, "lon": 72.8147},
    "Bandra Cove": {"lat": 19.0550, "lon": 72.8180},
    "Versova Post": {"lat": 19.1350, "lon": 72.8140},
}

def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in Nautical Miles."""
    R_nm = 3440.065 # Earth radius in nautical miles
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
    return round(float(R_nm * c), 2)

class DispatchService:
    def __init__(self):
        pass

    def optimize_dispatch(self, hotspots: list, fleet: list):
        """
        Deterministic dispatch optimizer using Hungarian algorithm (scipy linear_sum_assignment).
        Nautical routing uses Haversine distance from vessel current location to coastal zone.
        Operational Cost = (transit_hours * 10) + capacity_penalty - payload_fit_bonus.
        """
        if not hotspots or not fleet:
            return []
            
        n_vessels = len(fleet)
        n_hotspots = len(hotspots)
        
        cost_matrix = np.zeros((n_vessels, n_hotspots))
        metrics_matrix = []
        
        for i, vessel in enumerate(fleet):
            row_metrics = []
            base_name = vessel.get('current_location', 'Colaba Base')
            base_coords = NAVAL_BASES.get(base_name, NAVAL_BASES["Colaba Base"])
            v_lat, v_lon = base_coords["lat"], base_coords["lon"]
            capacity = vessel.get('capacity_kg', 500)

            for j, hs in enumerate(hotspots):
                hs_lat = hs.get('lat', 19.10)
                hs_lon = hs.get('lon', 72.82)
                dist_nm = haversine_nm(v_lat, v_lon, hs_lat, hs_lon)
                
                # Standard skimmer patrol speed is 12 knots + 0.3h staging/mooring
                transit_hours = round(max(0.4, (dist_nm / 12.0) + 0.2), 1)
                risk_kg = hs.get('estimated_debris_kg', hs.get('current_debris_kg', 300))
                
                capacity_penalty = 35.0 if risk_kg > capacity else 0.0
                fit_bonus = min(capacity, risk_kg) * 0.08
                
                cost = (transit_hours * 8.0) + capacity_penalty - fit_bonus
                cost_matrix[i, j] = cost
                row_metrics.append({
                    "dist_nm": dist_nm,
                    "transit_hours": transit_hours,
                    "target_kg": risk_kg
                })
            metrics_matrix.append(row_metrics)
                
        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        
        assignments = []
        for i, j in zip(row_ind, col_ind):
            met = metrics_matrix[i][j]
            target_zone_name = hotspots[j].get("zone_name", hotspots[j].get("name", "Zone"))
            vessel_name = fleet[i]["vessel"]
            dist_nm = met["dist_nm"]
            eta_hours = met["transit_hours"]
            cap_kg = fleet[i].get("capacity_kg", 500)
            rec_kg = min(cap_kg, met["target_kg"])
            
            assignments.append({
                "vessel_name": vessel_name,
                "target_zone": target_zone_name,
                "zone_id": hotspots[j].get("id", ""),
                "distance_nm": dist_nm,
                "eta_hours": eta_hours,
                "vessel_capacity_kg": cap_kg,
                "estimated_recovery_kg": rec_kg,
                "reasoning": f"Deploying from {fleet[i].get('current_location', 'Base')} ({dist_nm} NM transit, ETA {eta_hours}h) to intercept estimated {rec_kg} kg debris."
            })
            
        return assignments

    def explain_assignment(self, assignments: list):
        """
        Use Gemini 2.5 Flash to generate natural language explanations. Fallback to Groq.
        """
        prompt = f'''
        Explain these vessel dispatch assignments logically to a fleet commander.
        Assignments: {assignments}
        Keep explanations short (1 sentence per vessel).
        Return a JSON array of objects with "vessel_name" and "reasoning" keys.
        '''

        try:
            client = genai.Client()
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            return response.text
        except Exception as gemini_err:
            print(f"Gemini dispatch explanation failed, falling back to Groq: {gemini_err}")
            try:
                groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
                completion = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                
                # Check if it returned an array wrapped in an object or just the array text
                result_text = completion.choices[0].message.content
                return result_text
            except Exception as groq_err:
                print(f"Groq fallback failed: {groq_err}")
                raise

dispatch_service = DispatchService()
