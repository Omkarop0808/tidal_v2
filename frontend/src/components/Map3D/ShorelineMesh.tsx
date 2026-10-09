import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { OUTFALL_LOCATIONS, useSim } from '../../store';

// Coordinate projection helper: converts Mumbai Lat/Lon to X/Z plane (grid 120x120)
export const projectLatLon = (lat: number, lon: number) => {
  const latMin = 18.85, latMax = 19.35;
  const lonMin = 72.70, lonMax = 72.96;
  
  const z = -((lat - latMin) / (latMax - latMin) * 110 - 55); // North is -Z
  const x = (lon - lonMin) / (lonMax - lonMin) * 110 - 55;
  
  return { x, z };
};

export function ShorelineMesh() {
  const selectedLocation = useSim(state => state.selectedLocation);
  const setSelectedLocation = useSim(state => state.setSelectedLocation);

  // Full Western Coastline contour polygon for Greater Mumbai (Colaba to Vasai Creek)
  const shorelinePoints = useMemo(() => {
    const rawCoordinates: [number, number][] = [
      // 1. South Colaba Point & Navy Basin
      [18.890, 72.812],
      [18.910, 72.818],
      // 2. Nariman Point & Marine Drive Bay
      [18.925, 72.823],
      [18.940, 72.822],
      [18.950, 72.805],
      // 3. Malabar Hill & Walkeshwar Promontory
      [18.955, 72.793],
      [18.970, 72.798],
      [18.985, 72.805],
      // 4. Worli Point & Sea Face
      [19.005, 72.812],
      [19.020, 72.815],
      // 5. Mahim Bay & Mithi River Outfall
      [19.035, 72.835],
      [19.045, 72.830],
      // 6. Bandra Bandstand & Carter Road
      [19.055, 72.818],
      [19.070, 72.820],
      // 7. Khar Danda & Juhu Beach
      [19.085, 72.824],
      [19.100, 72.826],
      [19.120, 72.820],
      // 8. Versova Creek & Fishing Village
      [19.135, 72.814],
      [19.150, 72.808],
      // 9. Madh Island, Erangal & Silver Beach
      [19.165, 72.795],
      [19.185, 72.790],
      // 10. Aksa Beach & Dana Pani
      [19.175, 72.792],
      // 11. Marve Beach & Malad Creek
      [19.198, 72.788],
      // 12. Manori Beach & Fishing Creek
      [19.215, 72.775],
      // 13. Gorai Beach
      [19.245, 72.770],
      // 14. Uttan & Bhayandar Estuary
      [19.280, 72.775],
      // 15. Vasai Creek Outfall Mouth
      [19.310, 72.780],
      [19.330, 72.795],
      // 16. Inland Eastern Boundary Closure (Thane & Mumbai Mainland)
      [19.330, 72.955],
      [18.890, 72.955],
    ];

    return rawCoordinates.map(([lat, lon]) => {
      const { x, z } = projectLatLon(lat, lon);
      return new THREE.Vector2(x, z);
    });
  }, []);

  // Create extruded 3D landmass and contour line
  const { geometry, lineObj } = useMemo(() => {
    const shape = new THREE.Shape(shorelinePoints);
    const extrudeSettings = {
      steps: 1,
      depth: 1.8,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.4,
      bevelSegments: 3,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2); // Lay flat on X/Z plane
    geom.translate(0, 0.9, 0);

    const edgePoints = shorelinePoints.slice(0, 27).map(p => new THREE.Vector3(p.x, 1.9, p.y));
    const edgeGeom = new THREE.BufferGeometry().setFromPoints(edgePoints);
    const edgeMat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 });
    const lineObj = new THREE.Line(edgeGeom, edgeMat);

    return { geometry: geom, lineObj };
  }, [shorelinePoints]);

  return (
    <group>
      {/* 3D Landmass Mesh */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#0f0f0f" 
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* Coastline Tactical Vector Edge Line */}
      <primitive object={lineObj} />

      {/* Coastal Outfalls & Landmarks with interactive pins */}
      {OUTFALL_LOCATIONS.map((loc) => {
        const { x, z } = projectLatLon(loc.lat, loc.lon);
        const isSelected = selectedLocation.id === loc.id;
        const isCritical = loc.id === 'versova' || loc.id === 'mahim';

        return (
          <group 
            key={loc.id} 
            position={[x, 2.2, z]}
            onClick={() => setSelectedLocation(loc)}
          >
            {/* 3D Pin Beacon */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[isSelected ? 1.0 : 0.6, isSelected ? 1.0 : 0.6, isSelected ? 1.0 : 0.6]} />
              <meshBasicMaterial 
                color={isSelected ? '#ff4d00' : isCritical ? '#ffffff' : '#737373'} 
              />
            </mesh>

            {/* Target Reticle under active marker */}
            <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[isSelected ? 0.9 : 0.6, isSelected ? 1.5 : 0.9, 16]} />
              <meshBasicMaterial 
                color={isSelected ? '#ff4d00' : '#ffffff'} 
                transparent 
                opacity={isSelected ? 0.9 : 0.25} 
              />
            </mesh>

            {/* Tactical Label Annotation */}
            <Html distanceFactor={45} position={[0, 1.5, 0]} center pointerEvents="none">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] font-mono uppercase font-bold tracking-wider whitespace-nowrap shadow-2xl transition-all ${
                isSelected 
                  ? 'bg-black text-[#ff4d00] border-[#ff4d00] shadow-[0_0_12px_rgba(255,77,0,0.4)]' 
                  : isCritical
                  ? 'bg-black/90 text-white border-white'
                  : 'bg-black/80 text-[#a3a3a3] border-[#333333]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#ff4d00] animate-ping' : isCritical ? 'bg-white' : 'bg-[#737373]'}`}></span>
                <span>{loc.name.split(' ')[0]}</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default ShorelineMesh;
