import { Component, Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useTheme } from "../context/useTheme";
import { Bounds, Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";

const MODEL_PATH = "/models/astronaut.glb";
const MAX_DEVICE_PIXEL_RATIO = typeof window === "undefined" ? 1 : Math.min(1.5, window.devicePixelRatio || 1);

const markers = [
  { key: "heart_rate", label: "Heart rate", color: "#fb7185", position: [0.18, 1.15, 0.28] },
  { key: "oxygen_saturation", label: "Oxygen saturation", color: "#22d3ee", position: [0, 1.38, 0.18] },
  { key: "stress_index", label: "Stress", color: "#a78bfa", position: [-0.28, 0.55, 0.2] },
  { key: "fatigue_index", label: "Fatigue", color: "#f97316", position: [0.28, 0.2, 0.16] },
  { key: "radiation_dose_rate", label: "Radiation exposure", color: "#fbbf24", position: [0.46, 0.88, 0] },
];

function LoadingIndicator() {
  const { progress } = useProgress();
  return <div className="model-state"><span className="model-spinner" /> Loading astronaut model {Math.round(progress)}%</div>;
}

function AstronautModel({ onSelect }) {
  const { scene } = useGLTF(MODEL_PATH);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 4.8 / Math.max(size.y, 0.001);
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -bounds.min.y * scale - 2.4, -center.z * scale);
    return clone;
  }, [scene]);

  return (
    <group>
      <primitive object={model} />
      {markers.map((marker) => (
        <group key={marker.key} position={marker.position}>
          <mesh
            renderOrder={10}
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(marker.key);
            }}
          >
            <sphereGeometry args={[0.1, 20, 20]} />
            <meshBasicMaterial color={marker.color} depthTest={false} />
          </mesh>
          <pointLight color={marker.color} intensity={0.35} distance={0.8} />
        </group>
      ))}
    </group>
  );
}

class ModelErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="model-state model-error">Unable to load the 3D astronaut model. Check the GLB asset and try again.</div>;
    }
    return this.props.children;
  }
}

function AstronautVisualization({ onSelect, selectedMetric }) {
  const { resolvedTheme } = useTheme();
  const controls = useRef(null);
  const [webglError, setWebglError] = useState(false);

  const resetCamera = () => {
    controls.current?.reset();
  };

  return (
    <section className="twin-visual-card">
      <div className="visual-toolbar">
        <span className="eyebrow">REAL-TIME 3D DIGITAL TWIN</span>
        <button type="button" className="reset-view-button" onClick={resetCamera} aria-label="Reset camera">
          <RotateCcw size={14} /> Reset view
        </button>
      </div>
      <div className="astronaut-stage" role="img" aria-label="Interactive 3D astronaut. Drag to rotate and use the mouse wheel to zoom.">
        {webglError ? (
          <div className="model-state model-error">WebGL is unavailable in this browser. The synchronized metrics remain available below.</div>
        ) : (
          <ModelErrorBoundary>
            <Canvas
              shadows
              dpr={[1, MAX_DEVICE_PIXEL_RATIO]}
              camera={{ position: [0, 0.7, 6.4], fov: 36 }}
              gl={{ antialias: true, alpha: true }}
              onCreated={({ gl }) => {
                if (!gl.getContext()) setWebglError(true);
              }}
            >
              <color attach="background" args={[resolvedTheme === "light" ? "#dbeafe" : "#070e1b"]} />
              <ambientLight intensity={1.2} />
              <directionalLight position={[3, 5, 4]} intensity={3} castShadow />
              <directionalLight position={[-3, 2, 2]} intensity={1.5} color="#6bdcff" />
              <spotLight position={[0, 5, 2]} angle={0.45} penumbra={0.8} intensity={2} castShadow />
              <Suspense fallback={<Html center><LoadingIndicator /></Html>}>
                <Bounds fit clip observe margin={1.15}>
                  <AstronautModel onSelect={onSelect} />
                </Bounds>
              </Suspense>
              <OrbitControls
                ref={controls}
                enablePan={false}
                enableDamping
                dampingFactor={0.08}
                minDistance={3.5}
                maxDistance={9}
                target={[0, 0, 0]}
              />
            </Canvas>
          </ModelErrorBoundary>
        )}
        {selectedMetric && <span className="selected-marker-label">Selected: {selectedMetric.label}</span>}
        <p className="drag-hint">Drag to rotate · scroll to zoom · click a glowing marker</p>
      </div>
      <p className="visual-note">GLB model loaded from the project asset. Marker positions are interface aids, not claims about physical sensor placement.</p>
    </section>
  );
}

useGLTF.preload(MODEL_PATH);

export default AstronautVisualization;
