import * as THREE from 'three';
import { textures } from '../ProceduralTextures';
import {
  addArchedBlindWindow,
  addArchway,
  addCrate,
  addDoorwayWall,
  addFloorDeck,
  addFluorescentTube,
  addFreightTrainCar,
  addGroundAndHorizon,
  addIndustrialPipeRun,
  addOilBarrel,
  addPlaneDecal,
  addRedWallLadder,
  addSafetyBollard,
  addSafetyRail,
  addSandbagBarricade,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addStreetLamp,
  addTrimWall,
  addTunnelLantern,
  addVehicle,
  addWindowShutter,
  BuiltMap,
  linkWaypoints,
  MapBuildContext,
  MapCalloutPin,
  WaypointNode,
} from './shared';

/**
 * Full-scale recreation of CS 1.6 de_train (~116m x 116m playable footprint):
 * T Spawn & Trainyard B Bays 4-5-6 -> T-Main & Popdog Drop Room -> Outer Yard A
 * with 5 freight boxcars, Heaven Sniper Balcony, Z-Connector, Ivy Corridor,
 * Upper/Lower B Train Hall, and CT Spawn.
 */
export function buildTrainFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x465b70, 0x99a8b5, 0xd4dee5);
  addGroundAndHorizon(ctx, 116, 116, 'gravel_track', 0x98958f, 'brick_yellow', 0xd6cdb8, 8.6, 'urban');

  // =========================================================================
  // 1. STEEL RAILWAY TRACKS & TIMBER SLEEPERS (Yard A & Yard B)
  // =========================================================================
  const railMat = getTrackMat(ctx);
  const sleeperMat = getSleeperMat(ctx);
  // Yard A tracks (Z = -34, -22, -10) and Yard B tracks (Z = +20, +32)
  [-34.8, -33.2, -22.8, -21.2, -10.8, -9.2, 19.2, 20.8, 31.2, 32.8].forEach((rz) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(68, 0.09, 0.14), railMat);
    rail.position.set(2, 0.05, rz);
    ctx.group.add(rail);
  });
  [-34, -22, -10, 20, 32].forEach((trackZ) => {
    for (let tx = -28; tx <= 32; tx += 1.65) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 2.2), sleeperMat);
      tie.position.set(tx, 0.025, trackZ);
      ctx.group.add(tie);
    }
  });
  addIndustrialPipeRun(ctx, 2, 6.2, -22, 64, true, 0x3b4047, 0.14);
  addIndustrialPipeRun(ctx, 2, 6.2, 26, 60, true, 0x3b4047, 0.14);

  // =========================================================================
  // 2. T SPAWN YARD & TRAINYARD B BAYS 4 · 5 · 6 (South-West: X -54..-22, Z +28..+54)
  // =========================================================================
  addTrimWall(ctx, -56, 0, 22, 2.2, 6.6, 56, 'brick', 0xa66e58);
  [
    { z: 16, num: '4' },
    { z: 24, num: '5' },
    { z: 32, num: '6' },
  ].forEach((bay) => {
    addSolidBox(ctx, -54.2, 0, bay.z, 1.4, 4.4, 4.8, 'concrete', 0x16181c, 0.92, 0.05, 1, 1, false);
    addPlaneDecal(ctx, -53.3, 4.9, bay.z, 1.6, 1.2, textures.createTrainSignTexture(bay.num, '#1f4978', '#f4f7fa'), Math.PI / 2);
    addTunnelLantern(ctx, -52.8, 4.5, bay.z);
  });
  addPlaneDecal(ctx, -54.6, 5.2, 24, 5.2, 1.5, textures.createTrainSignTexture('Trainyard B', '#1f4978', '#f4f7fa'), Math.PI / 2);

  addCrate(ctx, -40, 0, 44, 1.8, 1.7, 0xffffff, 'crate_military');
  addOilBarrel(ctx, -34, 0, 46, 0x3b593d);
  addSandbagBarricade(ctx, -44, 0, 36, 4, 2, true);
  addStreetLamp(ctx, -48, 0, 42, 0xffd28a);

  // =========================================================================
  // 3. T-MAIN CORRIDOR & POPDOG DROP ROOM (West-Center: X -36..-2, Z -10..+24)
  // =========================================================================
  // Partition dividing T-Main from Yard A
  addDoorwayWall(ctx, -30, 0, -2, 28, 5.6, 6.4, 4.4, 2.2, 'brick', 0x8a6d62, false, -2);
  // Wall dividing T-Main (X<-22) from Popdog (-16..-4)
  addDoorwayWall(ctx, -22, 0, 10, 24, 4.8, 6.4, 4.2, 2.0, 'brick', 0x7d655b, true, 4);
  // Popdog Drop Room (enclosed industrial hall with elevated entry deck y=2.2 & ramp down to B/A)
  addFloorDeck(ctx, -18, -6, 4, 13, 2.2, 'metal', 0x4f5861, 0);
  addSlopeRamp(ctx, -18, 2.2, 8.5, -24, 0.0, 8.5, 4.8, 'metal', 0x56606b, 0, false);
  addSlopeRamp(ctx, -6, 2.2, 8.5, 0, 0.0, 8.5, 4.8, 'metal', 0x56606b, 0, false);
  addDoorwayWall(ctx, -12, 0, -4, 18, 4.6, 6.4, 4.2, 2.0, 'brick', 0x736058, false, 0);
  addDoorwayWall(ctx, -12, 0, 14, 18, 4.6, 6.4, 4.2, 2.0, 'brick', 0x736058, false, 0);
  addSolidBox(ctx, -12, 5.8, 5, 18, 0.7, 18, 'concrete', 0x4c5259, 0.88, 0.08, 4, 4);
  addFluorescentTube(ctx, -12, 5.35, 5, true);
  addRedWallLadder(ctx, -16.8, 0, 5, 3.8, 'x+');
  addPlaneDecal(ctx, -12, 4.6, -2.85, 3.4, 1.1, textures.createTrainSignTexture('POPDOG', '#24292e', '#f5b841'), 0);

  // =========================================================================
  // 4. BOMBSITE A MAIN TRAIN YARD (X -26..+36, Z -46..-6)
  // =========================================================================
  // Outer North Yard Wall
  addTrimWall(ctx, 2, 0, -52, 76, 6.8, 2.4, 'brick_yellow', 0xe2d9c4);
  addArchedBlindWindow(ctx, -18, 4.4, -50.6, false, 2.4, 2.0);
  addArchedBlindWindow(ctx, 2, 4.4, -50.6, false, 2.4, 2.0);
  addArchedBlindWindow(ctx, 22, 4.4, -50.6, false, 2.4, 2.0);

  // 5 Iconic Freight Boxcars on Yard A tracks
  addFreightTrainCar(ctx, -12, 0, -22, 0x8f3932);
  addFreightTrainCar(ctx, 8, 0, -22, 0x3f5e4b);
  addFreightTrainCar(ctx, -4, 0, -34, 0x3b5370);
  addFreightTrainCar(ctx, 18, 0, -34, 0x7d4c32);
  addFreightTrainCar(ctx, -14, 0, -10, 0x3b5370);

  // Switchgear & Bomb Train Cover
  addSolidBox(ctx, -24, 0, -28, 1.8, 2.2, 1.2, 'metal', 0x3c694b, 0.55, 0.35);
  addPlaneDecal(ctx, -24, 1.4, -27.3, 0.7, 0.7, textures.createTrainSignTexture('440V', '#d9a426', '#16181c'), 0);
  addCrate(ctx, 0, 0, -16, 1.8, 1.6, 0xffffff, 'crate_military');
  addCrate(ctx, 11, 0, -28, 1.7, 1.6);
  addOilBarrel(ctx, -2, 0, -28, 0x3b593d);
  addOilBarrel(ctx, 19, 0, -16, 0x8f3932);
  addSiteDecal(ctx, 2, 0, -26, 'A');

  // Heaven Sniper Balcony (North-East overlooking Yard A: y=3.4)
  addFloorDeck(ctx, 28, 40, -50, -38, 3.4, 'concrete', 0x767d85, 0);
  addSlopeRamp(ctx, 40, 3.4, -44, 48, 0.0, -44, 5.2, 'metal', 0x616870, 0, false);
  addSafetyRail(ctx, 28.2, 3.4, -44, 11, false);
  addSafetyRail(ctx, 34, 3.4, -38.2, 11, true);
  addCrate(ctx, 36, 3.4, -47, 1.5, 1.3, 0xffffff, 'crate_military');

  // =========================================================================
  // 5. Z-CONNECTOR & IVY CORRIDOR (Center & East)
  // =========================================================================
  // Z-Connector concrete tunnel linking Yard A (Z=-6) to Yard B (Z=+14)
  addDoorwayWall(ctx, 10, 0, 4, 22, 5.2, 6.4, 4.2, 2.2, 'concrete', 0x7f868f, true, 0);
  addDoorwayWall(ctx, 24, 0, 4, 22, 5.2, 6.4, 4.2, 2.2, 'concrete', 0x7f868f, true, 0);
  addSolidBox(ctx, 17, 5.8, 4, 16, 0.7, 18, 'concrete', 0x5c636b, 0.88, 0.08, 4, 4);
  addFluorescentTube(ctx, 17, 5.3, 4, true);

  // Ivy Alley (East flank: X +34..+54, Z -36..+24)
  addTrimWall(ctx, 55, 0, -4, 2.4, 6.8, 66, 'brick_yellow', 0xe2d9c4);
  [-24, -10, 4, 18].forEach((wz) => addArchedBlindWindow(ctx, 53.6, 4.3, wz, true, 2.2, 2.0));
  addArchway(ctx, 44, 0, -14, 22, 6.2, 6.4, 4.4, 2.2, 'brick', 0x997362);
  addCrate(ctx, 42, 0, -2, 1.8, 1.6, 0xffffff, 'crate_military');
  addSandbagBarricade(ctx, 46, 0, -24, 3, 2, true);
  addStreetLamp(ctx, 44, 0, 8, 0xffd28a);

  // =========================================================================
  // 6. BOMBSITE B UPPER CATWALK & LOWER TRAIN HALL (Z +14..+46)
  // =========================================================================
  // Upper B Catwalk Deck on West side (y=2.4) + wide ramp down to Lower B
  addFloorDeck(ctx, -36, -18, 16, 44, 2.4, 'concrete', 0x7d848c, 0);
  addSlopeRamp(ctx, -18, 2.4, 26, -8, 0.0, 26, 6.4, 'metal', 0x626a73, 0, false);
  addSlopeRamp(ctx, -36, 2.4, 38, -44, 0.0, 38, 6.4, 'concrete', 0x7d848c, 0, false);
  addSafetyRail(ctx, -18.2, 2.4, 36, 12, false);
  addSafetyRail(ctx, -18.2, 2.4, 19, 6, false);

  // B Train Hall Boxcars (Z = +20, +32)
  addFreightTrainCar(ctx, 4, 0, 20, 0x8f6b32);
  addFreightTrainCar(ctx, 18, 0, 32, 0x3f5e4b);
  addFreightTrainCar(ctx, -4, 0, 32, 0x3b5370);
  addCrate(ctx, 12, 0, 25, 1.8, 1.7);
  addSandbagBarricade(ctx, 22, 0, 20, 3, 2, false);
  addOilBarrel(ctx, -10, 0, 22, 0x3b593d);
  addSiteDecal(ctx, 6, 0, 26, 'B');

  // South Yard Boundary + Archways from Z-Connector/Ivy into B
  addTrimWall(ctx, 6, 0, 52, 68, 6.4, 2.4, 'brick', 0x8a6d62);
  addWindowShutter(ctx, -4, 4.0, 50.6, false, 0x3c434a);
  addWindowShutter(ctx, 18, 4.0, 50.6, false, 0x3c434a);

  // =========================================================================
  // 7. CT SPAWN DEPOT COURTYARD (North-East: X +34..+52, Z -50..-28)
  // =========================================================================
  addVehicle(ctx, 44, 0, -30, 0x3c4c5c, true);
  addCrate(ctx, 40, 0, -45, 1.8, 1.7, 0xffffff, 'crate_military');
  addSafetyBollard(ctx, 32, 0, -28);
  addSafetyBollard(ctx, 32, 0, -14);
  addStreetLamp(ctx, 46, 0, -40, 0xd8e8ff);

  // Waypoint graph
  const waypoints: WaypointNode[] = [
    { id: 't_spawn', x: -42, y: 0, z: 44, neighbors: [], tag: 'T' },
    { id: 't_main', x: -30, y: 0, z: 12, neighbors: [] },
    { id: 't_main_exit', x: -30, y: 0, z: -8, neighbors: [] },
    { id: 'popdog_top', x: -12, y: 2.2, z: 8, neighbors: [] },
    { id: 'popdog_exit', x: 0, y: 0, z: -8, neighbors: [] },
    { id: 'a_west', x: -12, y: 0, z: -28, neighbors: [] },
    { id: 'a_site', x: 2, y: 0, z: -26, neighbors: [], tag: 'A' },
    { id: 'a_east', x: 22, y: 0, z: -24, neighbors: [] },
    { id: 'heaven', x: 34, y: 3.4, z: -44, neighbors: [] },
    { id: 'ct_spawn', x: 46, y: 0, z: -42, neighbors: [], tag: 'CT' },
    { id: 'ivy', x: 44, y: 0, z: -12, neighbors: [] },
    { id: 'z_conn', x: 17, y: 0, z: 4, neighbors: [], tag: 'MID' },
    { id: 'b_upper', x: -28, y: 2.4, z: 28, neighbors: [] },
    { id: 'b_site', x: 6, y: 0, z: 26, neighbors: [], tag: 'B' },
    { id: 'b_east', x: 28, y: 0, z: 24, neighbors: [] },
  ];
  [
    ['t_spawn', 't_main'],
    ['t_main', 't_main_exit'],
    ['t_main_exit', 'a_west'],
    ['a_west', 'a_site'],
    ['a_site', 'a_east'],
    ['a_east', 'ct_spawn'],
    ['ct_spawn', 'heaven'],
    ['ct_spawn', 'ivy'],
    ['ivy', 'a_east'],
    ['ivy', 'b_east'],
    ['t_main', 'popdog_top'],
    ['popdog_top', 'popdog_exit'],
    ['popdog_exit', 'a_site'],
    ['a_site', 'z_conn'],
    ['z_conn', 'b_site'],
    ['t_spawn', 'b_upper'],
    ['b_upper', 'b_site'],
    ['b_site', 'b_east'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'T Spawn', x: -42, y: 1.5, z: 44, zone: 'T' },
    { name: 'T Main', x: -30, y: 1.5, z: 4, zone: 'T' },
    { name: 'Popdog Drop', x: -12, y: 3.0, z: 8, zone: 'MID' },
    { name: 'Bombsite A', x: 2, y: 1.5, z: -26, zone: 'A' },
    { name: 'Heaven', x: 34, y: 4.5, z: -44, zone: 'A' },
    { name: 'Ivy', x: 44, y: 1.5, z: -12, zone: 'CT' },
    { name: 'Z-Connector', x: 17, y: 1.5, z: 4, zone: 'MID' },
    { name: 'Upper B', x: -28, y: 3.5, z: 28, zone: 'B' },
    { name: 'Bombsite B', x: 6, y: 1.5, z: 26, zone: 'B' },
    { name: 'CT Spawn', x: 46, y: 1.5, z: -42, zone: 'CT' },
  ];

  return {
    id: 'de_train',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-44, 0, 44),
      new THREE.Vector3(-40, 0, 46),
      new THREE.Vector3(-37, 0, 42),
      new THREE.Vector3(-46, 0, 40),
      new THREE.Vector3(-42, 0, 48),
    ],
    ctSpawns: [
      new THREE.Vector3(49, 0, -47),
      new THREE.Vector3(51, 0, -43),
      new THREE.Vector3(48, 0, -39),
      new THREE.Vector3(50, 0, -35),
      new THREE.Vector3(44, 0, -35),
    ],
    dmSpawns: [
      new THREE.Vector3(-42, 0, 44),
      new THREE.Vector3(2, 0, -26),
      new THREE.Vector3(6, 0, 26),
      new THREE.Vector3(44, 0, -12),
      new THREE.Vector3(-28, 2.4, 28),
      new THREE.Vector3(49, 0, -41),
    ],
    bombsites: [
      { label: 'A', x: 2, y: 0, z: -26, radius: 6.8 },
      { label: 'B', x: 6, y: 0, z: 26, radius: 6.8 },
    ],
    buyZones: [
      { team: 'T', x: -42, z: 44, radius: 11 },
      { team: 'CT', x: 46, z: -43, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0x6f7d87,
    fogColor: 0x7e8a94,
    fogDensity: 0.0065,
    sunColor: 0xe3e9f0,
    sunIntensity: 1.75,
    sunPos: new THREE.Vector3(-42, 66, -34),
    hemiSky: 0x8ea0ad,
    hemiGround: 0x4a4d50,
    hemiIntensity: 0.78,
    surfaceType: 'concrete',
    bounds: { minX: -57, maxX: 57, minZ: -57, maxZ: 57 },
    ambientParticleMode: 'dust',
    menuShowcase: {
      camCenter: new THREE.Vector3(2, 5.2, -24),
      camOrbitRadius: 17,
      camHeight: 5.5,
      lookAt: new THREE.Vector3(2, 1.5, -24),
      smokePos: new THREE.Vector3(1, 0.2, -24),
      tSpots: [
        { pos: [-12, 0, -16], yaw: 0.2, cls: 'classic_t', w: 'ak47', crouch: false },
        { pos: [-5, 0, -18], yaw: 0.1, cls: 'urban_t', w: 'galil', crouch: true },
        { pos: [3, 0, -15], yaw: -0.1, cls: 'military_t', w: 'm249', crouch: false },
      ],
      ctSpots: [
        { pos: [6, 0, -30], yaw: 3.1, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [-1, 0, -31], yaw: 3.0, cls: 'specops_ct', w: 'awp', crouch: false },
        { pos: [13, 0, -29], yaw: 3.3, cls: 'urban_ct', w: 'mp5', crouch: true },
      ],
    },
  };
}

function getTrackMat(ctx: MapBuildContext): THREE.MeshStandardMaterial {
  const key = 'train_rail_steel';
  const found = ctx.materials.get(key);
  if (found) return found;
  const mat = new THREE.MeshStandardMaterial({ color: 0x3b4047, roughness: 0.38, metalness: 0.82 });
  ctx.materials.set(key, mat);
  return mat;
}

function getSleeperMat(ctx: MapBuildContext): THREE.MeshStandardMaterial {
  const key = 'train_sleeper_wood';
  const found = ctx.materials.get(key);
  if (found) return found;
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a382b, roughness: 0.9, metalness: 0.04 });
  ctx.materials.set(key, mat);
  return mat;
}
