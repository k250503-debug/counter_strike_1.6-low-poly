import { useEffect, useRef, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { animateCharacterPose, buildCharacterRig, CharacterRig } from '../game/CharacterModels';
import { CharacterClassId, WeaponId } from '../game/types';
import { buildWeaponModel } from '../game/WeaponModels';

interface CharacterPreviewCanvasProps {
  mode: 'character' | 'weapon';
  classId?: CharacterClassId;
  weaponId?: WeaponId;
  className?: string;
  interactive?: boolean;
}

export function CharacterPreviewCanvas({
  mode,
  classId = 'classic_ct',
  weaponId = 'ak47',
  className = '',
  interactive = true,
}: CharacterPreviewCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef({ mode, classId, weaponId, interactive });
  propsRef.current = { mode, classId, weaponId, interactive };

  const rigRef = useRef<CharacterRig | null>(null);
  const subjectGroupRef = useRef<THREE.Group | null>(null);

  // Interactive orbit + zoom state synced via ref so Three.js loop reads smoothly
  const interactRef = useRef({
    dragging: false,
    lastX: 0,
    dragDist: 0,
    yawOffset: -0.22,
    yawVelocity: 0,
    userInteractedAt: -10,
    targetZoom: 3.35, // 3.35 = full head-to-toe, 1.65 = close-up
    currentZoom: 3.35,
    switchAnim: 1.0,
  });

  const [zoomPct, setZoomPct] = useState(100);

  const adjustZoom = (deltaDist: number) => {
    const st = interactRef.current;
    const minD = propsRef.current.mode === 'character' ? 1.6 : 0.9;
    const maxD = propsRef.current.mode === 'character' ? 3.85 : 2.1;
    st.targetZoom = THREE.MathUtils.clamp(st.targetZoom + deltaDist, minD, maxD);
    const defaultD = propsRef.current.mode === 'character' ? 3.35 : 1.45;
    setZoomPct(Math.round((defaultD / st.targetZoom) * 100));
  };

  const resetView = () => {
    const st = interactRef.current;
    st.yawOffset = -0.22;
    st.yawVelocity = 0;
    st.userInteractedAt = -10;
    st.targetZoom = propsRef.current.mode === 'character' ? 3.35 : 1.45;
    setZoomPct(100);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || 280, container.clientHeight || 320);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      36,
      (container.clientWidth || 280) / (container.clientHeight || 320),
      0.1,
      40
    );

    // Dramatic 3-point tactical showcase lighting
    const hemi = new THREE.HemisphereLight(0xaad2f7, 0x3b3229, 0.78);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffe7c2, 2.05);
    keyLight.position.set(2.8, 4.4, 3.6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6db4f7, 1.15);
    rimLight.position.set(-3.2, 2.8, -3.4);
    scene.add(rimLight);

    const underFill = new THREE.PointLight(0xf5a642, 0.7, 7, 1.5);
    underFill.position.set(0.6, 0.5, 1.8);
    scene.add(underFill);

    // Tactical Turntable Stage Group (only visible in character mode)
    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1b2028,
      roughness: 0.42,
      metalness: 0.75,
    });
    const baseDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.04, 0.14, 36), baseMat);
    baseDeck.position.y = -0.07;
    baseDeck.receiveShadow = !isSoftwareGl;
    stageGroup.add(baseDeck);

    const topPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.84, 0.88, 0.03, 36),
      new THREE.MeshStandardMaterial({ color: 0x262d36, roughness: 0.55, metalness: 0.55 })
    );
    topPlate.position.y = 0.005;
    topPlate.receiveShadow = !isSoftwareGl;
    stageGroup.add(topPlate);

    const accentRingMat = new THREE.MeshBasicMaterial({
      color: 0xf5b841,
      transparent: true,
      opacity: 0.85,
    });
    const accentRing = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.015, 8, 48), accentRingMat);
    accentRing.rotation.x = Math.PI / 2;
    accentRing.position.y = 0.012;
    stageGroup.add(accentRing);

    // Architectural hangar backdrop columns for dramatic silhouette depth
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x171b21,
      roughness: 0.75,
      metalness: 0.35,
    });
    [-1.65, 1.65].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.6, 0.42), colMat);
      col.position.set(cx, 1.65, -2.1);
      stageGroup.add(col);
    });

    // Subtle floating dust particles around the operative
    const dustCount = isSoftwareGl ? 18 : 38;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 2.6;
      dustPos[i * 3 + 1] = 0.1 + Math.random() * 2.1;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xf7dcb2,
        size: 0.032,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    stageGroup.add(dustPoints);

    const subjectGroup = new THREE.Group();
    scene.add(subjectGroup);
    subjectGroupRef.current = subjectGroup;

    let currentKey = '';
    const syncSubject = () => {
      const { mode: m, classId: cId, weaponId: wId } = propsRef.current;
      const nextKey = `${m}:${cId}:${wId}`;
      if (nextKey === currentKey) return;
      currentKey = nextKey;

      while (subjectGroup.children.length > 0) {
        subjectGroup.remove(subjectGroup.children[0]);
      }
      rigRef.current = null;

      if (m === 'character') {
        stageGroup.visible = true;
        const isTerrorist = cId.endsWith('_t');
        accentRingMat.color.setHex(isTerrorist ? 0xf0a854 : 0x62a8ff);
        rimLight.color.setHex(isTerrorist ? 0xffb366 : 0x6db4f7);
        underFill.color.setHex(isTerrorist ? 0xf59536 : 0x4b8fe8);

        const rig = buildCharacterRig(cId, undefined, !isSoftwareGl);
        rigRef.current = rig;
        rig.root.position.y = 0.02;
        subjectGroup.add(rig.root);

        // Smooth transition cue when switching operative models
        interactRef.current.switchAnim = 0.0;
        interactRef.current.yawVelocity += 1.8;
        if (interactRef.current.targetZoom < 2.2) {
          interactRef.current.targetZoom = 3.35;
          interactRef.current.currentZoom = 3.35;
        }
      } else {
        stageGroup.visible = false;
        const wModel = buildWeaponModel(wId, wId === 'm4a1' || wId === 'usp');
        wModel.rotation.y = Math.PI * 0.42;
        wModel.scale.setScalar(1.9);
        subjectGroup.add(wModel);
        interactRef.current.targetZoom = 1.45;
        interactRef.current.currentZoom = 1.45;
      }
    };

    syncSubject();

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    const start = lastTime;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      syncSubject();

      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const t = (now - start) / 1000;
      const st = interactRef.current;

      // Damped angular inertia + gentle showcase turntable spin when idle
      if (!st.dragging) {
        st.yawOffset += st.yawVelocity * dt;
        st.yawVelocity = THREE.MathUtils.damp(st.yawVelocity, 0, 5.5, dt);
        if (t - st.userInteractedAt > 2.8) {
          st.yawOffset += dt * 0.24;
        }
      }

      // Smooth zoom & model switch entrance scale
      st.currentZoom = THREE.MathUtils.damp(st.currentZoom, st.targetZoom, 9, dt);
      st.switchAnim = THREE.MathUtils.damp(st.switchAnim, 1.0, 10, dt);

      if (propsRef.current.mode === 'character' && rigRef.current) {
        const s = 0.88 + 0.12 * st.switchAnim;
        rigRef.current.root.scale.setScalar(s);
        rigRef.current.root.rotation.y = st.yawOffset;
        stageGroup.rotation.y = st.yawOffset * 0.25;
        animateCharacterPose(rigRef.current, t, 0, false, 0, false, 0);

        // Shift lookAt slightly upward toward face/chest as player zooms in closely
        const zoomRatio = THREE.MathUtils.clamp((3.35 - st.currentZoom) / (3.35 - 1.65), 0, 1);
        const lookY = THREE.MathUtils.lerp(0.92, 1.38, zoomRatio);
        const camY = THREE.MathUtils.lerp(1.12, 1.46, zoomRatio);
        camera.position.set(0.18 * (1 - zoomRatio * 0.6), camY, st.currentZoom);
        camera.lookAt(0, lookY, 0);
      } else if (subjectGroup.children[0]) {
        subjectGroup.children[0].rotation.y = Math.PI * 0.42 + st.yawOffset;
        camera.position.set(0, 0.24, st.currentZoom);
        camera.lookAt(0, 0, 0);
      }

      // Float dust particles gently
      const dAttr = dustGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = dAttr.array as Float32Array;
      for (let i = 0; i < dustCount; i++) {
        arr[i * 3 + 1] += dt * 0.08;
        if (arr[i * 3 + 1] > 2.2) arr[i * 3 + 1] = 0.12;
      }
      dAttr.needsUpdate = true;

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 280;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    interactRef.current.dragging = true;
    interactRef.current.lastX = e.clientX;
    interactRef.current.dragDist = 0;
    interactRef.current.userInteractedAt = performance.now() / 1000;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = interactRef.current;
    if (!interactive || !st.dragging) return;
    const dx = e.clientX - st.lastX;
    st.lastX = e.clientX;
    st.dragDist += Math.abs(dx);
    st.yawOffset += dx * 0.012;
    st.yawVelocity = dx * 0.16;
    st.userInteractedAt = performance.now() / 1000;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const wasDrag = interactRef.current.dragDist > 5;
    interactRef.current.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (wasDrag) {
      e.stopPropagation();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactRef.current.dragDist > 5) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!interactive) return;
    e.stopPropagation();
    adjustZoom(e.deltaY > 0 ? 0.28 : -0.28);
  };

  return (
    <div
      className={`relative w-full h-full select-none ${interactive ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      <div ref={mountRef} className="w-full h-full" />

      {interactive && (
        <div
          className="absolute bottom-2 right-2 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
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
