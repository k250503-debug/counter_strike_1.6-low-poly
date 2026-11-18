import * as THREE from 'three';
import {
  addArchedBlindWindow,
  addArchway,
  addCafeBistroSet,
  addCrate,
  addDoorwayWall,
  addFloorDeck,
  addFluorescentTube,
  addGroundAndHorizon,
  addMarketAwning,
  addPalmTree,
  addSafetyRail,
  addSandbagBarricade,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addTerracottaPot,
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
 * Full-scale recreation of CS 1.6 de_mirage / de_cpl_strike (~116m x 120m playable footprint):
 * T-Spawn Courtyard -> A Ramp & Elevated Palace Interior (y=3.4) -> Bombsite A (y=0.8),
 * Top Mid & Mid Boxes -> Underpass Tunnel (y=0.0) -> CT Sniper Window (y=2.4) & Connector ->
 * Elevated B Apartments (y=2.8) -> Bombsite B (y=0.8) & Market/Kitchen -> CT Spawn (y=0.8).
 */
export function buildMirageFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x457bc0, 0xeddcc0, 0xfff8ed);
  addGroundAndHorizon(ctx, 116, 120, 'sand', 0xe2c79a, 'sandstone', 0xd6bc90, 8.8, 'desert');

  // =========================================================================
  // 1. T-SPAWN COURTYARD & TOP MID (South: Z +28..+56, y=2.0)
  // =========================================================================
  addFloorDeck(ctx, -56, 56, 28, 58, 2.0, 'dust_stone_floor', 0xdcc49c, 0);
  addArchway(ctx, 0, 2.0, 34, 48, 8.4, 5.8, 4.2, 2.2, 'sandstone', 0xd9c29c);
  addMarketAwning(ctx, -16, 5.6, 48, 6.8, 3.4, 0xb8523b, false, true);
  addMarketAwning(ctx, 16, 5.6, 48, 6.8, 3.4, 0x4f7354, false, true);
  addPalmTree(ctx, -24, 2.0, 48, 6.8);
  addPalmTree(ctx, 24, 2.0, 48, 6.4);
  addCrate(ctx, -8, 2.0, 42, 1.7, 1.6, 0xffffff, 'crate_military');

  // =========================================================================
  // 2. MID, TOP-MID BOXES, UNDERPASS (y=0.0), CONNECTOR & CT WINDOW (y=2.4)
  // =========================================================================
  // Mid floor deck (y=0.8) with sunken Underpass slot on West Mid (X:-16..-6, Z:-10..+16 at y=0.0)
  addFloorDeck(ctx, -6, 16, -24, 20, 0.8, 'sand', 0xe2c79a, 0);
  addSlopeRamp(ctx, 0, 2.0, 28, 0, 0.8, 20, 14, 'sand', 0xe2c79a, 0, false);
  // Underpass ramp down from Mid (Z:+6 -> -4) & tunnel corridor under B-Apartments
  addSlopeRamp(ctx, -11, 0.8, 12, -11, 0.0, 4, 8, 'sand', 0xd1b88e, 0, true);
  addSlopeRamp(ctx, -11, 0.0, -14, -11, 2.8, -24, 8, 'sand', 0xd1b88e, 0, true);
  addTunnelLantern(ctx, -11, 2.2, -6);

  // Mid Boxes & Cart cover
  addCrate(ctx, 4, 0.8, 8, 2.0, 1.8, 0xd4b688);
  addCrate(ctx, -1, 0.8, 2, 1.7, 1.6, 0xffffff, 'crate_military');
  addSandbagBarricade(ctx, 8, 0.8, -4, 3, 2, false);

  // CT Sniper Window / Nest overlooking Mid (Z:-28..-20, X:-4..+8, y=2.4)
  addFloorDeck(ctx, -6, 10, -34, -22, 2.4, 'dust_stone_floor', 0xd6c098, 0);
  addSlopeRamp(ctx, 2, 2.4, -34, 2, 0.8, -42, 6, 'dust_stone_floor', 0xd6c098, 0, false);
  addDoorwayWall(ctx, 2, 2.4, -22, 16, 5.2, 4.4, 2.8, 1.2, 'sandstone', 0xd1b88e, false, 0);

  // Connector linking Mid (X=+16) to Bombsite A
  addDoorwayWall(ctx, 16, 0.8, -10, 26, 6.0, 6.2, 4.4, 2.2, 'sandstone', 0xd1b88e, true, -2);

  // =========================================================================
  // 3. BOMBSITE A, A-RAMP & ELEVATED PALACE INTERIOR (East: X +18..+54)
  // =========================================================================
  addFloorDeck(ctx, 16, 56, -54, 20, 0.8, 'dust_stone_floor', 0xdcc59e, 0);
  // A-Ramp descending cleanly from T-Side (y=2.0) -> Bombsite A (y=0.8)
  addSlopeRamp(ctx, 30, 2.0, 28, 30, 0.8, 16, 10, 'sand', 0xe2c79a, 0, true);

  // Palace Interior Hallway (East edge X:+44..+55, Z:-12..+26, elevated y=3.4)
  addFloorDeck(ctx, 44, 56, -14, 24, 3.4, 'dust_stone_floor', 0xd6c098, 0.8);
  addSlopeRamp(ctx, 50, 2.0, 32, 50, 3.4, 24, 7.0, 'dust_stone_floor', 0xd6c098, 0, false);
  addSlopeRamp(ctx, 44, 3.4, -10, 36, 0.8, -10, 5.2, 'wood_plank', 0xb08a62, 0.8, false);
  addTrimWall(ctx, 56, 0.8, 4, 2.2, 8.2, 74, 'sandstone', 0xd1b88e);
  addDoorwayWall(ctx, 44, 3.4, 6, 36, 5.4, 5.4, 3.8, 1.6, 'sandstone', 0xd9c29c, true, -10);
  addSafetyRail(ctx, 44.2, 3.4, -10, 8, false);
  addFluorescentTube(ctx, 50, 7.6, 6, true);

  // Bombsite A Cover: Triple Box, Tetris, Firebox & CT Ticket Booth
  addCrate(ctx, 32, 0.8, -20, 1.9, 2.2, 0xffffff, 'crate_military'); // Triple
  addCrate(ctx, 34, 0.8, -18, 1.7, 1.6);
  addCrate(ctx, 25, 0.8, -14, 1.8, 1.8); // Default / Firebox
  addCrate(ctx, 39, 0.8, -4, 1.7, 1.6); // Tetris
  addSolidBox(ctx, 22, 0.8, -36, 5.0, 3.2, 5.0, 'concrete', 0xbab0a2); // Ticket Booth
  addSiteDecal(ctx, 30, 0.8, -18, 'A');

  // =========================================================================
  // 4. B APARTMENTS (y=2.8), BOMBSITE B (y=0.8) & MARKET / KITCHEN (West)
  // =========================================================================
  addFloorDeck(ctx, -56, -16, -54, 20, 0.8, 'dust_stone_floor', 0xdcc59e, 0);
  // B-Apartments Hallway (X:-54..-34, Z:-10..+24, y=2.8)
  addFloorDeck(ctx, -54, -34, -12, 22, 2.8, 'wood_plank', 0xb59472, 0.8);
  addSlopeRamp(ctx, -44, 2.0, 30, -44, 2.8, 22, 8.0, 'wood_plank', 0xb59472, 0, false);
  addSlopeRamp(ctx, -44, 2.8, -12, -44, 0.8, -22, 8.0, 'wood_plank', 0xb59472, 0.8, false);
  addTrimWall(ctx, -56, 0.8, 4, 2.2, 8.2, 74, 'sandstone', 0xd1b88e);
  addWindowShutter(ctx, -34.2, 5.2, -2, true, 0x45634b);
  addDoorwayWall(ctx, -34, 2.8, 6, 32, 5.2, 5.2, 3.8, 1.6, 'terracotta', 0xd9b791, true, -10);
  addCafeBistroSet(ctx, -44, 2.8, 6);

  // Bombsite B Van, Pillar & Bench (X:-36..-22, Z:-36..-18, y=0.8)
  addVehicle(ctx, -46, 0.8, -28, 0x707880, false); // B-Van
  addCrate(ctx, -28, 0.8, -32, 1.9, 1.9, 0xffffff, 'crate_military');
  addCrate(ctx, -26, 0.8, -22, 1.7, 1.6);
  addTerracottaPot(ctx, -22, 0.8, -38, 1.25);
  addSiteDecal(ctx, -32, 0.8, -28, 'B');

  // Market / Kitchen Window & Door connecting B to CT Spawn
  addDoorwayWall(ctx, -18, 0.8, -32, 24, 5.2, 6.0, 4.2, 2.0, 'sandstone', 0xd4bb91, true, -4);

  // =========================================================================
  // 5. CT SPAWN COURTYARD (North: Z -56..-38, y=0.8)
  // =========================================================================
  addFloorDeck(ctx, -18, 22, -58, -34, 0.8, 'dust_stone_floor', 0xdcc59e, 0);
  addArchway(ctx, 2, 0.8, -40, 42, 8.2, 5.8, 4.2, 2.2, 'sandstone', 0xd1b88e);
  addCrate(ctx, -6, 0.8, -48, 1.8, 1.7, 0xffffff, 'crate_military');
  addSandbagBarricade(ctx, 10, 0.8, -46, 3, 2, true);

  const waypoints: WaypointNode[] = [
    { id: 't_spawn', x: 0, y: 2.0, z: 46, neighbors: [], tag: 'T' },
    { id: 'top_mid', x: 0, y: 2.0, z: 30, neighbors: [] },
    { id: 'mid', x: 2, y: 0.8, z: 6, neighbors: [], tag: 'MID' },
    { id: 'underpass', x: -11, y: 0.0, z: -2, neighbors: [] },
    { id: 'connector', x: 16, y: 0.8, z: -12, neighbors: [] },
    { id: 'a_ramp', x: 30, y: 1.4, z: 22, neighbors: [] },
    { id: 'palace', x: 50, y: 3.4, z: 6, neighbors: [] },
    { id: 'site_a', x: 30, y: 0.8, z: -18, neighbors: [], tag: 'A' },
    { id: 'b_apts', x: -44, y: 2.8, z: 6, neighbors: [] },
    { id: 'site_b', x: -32, y: 0.8, z: -28, neighbors: [], tag: 'B' },
    { id: 'market', x: -18, y: 0.8, z: -36, neighbors: [] },
    { id: 'ct_window', x: 2, y: 2.4, z: -28, neighbors: [] },
    { id: 'ct_spawn', x: 2, y: 0.8, z: -48, neighbors: [], tag: 'CT' },
  ];
  [
    ['t_spawn', 'top_mid'],
    ['t_spawn', 'a_ramp'],
    ['t_spawn', 'palace'],
    ['t_spawn', 'b_apts'],
    ['top_mid', 'mid'],
    ['mid', 'underpass'],
    ['underpass', 'b_apts'],
    ['mid', 'connector'],
    ['connector', 'site_a'],
    ['a_ramp', 'site_a'],
    ['palace', 'site_a'],
    ['b_apts', 'site_b'],
    ['site_b', 'market'],
    ['market', 'ct_spawn'],
    ['ct_spawn', 'ct_window'],
    ['ct_spawn', 'site_a'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'T Spawn', x: 0, y: 3.6, z: 46, zone: 'T' },
    { name: 'Mid', x: 2, y: 2.2, z: 6, zone: 'MID' },
    { name: 'Underpass', x: -11, y: 1.5, z: -2, zone: 'MID' },
    { name: 'CT Window', x: 2, y: 4.0, z: -28, zone: 'CT' },
    { name: 'Palace', x: 50, y: 4.8, z: 6, zone: 'A' },
    { name: 'Bombsite A', x: 30, y: 2.2, z: -18, zone: 'A' },
    { name: 'B Apartments', x: -44, y: 4.2, z: 6, zone: 'B' },
    { name: 'Bombsite B', x: -32, y: 2.2, z: -28, zone: 'B' },
    { name: 'CT Spawn', x: 2, y: 2.2, z: -48, zone: 'CT' },
  ];

  return {
    id: 'de_mirage',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-6, 2.0, 47),
      new THREE.Vector3(0, 2.0, 48),
      new THREE.Vector3(6, 2.0, 47),
      new THREE.Vector3(-3, 2.0, 44),
      new THREE.Vector3(3, 2.0, 44),
    ],
    ctSpawns: [
      new THREE.Vector3(-4, 0.8, -48),
      new THREE.Vector3(2, 0.8, -49),
      new THREE.Vector3(8, 0.8, -48),
      new THREE.Vector3(-1, 0.8, -45),
      new THREE.Vector3(5, 0.8, -45),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 2.0, 46),
      new THREE.Vector3(2, 0.8, -48),
      new THREE.Vector3(30, 0.8, -18),
      new THREE.Vector3(-32, 0.8, -28),
      new THREE.Vector3(50, 3.4, 6),
      new THREE.Vector3(2, 0.8, 6),
    ],
    bombsites: [
      { label: 'A', x: 30, y: 0.8, z: -18, radius: 6.5 },
      { label: 'B', x: -32, y: 0.8, z: -28, radius: 6.5 },
    ],
    buyZones: [
      { team: 'T', x: 0, z: 46, radius: 11 },
      { team: 'CT', x: 2, z: -47, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0x9ec0d9,
    fogColor: 0xdecbb0,
    fogDensity: 0.0056,
    sunColor: 0xffe4b8,
    sunIntensity: 1.95,
    sunPos: new THREE.Vector3(46, 70, 32),
    hemiSky: 0x9ec5e6,
    hemiGround: 0xa68961,
    hemiIntensity: 0.78,
    surfaceType: 'sand',
    bounds: { minX: -58, maxX: 58, minZ: -59, maxZ: 59 },
    ambientParticleMode: 'dust',
    menuShowcase: {
      camCenter: new THREE.Vector3(2, 5.4, 4),
      camOrbitRadius: 16,
      camHeight: 5.8,
      lookAt: new THREE.Vector3(2, 2.0, 2),
      smokePos: new THREE.Vector3(2, 1.0, 3),
      tSpots: [
        { pos: [-2.5, 2.0, 30], yaw: 0.1, cls: 'desert_t', w: 'ak47', crouch: false },
        { pos: [3.2, 2.0, 29], yaw: -0.1, cls: 'classic_t', w: 'deagle', crouch: true },
      ],
      ctSpots: [
        { pos: [-1, 2.4, -24], yaw: 3.1, cls: 'classic_ct', w: 'awp', crouch: true },
        { pos: [4, 2.4, -24], yaw: 3.2, cls: 'specops_ct', w: 'm4a1', crouch: false },
      ],
    },
  };
}
