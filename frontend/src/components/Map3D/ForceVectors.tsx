import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSim } from '../../store';

export function ForceVectors() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const windSpeed = useSim(state => state.windSpeed);
  
  const GRID_SIZE = 6;
  const spacing = 16;
  const count = GRID_SIZE * GRID_SIZE;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const geometry = useMemo(() => {
    const geom = new THREE.ConeGeometry(0.4, 3.5, 4);
    geom.rotateX(Math.PI / 2);
    return geom;
  }, []);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    const time = clock.getElapsedTime();
    
    let i = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        const posX = (x - Math.floor(GRID_SIZE / 2)) * spacing + (spacing / 2) - 15;
        const posZ = (z - Math.floor(GRID_SIZE / 2)) * spacing + (spacing / 2);
        
        const angleOffset = Math.sin(time * 1.5 + x * 0.4 + z * 0.4) * 0.12;
        
        const heading = (Math.PI / 4) + angleOffset; // SW to NE monsoonal onshore vector
        dummy.position.set(posX, 0.8, posZ);
        dummy.rotation.set(0, heading, 0);
        
        const scale = 0.35 + (windSpeed / 60);
        dummy.scale.set(scale, scale, scale);
        
        const flowOffset = (time * (windSpeed / 5.5) + x + z) % spacing;
        dummy.translateZ(flowOffset - spacing / 2);
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i++, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined as any, count]}>
      <meshBasicMaterial 
        color="#ffffff" 
        transparent 
        opacity={Math.min(0.5, 0.15 + (windSpeed / 100))} 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
      />
    </instancedMesh>
  );
}

export default ForceVectors;
