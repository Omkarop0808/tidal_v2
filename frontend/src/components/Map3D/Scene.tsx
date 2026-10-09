import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Particles } from './Particles';
import { ForceVectors } from './ForceVectors';
import { ShorelineMesh } from './ShorelineMesh';
import { BarrierMesh } from './BarrierMesh';
import { Suspense, useEffect } from 'react';
import { useSim } from '../../store';

interface SceneProps {
  showBaseline?: boolean;
  showActive?: boolean;
  showTrapped?: boolean;
  showBeached?: boolean;
  showForceVectors?: boolean;
}

function CameraManager() {
  const cameraView = useSim(state => state.cameraView);
  const { camera } = useThree();

  useEffect(() => {
    if (cameraView === 'topDown') {
      camera.position.set(0, 52, 0.01);
      camera.lookAt(0, 0, 0);
    } else if (cameraView === 'shoreline') {
      camera.position.set(-10, 10, 24);
      camera.lookAt(0, 1.5, 0);
    } else {
      // perspective
      camera.position.set(0, 32, 32);
      camera.lookAt(0, 0, 0);
    }
  }, [cameraView, camera]);

  return null;
}

export function Scene({
  showBaseline = true,
  showActive = true,
  showTrapped = true,
  showBeached = true,
  showForceVectors = true
}: SceneProps) {
  return (
    <div className="w-full h-full bg-[#000000] relative select-none">
      <Canvas 
        camera={{ position: [0, 32, 32], fov: 36 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#000000']} />
        <CameraManager />
        
        <ambientLight intensity={0.65} />
        <directionalLight position={[20, 30, 20]} intensity={1.2} />
        <pointLight position={[-20, 15, -20]} intensity={0.5} color="#ffffff" />
        
        <Suspense fallback={null}>
          {/* Mumbai Coastal Topography Mesh */}
          <ShorelineMesh />

          {/* Defensive Boom Containment Barrier */}
          <BarrierMesh />

          {/* Hydrodynamic Wind & Current Force Vectors */}
          {showForceVectors && <ForceVectors />}

          {/* Unmitigated Control Track: Baseline (Ghost Dots) */}
          {showBaseline && (
            <Particles 
              isBaseline={true} 
              showActive={showActive} 
              showTrapped={showTrapped} 
              showBeached={showBeached} 
            />
          )}

          {/* Active Intervention Track: Mitigated (White / Cyan / Orange) */}
          <Particles 
            isBaseline={false} 
            showActive={showActive} 
            showTrapped={showTrapped} 
            showBeached={showBeached} 
          />
          
          {/* Oceanic Bathymetric Spatial Grid */}
          <Grid 
            args={[120, 120]} 
            position={[0, 0, 0]} 
            cellColor="#111111" 
            sectionColor="#333333" 
            cellThickness={0.5} 
            sectionThickness={1.2} 
            fadeDistance={90} 
            infiniteGrid 
          />
          
          {/* Camera Orbit Controls bounded to realistic top-down perspective */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={15}
            maxDistance={90}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Scene;
