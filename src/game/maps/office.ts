import * as THREE from 'three';
import {
  addArchway,
  addCrate,
  addDoorwayWall,
  addFluorescentTube,
  addGroundAndHorizon,
  addOfficeWorkstation,
  addPineTree,
  addSandbagBarricade,
  addSiteDecal,
  addSkyDome,
  addSolidBox,
  addStreetLamp,
  addTerracottaPot,
  addTrimWall,
  addVehicle,
  addWindowShutter,
  BuiltMap,
  linkWaypoints,
  MapBuildContext,
  MapCalloutPin,
  WaypointNode,
} from './shared';

/**
 * Full-scale recreation of CS 1.6 cs_office (~110m x 112m playable footprint):
 * Snowy Exterior CT Courtyard & Garage -> Main Front Lobby -> Paper / Side Hall,
 * Central Cubicle Complex, Conference Room, Long Hall, Lounge, and T-Side Projector Room.
 */
export function buildOfficeFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x86a6c4, 0xd8e5f0, 0xf2f7fc);
  addGroundAndHorizon(ctx, 110, 112, 'office_floor', 0x8c97a3, 'concrete', 0xc9d4de, 8.6, 'snow');

  // =========================================================================
  // 1. SNOWY EXTERIOR CT COURTYARD & LOADING GARAGE (South: Z +22..+54)
  // =========================================================================
  addSolidBox(ctx, 0, 0.01, 38, 108, 0.08, 34, 'snow', 0xedf4fa, 0.9, 0.02, 16, 5, false);
  addPineTree(ctx, -38, 0, 42, 1.2);
  addPineTree(ctx, 38, 0, 42, 1.15);
  addPineTree(ctx, -28, 0, 30, 1.0);
  addPineTree(ctx, 32, 0, 29, 1.05);
  addVehicle(ctx, 18, 0, 35, 0x26384d, false); // SWAT Armored Response Truck
  addSandbagBarricade(ctx, -10, 0, 29, 4, 2, true, 0x6f7b87);
  addStreetLamp(ctx, -22, 0, 38, 0xe8f2ff);
  addStreetLamp(ctx, 24, 0, 38, 0xe8f2ff);

  // Exterior Concrete Perimeter & Front Building Facade (Z = +20)
  // 3 Entrances into the Office Complex: Side Garage (-36), Front Main Lobby (0), Long Hall (+34)
  addDoorwayWall(ctx, -36, 0, 20, 32, 7.2, 5.8, 4.0, 1.8, 'concrete', 0xb8c0c8, false, 0);
  addArchway(ctx, 0, 0, 20, 40, 8.2, 5.8, 4.0, 1.8, 'concrete', 0xc0c8d0);
  addDoorwayWall(ctx, 34, 0, 20, 32, 5.4, 5.8, 4.0, 1.8, 'concrete', 0xb8c0c8, false, 0);
  addWindowShutter(ctx, -12, 3.8, 21.0, false, 0x394b5e);
  addWindowShutter(ctx, 12, 3.8, 21.0, false, 0x394b5e);

  // =========================================================================
  // 2. CORPORATE COMPLEX CARPETED INTERIOR FLOOR & CEILING LIGHTING
  // =========================================================================
  addSolidBox(ctx, 0, 0.01, -16, 104, 0.04, 72, 'carpet_office', 0x526478, 0.92, 0.02, 22, 16, false);
  // Roof trusses & fluorescent office grid (open sightlines high enough for clean readability)
  [
    [-34, 6],
    [0, 6],
    [34, 6],
    [-34, -14],
    [0, -14],
    [34, -14],
    [-28, -36],
    [4, -36],
    [34, -36],
  ].forEach(([lx, lz]) => {
    addFluorescentTube(ctx, lx, 5.4, lz, false);
  });

  // =========================================================================
  // 3. GARAGE / PAPER STORAGE & SIDE HALL (West: X -52..-22, Z -20..+20)
  // =========================================================================
  addDoorwayWall(ctx, -22, 0, 0, 40, 4.8, 5.4, 3.6, 1.4, 'concrete', 0xa6b0ba, true, -6);
  addCrate(ctx, -38, 0, 8, 1.8, 1.7, 0xffffff, 'crate_military');
  addCrate(ctx, -30, 0, -8, 1.7, 1.5, 0x7b8691);
  addOfficeWorkstation(ctx, -44, 0, -2, Math.PI / 2);

  // =========================================================================
  // 4. CENTRAL CUBICLE HALL & FRONT LOBBY (X -22..+22, Z -20..+20)
  // =========================================================================
  // Cubicle Partition Maze + 6 Detailed Workstations
  addSolidBox(ctx, -8, 0, 4, 1.0, 2.2, 16, 'concrete', 0x9aa4ad);
  addSolidBox(ctx, 8, 0, 4, 1.0, 2.2, 16, 'concrete', 0x9aa4ad);
  addSolidBox(ctx, 0, 0, -8, 12, 2.2, 1.0, 'concrete', 0x9aa4ad);
  addOfficeWorkstation(ctx, -14, 0, 10, 0);
  addOfficeWorkstation(ctx, 14, 0, 10, 0);
  addOfficeWorkstation(ctx, -14, 0, -2, Math.PI);
  addOfficeWorkstation(ctx, 14, 0, -2, Math.PI);
  addOfficeWorkstation(ctx, 0, 0, -14, 0);
  addTerracottaPot(ctx, -6, 0, 17, 1.2);
  addTerracottaPot(ctx, 6, 0, 17, 1.2);

  // =========================================================================
  // 5. LONG HALL EAST CORRIDOR (X +22..+52, Z -46..+20)
  // =========================================================================
  addDoorwayWall(ctx, 22, 0, 2, 36, 4.8, 5.4, 3.6, 1.4, 'concrete', 0xa6b0ba, true, 8);
  addDoorwayWall(ctx, 22, 0, -32, 32, 5.0, 5.4, 3.6, 1.4, 'concrete', 0xa6b0ba, true, -6);
  addCrate(ctx, 36, 0, 2, 1.7, 1.6, 0x7b8691);
  addCrate(ctx, 42, 0, -18, 1.8, 1.7, 0xffffff, 'crate_military');
  addTerracottaPot(ctx, 48, 0, -6, 1.25);
  addTerracottaPot(ctx, 48, 0, -32, 1.25);

  // =========================================================================
  // 6. NORTH WING: CONFERENCE ROOM (WEST) & PROJECTOR / T SPAWN (CENTER-NORTH)
  // =========================================================================
  // Wall dividing Central Hall from North Rooms (Z = -20) with wide Connector doorways
  addDoorwayWall(ctx, -36, 0, -20, 28, 4.8, 5.4, 3.6, 1.4, 'concrete', 0xa6b0ba, false, 0);
  addDoorwayWall(ctx, 0, 0, -20, 44, 6.0, 5.4, 3.6, 1.4, 'concrete', 0xa6b0ba, false, 0);

  // Conference Room Table (X: -36, Z: -36)
  addSolidBox(ctx, -36, 0, -36, 6.4, 0.85, 3.0, 'wood_plank', 0x6e4a2e, 0.65, 0.08, 2, 1);
  addSiteDecal(ctx, -36, 0, -28, 'B'); // Secondary Hostage / Rescue Zone

  // Projector & Executive T-Spawn Hall (X: -12..+18, Z: -50..-24)
  addOfficeWorkstation(ctx, 10, 0, -36, -Math.PI / 2);
  addOfficeWorkstation(ctx, -10, 0, -40, Math.PI / 2);
  addTrimWall(ctx, 0, 0, -52, 106, 6.2, 2.2, 'concrete', 0xaab4be);
  addSiteDecal(ctx, 4, 0, -36, 'A'); // Primary Hostage / Rescue Zone

  const waypoints: WaypointNode[] = [
    { id: 'ct_spawn', x: 0, y: 0, z: 44, neighbors: [], tag: 'CT' },
    { id: 'courtyard_w', x: -34, y: 0, z: 32, neighbors: [] },
    { id: 'courtyard_e', x: 34, y: 0, z: 32, neighbors: [] },
    { id: 'front_lobby', x: 0, y: 0, z: 14, neighbors: [] },
    { id: 'paper_garage', x: -36, y: 0, z: 4, neighbors: [] },
    { id: 'cubicles', x: 0, y: 0, z: -2, neighbors: [], tag: 'MID' },
    { id: 'long_hall_s', x: 36, y: 0, z: 4, neighbors: [] },
    { id: 'long_hall_n', x: 36, y: 0, z: -36, neighbors: [] },
    { id: 'conference', x: -36, y: 0, z: -28, neighbors: [], tag: 'B' },
    { id: 'projector', x: 4, y: 0, z: -36, neighbors: [], tag: 'A' },
    { id: 't_spawn', x: 0, y: 0, z: -44, neighbors: [], tag: 'T' },
  ];
  [
    ['ct_spawn', 'front_lobby'],
    ['ct_spawn', 'courtyard_w'],
    ['ct_spawn', 'courtyard_e'],
    ['courtyard_w', 'paper_garage'],
    ['courtyard_e', 'long_hall_s'],
    ['front_lobby', 'cubicles'],
    ['paper_garage', 'cubicles'],
    ['paper_garage', 'conference'],
    ['cubicles', 'long_hall_s'],
    ['cubicles', 'projector'],
    ['long_hall_s', 'long_hall_n'],
    ['long_hall_n', 'projector'],
    ['conference', 't_spawn'],
    ['projector', 't_spawn'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'CT Courtyard', x: 0, y: 1.5, z: 44, zone: 'CT' },
    { name: 'Main Lobby', x: 0, y: 1.5, z: 14, zone: 'CT' },
    { name: 'Garage / Paper', x: -36, y: 1.5, z: 4, zone: 'MID' },
    { name: 'Cubicle Hall', x: 0, y: 1.5, z: -2, zone: 'MID' },
    { name: 'Long Hall', x: 36, y: 1.5, z: -14, zone: 'MID' },
    { name: 'Conference Room', x: -36, y: 1.5, z: -36, zone: 'B' },
    { name: 'Projector Room', x: 4, y: 1.5, z: -36, zone: 'A' },
    { name: 'T Spawn', x: 0, y: 1.5, z: -45, zone: 'T' },
  ];

  return {
    id: 'cs_office',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-6, 0, -45),
      new THREE.Vector3(0, 0, -45),
      new THREE.Vector3(6, 0, -45),
      new THREE.Vector3(-3, 0, -42),
      new THREE.Vector3(3, 0, -42),
    ],
    ctSpawns: [
      new THREE.Vector3(-6, 0, 45),
      new THREE.Vector3(0, 0, 45),
      new THREE.Vector3(6, 0, 45),
      new THREE.Vector3(-3, 0, 42),
      new THREE.Vector3(3, 0, 42),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 0, 44),
      new THREE.Vector3(0, 0, -44),
      new THREE.Vector3(-36, 0, -28),
      new THREE.Vector3(4, 0, -36),
      new THREE.Vector3(36, 0, -10),
      new THREE.Vector3(0, 0, -2),
    ],
    bombsites: [
      { label: 'A', x: 4, y: 0, z: -36, radius: 6.4 },
      { label: 'B', x: -36, y: 0, z: -28, radius: 6.4 },
    ],
    buyZones: [
      { team: 'T', x: 0, z: -44, radius: 11 },
      { team: 'CT', x: 0, z: 44, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0xbfd1e0,
    fogColor: 0xd0deeb,
    fogDensity: 0.006,
    sunColor: 0xf4f8ff,
    sunIntensity: 1.7,
    sunPos: new THREE.Vector3(40, 62, 48),
    hemiSky: 0xd9e8f5,
    hemiGround: 0x626b75,
    hemiIntensity: 0.82,
    surfaceType: 'concrete',
    bounds: { minX: -54, maxX: 54, minZ: -55, maxZ: 55 },
    ambientParticleMode: 'snow',
    menuShowcase: {
      camCenter: new THREE.Vector3(-4, 4.6, 30),
      camOrbitRadius: 16,
      camHeight: 5.0,
      lookAt: new THREE.Vector3(0, 1.5, 20),
      smokePos: new THREE.Vector3(0, 0.2, 22),
      tSpots: [
        { pos: [-3, 0, 14], yaw: 3.1, cls: 'urban_t', w: 'ak47', crouch: false },
        { pos: [3, 0, 15], yaw: 3.0, cls: 'classic_t', w: 'p90', crouch: true },
        { pos: [0, 0, 12], yaw: 3.14, cls: 'military_t', w: 'awp', crouch: false },
      ],
      ctSpots: [
        { pos: [-5, 0, 29], yaw: 0, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [6, 0, 31], yaw: -0.2, cls: 'specops_ct', w: 'mp5', crouch: false },
        { pos: [11, 0, 28], yaw: -0.35, cls: 'assault_ct', w: 'aug', crouch: true },
      ],
    },
  };
}
