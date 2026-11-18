import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Compass, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { BuiltMap, MapCalloutPin, mapManager } from '../game/MapManager';
import { bakeBiomeEnvironment, MAP_LIGHTING_PROFILES } from '../game/lighting/CinematicLightingSystem';
import { MapId } from '../game/types';
import { disposeObjectSubtree } from '../utils/threeDisposal';
import { detectSoftwareWebGL } from '../utils/webglCapabilities';

type ViewPreset = 'overview' | 'site_a' | 'site_b' | 'mid';

interface MapPreviewCanvasProps {
  mapId: MapId;
  className?: string;
}

function MapPreviewEnvironment({ built }: { built: BuiltMap }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const rt = bakeBiomeEnvironment(gl, built);
    const profile = MAP_LIGHTING_PROFILES[built.id];
    scene.environment = rt.texture;
    scene.environmentIntensity = profile ? profile.environmentIntensity : 0.72;
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene, built]);
  return null;
}

function getPresetCamera(
  built: BuiltMap,
  preset: ViewPreset
): { pos: [number, number, number]; target: [number, number, number] } {
  const siteA = built.bombsites.find((b) => b.label === 'A');
  const siteB = built.bombsites.find((b) => b.label === 'B');
  const midPin = built.callouts?.find((c) => c.zone === 'MID');

  if (preset === 'site_a' && siteA) {
    return {
      pos: [siteA.x + 22, siteA.y + 19, siteA.z + 24],
      target: [siteA.x, siteA.y + 1.2, siteA.z],
    };
  }
  if (preset === 'site_b' && siteB) {
    return {
      pos: [siteB.x - 22, siteB.y + 19, siteB.z + 24],
      target: [siteB.x, siteB.y + 1.2, siteB.z],
    };
  }
  if (preset === 'mid' && midPin) {
    return {
      pos: [midPin.x + 24, midPin.y + 22, midPin.z + 26],
      target: [midPin.x, midPin.y, midPin.z],
    };
  }
  const cx = (built.bounds.minX + built.bounds.maxX) * 0.5;
  const cz = (built.bounds.minZ + built.bounds.maxZ) * 0.5;
  return {
    pos: [cx + 68, 66, cz + 72],
    target: [cx, 1.5, cz],
  };
}

function MapSceneSubject({
  built,
  controlsRef,
  preset,
  pinElsRef,
  showCallouts,
}: {
  built: BuiltMap;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  preset: ViewPreset;
  pinElsRef: React.RefObject<Record<number, HTMLDivElement | null>>;
  showCallouts: boolean;
}) {
  const { camera, size } = useThree();
  const projVec = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const ctrl = controlsRef.current;
    const cfg = getPresetCamera(built, preset);
    camera.position.set(...cfg.pos);
    if (ctrl) {
      ctrl.target.set(...cfg.target);
      ctrl.update();
    } else {
      camera.lookAt(...cfg.target);
    }
  }, [built, preset, camera, controlsRef]);

  useFrame(() => {
    const pins = built.callouts;
    const map = pinElsRef.current;
    if (!pins || !map) return;

    for (let i = 0; i < pins.length; i++) {
      const el = map[i];
      if (!el) continue;
      if (!showCallouts) {
        el.style.display = 'none';
        continue;
      }
      const p = pins[i];
      projVec.set(p.x, p.y + 1.4, p.z).project(camera);
      const visible = projVec.z > -1 && projVec.z < 1;
      if (!visible) {
        el.style.display = 'none';
        continue;
      }
      const x = (projVec.x * 0.5 + 0.5) * size.width;
      const y = (-projVec.y * 0.5 + 0.5) * size.height;
      if (x < 24 || x > size.width - 24 || y < 18 || y > size.height - 46) {
        el.style.display = 'none';
        continue;
      }
      el.style.display = 'flex';
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -100%)`;
    }
  });

  const profile = MAP_LIGHTING_PROFILES[built.id];
  const sunDir = built.sunPos.clone().normalize();
  const rimPos: [number, number, number] = [-sunDir.x * 64, Math.max(24, sunDir.y * 36), -sunDir.z * 64];
  const bouncePos: [number, number, number] = [-sunDir.z * 42, 16, sunDir.x * 42];

  return (
    <>
      <color attach="background" args={[built.skyColor]} />
      <fogExp2 attach="fog" args={[built.fogColor, built.fogDensity * 0.65]} />
      <hemisphereLight args={[built.hemiSky, built.hemiGround, built.hemiIntensity * 0.92]} />
      <directionalLight
        position={[built.sunPos.x, built.sunPos.y, built.sunPos.z]}
        intensity={built.sunIntensity * (profile?.sunScale ?? 1)}
        color={built.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.025}
        shadow-camera-near={1}
        shadow-camera-far={230}
        shadow-camera-left={-72}
        shadow-camera-right={72}
        shadow-camera-top={72}
        shadow-camera-bottom={-72}
      />
      <directionalLight
        position={rimPos}
        intensity={profile?.rimIntensity ?? 0.48}
        color={profile?.rimColor ?? 0x8dbce8}
      />
      <directionalLight
        position={bouncePos}
        intensity={profile?.bounceIntensity ?? 0.34}
        color={profile?.bounceColor ?? 0xd4b28a}
      />
      <primitive object={built.group} />
    </>
  );
}

function zoneColor(zone: MapCalloutPin['zone']): string {
  switch (zone) {
    case 'A':
      return 'border-[#f5b841] text-[#ffd77a]';
    case 'B':
      return 'border-[#f07654] text-[#ff9f85]';
    case 'T':
      return 'border-[#e09d4f] text-[#f4c082]';
    case 'CT':
      return 'border-[#64a8f0] text-[#9ecbff]';
    default:
      return 'border-white/45 text-white/95';
  }
}

export function MapPreviewCanvas({ mapId, className = '' }: MapPreviewCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const pinElsRef = useRef<Record<number, HTMLDivElement | null>>({});
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const [preset, setPreset] = useState<ViewPreset>('overview');
  const [showCallouts, setShowCallouts] = useState(true);

  const built = useMemo(() => mapManager.buildMap(mapId, !isSoftwareGl), [mapId, isSoftwareGl]);

  useEffect(() => {
    setPreset('overview');
  }, [mapId]);

  useEffect(() => {
    return () => {
      disposeObjectSubtree(built.group);
    };
  }, [built]);

  const adjustZoom = (delta: number) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const cam = ctrl.object;
    const dir = cam.position.clone().sub(ctrl.target);
    const nextDist = THREE.MathUtils.clamp(dir.length() + delta, 18, 140);
    dir.normalize().multiplyScalar(nextDist);
    cam.position.copy(ctrl.target).add(dir);
    ctrl.update();
  };

  const resetOverview = () => {
    setPreset('overview');
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const cfg = getPresetCamera(built, 'overview');
    ctrl.object.position.set(...cfg.pos);
    ctrl.target.set(...cfg.target);
    ctrl.update();
  };

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden bg-[#0e1217] cursor-grab active:cursor-grabbing ${className}`}
    >
      <Canvas
        shadows={!isSoftwareGl}
        dpr={isSoftwareGl ? 1 : [1, 1.75]}
        camera={{ fov: 44, near: 0.4, far: 620, position: [68, 66, 72] }}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <Suspense fallback={null}>
          <MapPreviewEnvironment built={built} />
          <MapSceneSubject
            built={built}
            controlsRef={controlsRef}
            preset={preset}
            pinElsRef={pinElsRef}
            showCallouts={showCallouts}
          />
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping={!isSoftwareGl}
            dampingFactor={0.08}
            autoRotate={!isSoftwareGl && preset === 'overview'}
            autoRotateSpeed={0.38}
            minDistance={18}
            maxDistance={138}
            minPolarAngle={0.18}
            maxPolarAngle={Math.PI * 0.46}
          />
        </Suspense>
      </Canvas>

      {/* Projected 3D Callout Overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {(built.callouts || []).map((pin, idx) => (
          <div
            key={`${mapId}-${pin.name}`}
            ref={(el) => {
              pinElsRef.current[idx] = el;
            }}
            style={{ display: 'none' }}
            className={`absolute top-0 left-0 items-center gap-1.5 px-2 py-0.5 bg-[#0b0e12]/88 border text-[10px] font-mono-tabular uppercase tracking-wider whitespace-nowrap shadow-md ${zoneColor(
              pin.zone
            )}`}
          >
            <span className="font-semibold">{pin.name}</span>
          </div>
        ))}
      </div>

      {/* Top Camera Preset Bar */}
      <div
        className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 pointer-events-auto flex-wrap">
          {(
            [
              { id: 'overview', label: 'Aerial Overview' },
              { id: 'site_a', label: 'Site A' },
              { id: 'site_b', label: 'Site B' },
              { id: 'mid', label: 'Mid Lane' },
            ] as { id: ViewPreset; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              className={`px-2.5 py-1 text-[11px] font-display uppercase tracking-wider border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                preset === item.id
                  ? 'bg-[#f5b841]/25 border-[#f5b841] text-white font-semibold'
                  : 'bg-[#0b0e12]/82 border-white/20 text-white/75 hover:text-white hover:border-white/45'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCallouts((v) => !v)}
          className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 bg-[#0b0e12]/82 border border-white/20 hover:border-white/45 text-[11px] font-mono-tabular uppercase text-white/80 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          {showCallouts ? <Eye className="w-3.5 h-3.5 text-[#f5b841]" /> : <EyeOff className="w-3.5 h-3.5" />}
          Callouts
        </button>
      </div>

      {/* Bottom Hint & Zoom Controls */}
      <div
        className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0b0e12]/82 border border-white/15 text-[11px] text-white/70">
          <Compass className="w-3.5 h-3.5 text-[#f5b841] shrink-0" />
          <span className="whitespace-nowrap">Drag orbit · Right-drag pan · Scroll zoom</span>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            type="button"
            title="Zoom Out"
            onClick={() => adjustZoom(14)}
            className="p-1.5 bg-[#0b0e12]/82 hover:bg-[#0b0e12] border border-white/20 text-white/85 hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Zoom In"
            onClick={() => adjustZoom(-14)}
            className="p-1.5 bg-[#0b0e12]/82 hover:bg-[#0b0e12] border border-white/20 text-white/85 hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Reset Aerial View"
            onClick={resetOverview}
            className="p-1.5 bg-[#0b0e12]/82 hover:bg-[#0b0e12] border border-white/20 text-white/85 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
