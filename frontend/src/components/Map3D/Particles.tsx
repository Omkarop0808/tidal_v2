import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSim } from '../../store';
import { projectLatLon } from './ShorelineMesh';

interface ParticlesProps {
  isBaseline?: boolean;
  showActive?: boolean;
  showTrapped?: boolean;
  showBeached?: boolean;
}

export function Particles({ 
  isBaseline = false,
  showActive = true,
  showTrapped = true,
  showBeached = true
}: ParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const trajectory = useSim(state => isBaseline ? state.trajectoryBaseline : state.trajectory);
  const currentFrameIndex = useSim(state => state.currentFrameIndex);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const MAX_PARTICLES = 1000;
  
  // Tactical Color Tokens:
  // Active Floating Debris: Crisp White (#ffffff)
  // Intercepted / Trapped at Offshore Boom: Electric Cyan (#00e5ff) - Saved from coastal impact!
  // Beached on Shoreline: Safety Orange (#ff4d00) - Impacted coastline!
  // Baseline (Ghost Trail): Dim Slate (#444444) -> Charcoal (#666666) when beached
  const activeFloatingColor = useMemo(() => new THREE.Color('#ffffff'), []);
  const interceptedBoomColor = useMemo(() => new THREE.Color('#00e5ff'), []);
  const shorelineBeachedColor = useMemo(() => new THREE.Color('#ff4d00'), []);
  
  const baselineFloatColor = useMemo(() => new THREE.Color('#444444'), []);
  const baselineBeachColor = useMemo(() => new THREE.Color('#666666'), []);

  useFrame(({ clock }) => {
    if (!meshRef.current || trajectory.length === 0) return;

    const frameIdx = Math.min(currentFrameIndex, trajectory.length - 1);
    const currentFrame = trajectory[frameIdx];
    if (!currentFrame || !currentFrame.particles) return;

    const time = clock.getElapsedTime();

    currentFrame.particles.forEach((p, i) => {
      if (i >= MAX_PARTICLES) return;
      
      const { x, z } = projectLatLon(p.lat, p.lon);
      const isTrapped = Boolean((p as any).trapped);
      const isBeached = Boolean(p.beached);
      const isFloating = !isTrapped && !isBeached;

      // Visibility filter
      let isVisible = true;
      if (isBaseline) {
        // baseline particles follow baseline toggle
        isVisible = isBeached ? showBeached : showActive;
      } else {
        if (isFloating && !showActive) isVisible = false;
        if (isTrapped && !showTrapped) isVisible = false;
        if (isBeached && !showBeached) isVisible = false;
      }

      if (!isVisible) {
        dummy.position.set(0, -999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        return;
      }
      
      // Wave motion on water surface
      const waveY = isBeached 
        ? 1.6 
        : isTrapped 
        ? 0.55 + Math.sin(time * 3 + x) * 0.03
        : 0.45 + Math.sin(time * 2 + x * 0.5 + z * 0.5) * 0.08;
      
      dummy.position.set(x, isBaseline ? waveY - 0.06 : waveY, z);

      // Scale: beached and trapped are slightly enlarged for tactical visibility
      const baseScale = isBaseline ? 0.75 : 1.15;
      const pulseScale = isTrapped ? 1.35 + Math.sin(time * 4 + i) * 0.1 : isBeached ? 1.4 : baseScale;
      dummy.scale.setScalar(pulseScale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Assign crisp thematic color
      let color = isBaseline ? baselineFloatColor : activeFloatingColor;
      if (isBaseline) {
        if (isBeached) color = baselineBeachColor;
      } else {
        if (isBeached) {
          color = shorelineBeachedColor; // #ff4d00 (Shoreline impact)
        } else if (isTrapped) {
          color = interceptedBoomColor; // #00e5ff (Captured at offshore barrier)
        }
      }
      
      meshRef.current!.setColorAt(i, color);
    });

    meshRef.current.count = currentFrame.particles.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (trajectory.length === 0 || !trajectory[0].particles) return null;

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined as any, undefined as any, MAX_PARTICLES]}
    >
      <sphereGeometry args={[0.35, 12, 12]} />
      <meshBasicMaterial 
        transparent
        opacity={isBaseline ? 0.35 : 0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default Particles;
