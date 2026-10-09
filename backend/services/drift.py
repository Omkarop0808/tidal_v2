import numpy as np

class DriftEngine:
    def __init__(self):
        # Mumbai bounding box approx
        self.lat_min = 18.80
        self.lat_max = 19.30
        self.lon_min = 72.70
        self.lon_max = 72.95
        
        # Simple coastline approx (longitudes eastward of this are 'beached' in Mumbai)
        self.coastline_lon = 72.82 

    def simulate_drift_monte_carlo(self, start_lat: float, start_lon: float, env_data: dict, 
                                   hours: int = 72, num_particles: int = 120,
                                   barrier_active: bool = False, barrier_efficiency: float = 0.0,
                                   cleanup_teams: int = 0):
        """
        Vectorized Monte-Carlo simulation for N particles with physical
        containment boom collision and skimmer squad interception dynamics.
        """
        # Fallback physics if env_data is missing
        wind_u, wind_v = 0.0, 0.0
        curr_u, curr_v = 0.0, 0.0

        if env_data:
            weather = env_data.get('weather', {})
            marine = env_data.get('marine', {})
            
            wind_speed = weather.get('wind_speed_10m', 15)  # km/h
            wind_dir = weather.get('wind_direction_10m', 225) # degrees

            curr_speed = marine.get('ocean_current_velocity', 1.0) # km/h
            curr_dir = marine.get('ocean_current_direction', 225) # degrees

            # Convert to u,v components (km/h)
            wind_u = wind_speed * np.sin(np.radians(wind_dir))
            wind_v = wind_speed * np.cos(np.radians(wind_dir))
            
            curr_u = curr_speed * np.sin(np.radians(curr_dir))
            curr_v = curr_speed * np.cos(np.radians(curr_dir))

        # Initialize particles with slight initial outfall dispersion
        init_spread_lat = np.random.normal(0, 0.002, num_particles)
        init_spread_lon = np.random.normal(0, 0.002, num_particles)
        particles_lat = np.full(num_particles, start_lat) + init_spread_lat
        particles_lon = np.full(num_particles, start_lon) + init_spread_lon
        beached_mask = np.zeros(num_particles, dtype=bool)
        trapped_mask = np.zeros(num_particles, dtype=bool)

        trajectory = []
        
        # Precompute constants
        lat_km = 111.0
        leeway_factor = 0.03
        
        total_u = curr_u + (wind_u * leeway_factor)
        total_v = curr_v + (wind_v * leeway_factor)

        for hour in range(0, hours + 1, 6):
            if hour > 0:
                active = ~(beached_mask | trapped_mask)
                n_active = np.sum(active)
                
                if n_active > 0:
                    lon_km = 111.0 * np.cos(np.radians(np.mean(particles_lat[active])))
                    diffusion_u = np.random.normal(0, 0.45, n_active)
                    diffusion_v = np.random.normal(0, 0.45, n_active)

                    # Calculate shift in degrees for 6 hours
                    lat_shift = ((total_v + diffusion_v) * 6) / lat_km
                    lon_shift = ((total_u + diffusion_u) * 6) / lon_km

                    particles_lat[active] += lat_shift
                    particles_lon[active] += lon_shift
                    
                    # 1. Physical Offshore Barrier Boom Collision Check
                    if barrier_active and barrier_efficiency > 0:
                        # Boom arc spans ~0.02 deg west of outfall and +/- 0.02 deg lat
                        near_boom = (
                            (particles_lon <= (start_lon - 0.012)) & 
                            (particles_lon >= (start_lon - 0.035)) & 
                            (np.abs(particles_lat - start_lat) <= 0.022) & 
                            active
                        )
                        if np.any(near_boom):
                            roll = np.random.uniform(0, 100, np.sum(near_boom))
                            caught = roll < barrier_efficiency
                            caught_indices = np.where(near_boom)[0][caught]
                            trapped_mask[caught_indices] = True
                            # Pin caught particles along the protective boom line
                            particles_lon[caught_indices] = start_lon - 0.024 - np.random.uniform(0, 0.003, len(caught_indices))

                    # 2. Offshore Autonomous Skimmer Squad Sweeps
                    if cleanup_teams > 0:
                        still_active = ~(beached_mask | trapped_mask)
                        if np.any(still_active):
                            # Skimmer interception rate scales with fleet squads deployed
                            skim_rate = min(30.0, cleanup_teams * 2.2) # % chance per 6-hr sweep
                            skim_roll = np.random.uniform(0, 100, np.sum(still_active))
                            skimmed = skim_roll < skim_rate
                            skimmed_indices = np.where(still_active)[0][skimmed]
                            trapped_mask[skimmed_indices] = True

                    # 3. Dynamic Shoreline Beaching Check (Mumbai coastline boundary)
                    rem_active = ~(beached_mask | trapped_mask)
                    if np.any(rem_active):
                        coastline_bound = 72.82 - ((particles_lat - 18.9) * 0.05)
                        newly_beached = (particles_lon > coastline_bound) & rem_active
                        beached_mask[newly_beached] = True

            # Record center of mass of active/floating particles, or overall center
            active_final = ~(beached_mask | trapped_mask)
            if np.any(active_final):
                center_lat = np.mean(particles_lat[active_final])
                center_lon = np.mean(particles_lon[active_final])
            else:
                center_lat = np.mean(particles_lat)
                center_lon = np.mean(particles_lon)

            trajectory.append({
                "hour": hour,
                "lat": float(center_lat),
                "lon": float(center_lon),
                "beached_percent": float(np.mean(beached_mask) * 100),
                "trapped_percent": float(np.mean(trapped_mask) * 100),
                "particles": [
                    {
                        "lat": float(lat), 
                        "lon": float(lon), 
                        "beached": bool(b), 
                        "trapped": bool(t)
                    } 
                    for lat, lon, b, t in zip(particles_lat, particles_lon, beached_mask, trapped_mask)
                ]
            })

        return {
            "start_point": {"lat": start_lat, "lon": start_lon},
            "forecast_hours": hours,
            "beached_percent_final": float(np.mean(beached_mask) * 100),
            "trapped_percent_final": float(np.mean(trapped_mask) * 100),
            "trajectory": trajectory
        }

    def simulate_drift(self, start_lat: float, start_lon: float, env_data: dict, hours: int = 72):
        """Legacy wrapper for single trajectory"""
        res = self.simulate_drift_monte_carlo(start_lat, start_lon, env_data, hours, num_particles=1)
        return res["trajectory"]

drift_engine = DriftEngine()
