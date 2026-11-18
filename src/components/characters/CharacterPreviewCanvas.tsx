import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ContactShadows, OrbitControls, Sparkles } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { animateCharacterPose, buildCharacterRig } from '../../game/CharacterModels';
import { CharacterClassId, WeaponId } from '../../game/types';
import { buildWeaponModel, SHARED_WEAPON_MATERIALS } from '../../game/WeaponModels';
import { disposeObjectSubtree } from '../../utils/threeDisposal';
import { detectSoftwareWebGL } from '../../utils/webglCapabilities';

function HangarEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.72;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene]);
  return null;
}

export type InspectStance = 'idle' | 'walk' | 'run' | 'crouch';

interface CharacterPreviewCanvasProps {
  mode: 'character' | 'weapon';
  classId?: CharacterClassId;
  weaponId?: WeaponId;
  className?: string;
  interactive?: boolean;
  showStanceControls?: boolean;
}

function CharacterSubject({
  classId,
  stance,
  isSoftwareGl,
}: {
  classId: CharacterClassId;
  stance: InspectStance;
  isSoftwareGl: boolean;
}) {
  const rig = useMemo(
    () => buildCharacterRig(classId, undefined, !isSoftwareGl),
    [classId, isSoftwareGl]
  );

  useEffect(() => {
    return () => {
      disposeObjectSubtree(rig.root, undefined, SHARED_WEAPON_MATERIALS);
    };
  }, [rig]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const speedRatio = stance === 'run' ? 1.0 : stance === 'walk' ? 0.5 : 0;
    const crouching = stance === 'crouch';
    animateCharacterPose(rig, t, speedRatio, crouching, 0, false, 0, {
      dt: delta,
      onGround: true,
    });
  });

  return <primitive object={rig.root} position={[0, 0.02, 0]} />;
}

function WeaponSubject({ weaponId }: { weaponId: WeaponId }) {
  const groupRef = useRef<THREE.Group>(null);
  const model = useMemo(
    () => buildWeaponModel(weaponId, weaponId === 'm4a1' || weaponId === 'usp'),
    [weaponId]
  );

  useEffect(() => {
    return () => {
      disposeObjectSubtree(model, undefined, SHARED_WEAPON_MATERIALS);
    };
  }, [model]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.6) * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={model} rotation={[0, Math.PI * 0.42, 0]} scale={1.95} />
    </group>
  );
}

function HangarStage({
  isTerrorist,
  isSoftwareGl,
}: {
  isTerrorist: boolean;
  isSoftwareGl: boolean;
}) {
  const accentHex = isTerrorist ? '#f0a854' : '#62a8ff';
  return (
    <group>
      {/* Brushed Tactical Turntable Base */}
      <mesh position={[0, -0.07, 0]} receiveShadow={!isSoftwareGl}>
        <cylinderGeometry args={[0.92, 1.04, 0.14, 36]} />
        <meshStandardMaterial color="#1b2028" roughness={0.42} metalness={0.75} />
      </mesh>
      <mesh position={[0, 0.005, 0]} receiveShadow={!isSoftwareGl}>
        <cylinderGeometry args={[0.84, 0.88, 0.03, 36]} />
        <meshStandardMaterial color="#262d36" roughness={0.55} metalness={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <torusGeometry args={[0.88, 0.015, 8, 48]} />
        <meshBasicMaterial color={accentHex} transparent opacity={0.85} />
      </mesh>

      {/* Architectural Hangar Columns */}
      {[-1.65, 1.65].map((cx) => (
        <mesh key={cx} position={[cx, 1.65, -2.1]} receiveShadow={!isSoftwareGl}>
          <boxGeometry args={[0.32, 3.6, 0.42]} />
          <meshStandardMaterial color="#171b21" roughness={0.75} metalness={0.35} />
        </mesh>
      ))}

      {!isSoftwareGl && (
        <>
          <ContactShadows
            position={[0, 0.022, 0]}
            opacity={0.52}
            scale={2.4}
            blur={1.8}
            far={2.2}
          />
          <Sparkles
            count={28}
            scale={[2.6, 2.1, 2.2]}
            position={[0, 1.1, 0]}
            size={1.6}
            speed={0.25}
            opacity={0.45}
            color="#f7dcb2"
          />
        </>
      )}
    </group>
  );
}

export function CharacterPreviewCanvas({
  mode,
  classId = 'classic_ct',
  weaponId = 'ak47',
  className = '',
  interactive = true,
  showStanceControls = false,
}: CharacterPreviewCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [stance, setStance] = useState<InspectStance>('idle');
  const [zoomPct, setZoomPct] = useState(100);
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);

  const isTerrorist = classId.endsWith('_t');
  const defaultDist = mode === 'character' ? 3.35 : 1.45;
  const minDist = mode === 'character' ? 1.55 : 0.85;
  const maxDist = mode === 'character' ? 4.1 : 2.25;
  const targetPoint: [number, number, number] = mode === 'character' ? [0, 0.94, 0] : [0, 0, 0];

  const adjustZoom = (deltaDist: number) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const cam = ctrl.object;
    const dir = cam.position.clone().sub(ctrl.target);
    const curDist = dir.length();
    const nextDist = THREE.MathUtils.clamp(curDist + deltaDist, minDist, maxDist);
    dir.normalize().multiplyScalar(nextDist);
    cam.position.copy(ctrl.target).add(dir);
    ctrl.update();
    setZoomPct(Math.round((defaultDist / nextDist) * 100));
  };

  const resetView = () => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    ctrl.target.set(...targetPoint);
    ctrl.object.position.set(
      mode === 'character' ? 0.35 : 0,
      mode === 'character' ? 1.14 : 0.24,
      defaultDist
    );
    ctrl.update();
    setZoomPct(100);
  };

  useEffect(() => {
    setZoomPct(100);
    const ctrl = controlsRef.current;
    if (ctrl) {
      ctrl.target.set(...targetPoint);
      ctrl.object.position.set(
        mode === 'character' ? 0.35 : 0,
        mode === 'character' ? 1.14 : 0.24,
        defaultDist
      );
      ctrl.update();
    }
  }, [classId, weaponId, mode]);

  return (
    <div
      className={`relative w-full h-full select-none ${interactive ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Canvas
        shadows={!isSoftwareGl}
        dpr={isSoftwareGl ? 1 : [1, 2]}
        camera={{
          fov: 36,
          near: 0.1,
          far: 40,
          position: mode === 'character' ? [0.35, 1.14, 3.35] : [0, 0.24, 1.45],
        }}
        gl={{
          antialias: !isSoftwareGl,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.16,
        }}
      >
        <Suspense fallback={null}>
          <HangarEnvironment />
          <hemisphereLight args={['#aad2f7', '#3b3229', 0.72]} />
          <directionalLight
            position={[2.8, 4.4, 3.6]}
            intensity={1.95}
            color="#ffe7c2"
            castShadow={!isSoftwareGl}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0005}
          />
          <directionalLight
            position={[-3.2, 2.8, -3.4]}
            intensity={1.15}
            color={isTerrorist ? '#ffb366' : '#6db4f7'}
          />
          <pointLight
            position={[0.6, 0.5, 1.8]}
            intensity={0.7}
            distance={7}
            color={isTerrorist ? '#f59536' : '#4b8fe8'}
          />

          {mode === 'character' ? (
            <>
              <HangarStage isTerrorist={isTerrorist} isSoftwareGl={isSoftwareGl} />
              <CharacterSubject classId={classId} stance={stance} isSoftwareGl={isSoftwareGl} />
            </>
          ) : (
            <WeaponSubject weaponId={weaponId} />
          )}

          {interactive && (
            <OrbitControls
              ref={controlsRef}
              makeDefault
              target={targetPoint}
              enablePan={false}
              enableDamping={!isSoftwareGl}
              dampingFactor={0.08}
              autoRotate={!isSoftwareGl}
              autoRotateSpeed={0.95}
              minDistance={minDist}
              maxDistance={maxDist}
              minPolarAngle={Math.PI * 0.22}
              maxPolarAngle={Math.PI * 0.58}
              onChange={() => {
                const ctrl = controlsRef.current;
                if (ctrl) {
                  const d = ctrl.object.position.distanceTo(ctrl.target);
                  setZoomPct(Math.round((defaultDist / Math.max(0.4, d)) * 100));
                }
              }}
            />
          )}

          {!isSoftwareGl && (
            <EffectComposer multisampling={4}>
              <Bloom mipmapBlur luminanceThreshold={0.92} intensity={0.28} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>

      {/* Stance inspection switcher for 3D character selection */}
      {mode === 'character' && showStanceControls && (
        <div
          className="absolute top-2 left-2 flex items-center gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {(['idle', 'walk', 'run', 'crouch'] as InspectStance[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStance(s)}
              className={`px-2 py-0.5 text-[10px] font-mono-tabular uppercase border cursor-pointer ${
                stance === s
                  ? 'bg-[#f5b841]/25 border-[#f5b841] text-white'
                  : 'bg-black/55 border-white/20 text-white/70 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {interactive && (
        <div
          className="absolute bottom-2 right-2 flex items-center gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Zoom Out"
            onClick={() => adjustZoom(0.45)}
            className="p-1.5 bg-black/55 hover:bg-black/80 border border-white/20 text-white/85 hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 py-0.5 bg-black/55 border border-white/15 text-[10px] font-mono-tabular text-white/80">
            {zoomPct}%
          </span>
          <button
            type="button"
            title="Zoom In"
            onClick={() => adjustZoom(-0.45)}
            className="p-1.5 bg-black/55 hover:bg-black/80 border border-white/20 text-white/85 hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Reset Camera"
            onClick={resetView}
            className="p-1.5 bg-black/55 hover:bg-black/80 border border-white/20 text-white/85 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
