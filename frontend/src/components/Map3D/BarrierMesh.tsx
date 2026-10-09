import { useMemo } from 'react';
import * as THREE from 'three';
import { useSim } from '../../store';
import { projectLatLon } from './ShorelineMesh';
import { Html } from '@react-three/drei';

export function BarrierMesh() {
  const barrierEfficiency = useSim(state => state.barrierEfficiency);
  const isBarrierActive = useSim(state => state.isBarrierActive);
  const selectedLocation = useSim(state => state.selectedLocation);

  // Dynamically place barrier boom ~1.5km offshore west of the active outfall location
  const barrierPoints = useMemo(() => {
    const lat = selectedLocation.lat;
    const lon = selectedLocation.lon;

    const p1 = projectLatLon(lat + 0.015, lon - 0.025);
    const p2 = projectLatLon(lat, lon - 0.030);
    const p3 = projectLatLon(lat - 0.015, lon - 0.025);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(p1.x, 0.4, p1.z),
      new THREE.Vector3(p2.x, 0.4, p2.z),
      new THREE.Vector3(p3.x, 0.4, p3.z),
    ]);

    return curve.getPoints(30);
  }, [selectedLocation]);

  const tubeGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(barrierPoints);
    return new THREE.TubeGeometry(curve, 30, 0.35, 8, false);
  }, [barrierPoints]);

  if (!isBarrierActive || barrierEfficiency <= 0) return null;

  const midPoint = barrierPoints[Math.floor(barrierPoints.length / 2)];

  return (
    <group>
      {/* Floating Boom Tube */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial 
          color="#ff4d00" 
          roughness={0.3} 
          metalness={0.7}
          emissive="#ff4d00"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Floating Beacon Buoys along the barrier */}
      {barrierPoints.filter((_, i) => i % 4 === 0).map((pt, idx) => (
        <group key={idx} position={[pt.x, 0.5, pt.z]}>
          <mesh>
            <cylinderGeometry args={[0.25, 0.25, 0.7, 8]} />
            <meshStandardMaterial color={idx % 2 === 0 ? "#ffffff" : "#ff4d00"} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Barrier Active Label */}
      <Html distanceFactor={50} position={[midPoint.x, 1.8, midPoint.z]} center pointerEvents="none">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-black border-2 border-[#ff4d00] text-[9px] font-mono uppercase font-bold tracking-widest text-white shadow-2xl">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00] animate-pulse"></span>
          <span>OFFSHORE BOOM: {barrierEfficiency}% CAPTURE</span>
        </div>
      </Html>
    </group>
  );
}

export default BarrierMesh;
