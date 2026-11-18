import * as THREE from 'three';
import {
  addArchedBlindWindow,
  addArchway,
  addCrate,
  addDoorwayWall,
  addFloorDeck,
  addFluorescentTube,
  addGroundAndHorizon,
  addMarketAwning,
  addOilBarrel,
  addPalmTree,
  addSandbagBarricade,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addTerracottaPot,
  addTrimWall,
  addTunnelLantern,
  BuiltMap,
  linkWaypoints,
  MapBuildContext,
  MapCalloutPin,
  WaypointNode,
} from './shared';

/**
 * Full-scale recreation of CS 1.6 de_dust (~114m x 118m playable footprint):
 * Iconic T-Spawn Courtyard -> Center Overpass Bridge (y=3.2) spanning directly
 * above the sunken Underpass Tunnel (y=0.0) -> Mid Hallway & Sniper Arch ->
 * Bombsite A (CT Terrace), Bombsite B (West Ruins), and CT Spawn Citadel.
 */
export function buildDustFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x457ec2, 0xeddcc0, 0xfff8ed);
  addGroundAndHorizon(ctx, 114, 118, 'sand', 0xe2c79a, 'sandstone', 0xd6bc90, 8.8, 'desert');

  // =========================================================================
  // 1. ELEVATED TOWN DECKS (y=3.2) + SUNKEN UNDERPASS SLOT (y=0.0, X: -10..+10)
  // =========================================================================
  // South T-Side Deck (Z: +14..+57)
  addFloorDeck(ctx, -55, 55, 14, 57, 3.2, 'sand', 0xe2c79a, 0);
  // North CT & Bombsite Deck (Z: -57..-14)
  addFloorDeck(ctx, -55, 55, -57, -14, 3.2, 'sand', 0xe2c79a, 0);
  // West Bombsite B Deck (X: -55..-14, Z: -14..+14)
  addFloorDeck(ctx, -55, -14, -14, 14, 3.2, 'sand', 0xe2c79a, 0);
  // East Hallway / A-Long Deck (X: +14..+55, Z: -14..+14)
  addFloorDeck(ctx, 14, 55, -14, 14, 3.2, 'sand', 0xe2c79a, 0);

  // Iconic Overpass Bridge spanning across the Underpass (X: -8..+8, Z: -14..+14, y=3.2)
  addFloorDeck(ctx, -7, 7, -14, 14, 3.2, 'dust_stone_floor', 0xd6c098, 2.55);
  // Bridge stone parapet curbs
  addSolidBox(ctx, -6.7, 3.2, 0, 0.5, 0.9, 26, 'sandstone', 0xc9af87);
  addSolidBox(ctx, 6.7, 3.2, 0, 0.5, 0.9, 26, 'sandstone', 0xc9af87);

  // Underpass Side Ramps descending from West/East into Underpass (y=3.2 -> y=0.0)
  addSlopeRamp(ctx, -22, 3.2, 0, -10, 0.0, 0, 9.0, 'sand', 0xdcc092, 0, true);
  addSlopeRamp(ctx, 22, 3.2, 0, 10, 0.0, 0, 9.0, 'sand', 0xdcc092, 0, true);
  // Underpass North/South exit ramps (connects cleanly under Overpass into T/CT lanes)
  addCrate(ctx, 0, 0, 0, 1.8, 1.7, 0xffffff, 'crate_military');
  addTunnelLantern(ctx, -4, 2.2, 0);
  addTunnelLantern(ctx, 4, 2.2, 0);

  // =========================================================================
  // 2. T SPAWN COURTYARD (South: Z +36..+54, y=3.2)
  // =========================================================================
  addArchway(ctx, 0, 3.2, 36, 48, 8.4, 6.0, 4.4, 2.2, 'sandstone', 0xd9c29c);
  addArchedBlindWindow(ctx, -14, 7.0, 34.8, false);
  addArchedBlindWindow(ctx, 14, 7.0, 34.8, false);
  addMarketAwning(ctx, -16, 6.8, 48, 7.0, 3.4, 0xb8523b, false, true);
  addMarketAwning(ctx, 16, 6.8, 48, 7.0, 3.4, 0x4f7354, false, true);
  addSandbagBarricade(ctx, -8, 3.2, 43, 4, 2, true);
  addCrate(ctx, 8, 3.2, 44, 1.8, 1.7);
  addPalmTree(ctx, -24, 3.2, 48, 6.8);
  addPalmTree(ctx, 24, 3.2, 48, 6.4);

  // =========================================================================
  // 3. CENTRAL HALLWAY & SNIPER ARCH (East: X +24..+48, Z -36..+32)
  // =========================================================================
  addTrimWall(ctx, 50, 3.2, 0, 2.4, 6.8, 88, 'sandstone', 0xd1b88e);
  addDoorwayWall(ctx, 24, 3.2, 16, 26, 5.6, 6.6, 4.4, 2.2, 'sandstone', 0xd4bb91, true, 0);
  addDoorwayWall(ctx, 24, 3.2, -16, 26, 5.6, 6.6, 4.4, 2.2, 'sandstone', 0xd4bb91, true, 0);
  addSolidBox(ctx, 37, 9.2, 0, 26, 0.8, 46, 'sandstone', 0xc9af87, 0.86, 0.04, 6, 8);
  addFluorescentTube(ctx, 37, 8.6, -8, true);
  addFluorescentTube(ctx, 37, 8.6, 8, true);
  addCrate(ctx, 34, 3.2, 4, 1.9, 1.8, 0xffffff, 'crate_military');
  addOilBarrel(ctx, 43, 3.2, -6, 0x7d3a2e);

  // =========================================================================
  // 4. BOMBSITE A (CT SIDE EAST, X +22..+44, Z -44..-24, y=3.2)
  // =========================================================================
  addArchway(ctx, 18, 3.2, -32, 24, 6.8, 6.4, 4.4, 2.2, 'sandstone', 0xd9c29c, Math.PI / 2);
  addCrate(ctx, 32, 3.2, -34, 1.8, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, 37, 3.2, -38, 1.8, 2.1);
  addSandbagBarricade(ctx, 27, 3.2, -40, 3, 2, true);
  addTerracottaPot(ctx, 25, 3.2, -26, 1.25);
  addSiteDecal(ctx, 34, 3.2, -34, 'A');

  // =========================================================================
  // 5. BOMBSITE B (WEST RUINS, X -48..-24, Z -28..+8, y=3.2)
  // =========================================================================
  addTrimWall(ctx, -50, 3.2, 0, 2.4, 6.8, 88, 'sandstone', 0xd1b88e);
  addArchway(ctx, -28, 3.2, 16, 36, 6.8, 6.2, 4.4, 2.2, 'sandstone', 0xd1b88e);
  addArchway(ctx, -28, 3.2, -26, 36, 6.8, 6.2, 4.4, 2.2, 'sandstone', 0xd1b88e);
  addCrate(ctx, -38, 3.2, -6, 1.9, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, -33, 3.2, -12, 1.8, 2.0);
  addSandbagBarricade(ctx, -42, 3.2, 2, 3, 2, false);
  addPalmTree(ctx, -44, 3.2, -16, 6.8);
  addSiteDecal(ctx, -36, 3.2, -6, 'B');

  // =========================================================================
  // 6. CT SPAWN SNIPER CORRIDOR (North: Z -52..-32, y=3.2)
  // =========================================================================
  addArchway(ctx, 0, 3.2, -30, 34, 7.6, 6.4, 4.4, 2.2, 'sandstone', 0xd1b88e);
  addCrate(ctx, -6, 3.2, -42, 1.8, 1.7, 0xffffff, 'crate_military');
  addCrate(ctx, 7, 3.2, -43, 1.7, 1.6);

  const waypoints: WaypointNode[] = [
    { id: 't_spawn', x: 0, y: 3.2, z: 46, neighbors: [], tag: 'T' },
    { id: 't_mid', x: 0, y: 3.2, z: 22, neighbors: [] },
    { id: 'overpass', x: 0, y: 3.2, z: 0, neighbors: [], tag: 'MID' },
    { id: 'underpass_w', x: -24, y: 3.2, z: 0, neighbors: [] },
    { id: 'underpass_c', x: 0, y: 0, z: 0, neighbors: [] },
    { id: 'underpass_e', x: 24, y: 3.2, z: 0, neighbors: [] },
    { id: 'hall_s', x: 36, y: 3.2, z: 22, neighbors: [] },
    { id: 'hall_mid', x: 37, y: 3.2, z: 0, neighbors: [] },
    { id: 'site_a', x: 34, y: 3.2, z: -34, neighbors: [], tag: 'A' },
    { id: 'b_approach', x: -34, y: 3.2, z: 24, neighbors: [] },
    { id: 'site_b', x: -36, y: 3.2, z: -6, neighbors: [], tag: 'B' },
    { id: 'ct_b_exit', x: -32, y: 3.2, z: -36, neighbors: [] },
    { id: 'ct_spawn', x: 0, y: 3.2, z: -46, neighbors: [], tag: 'CT' },
  ];
  [
    ['t_spawn', 't_mid'],
    ['t_spawn', 'b_approach'],
    ['t_spawn', 'hall_s'],
    ['t_mid', 'overpass'],
    ['overpass', 'ct_spawn'],
    ['b_approach', 'site_b'],
    ['site_b', 'underpass_w'],
    ['underpass_w', 'underpass_c'],
    ['underpass_c', 'underpass_e'],
    ['underpass_e', 'hall_mid'],
    ['hall_s', 'hall_mid'],
    ['hall_mid', 'site_a'],
    ['site_b', 'ct_b_exit'],
    ['ct_b_exit', 'ct_spawn'],
    ['site_a', 'ct_spawn'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'T Spawn', x: 0, y: 4.8, z: 46, zone: 'T' },
    { name: 'Overpass Bridge', x: 0, y: 4.8, z: 0, zone: 'MID' },
    { name: 'Underpass', x: 0, y: 1.5, z: 0, zone: 'MID' },
    { name: 'Mid Hallway', x: 37, y: 4.8, z: 0, zone: 'MID' },
    { name: 'Bombsite A', x: 34, y: 4.8, z: -34, zone: 'A' },
    { name: 'Bombsite B', x: -36, y: 4.8, z: -6, zone: 'B' },
    { name: 'CT Spawn', x: 0, y: 4.8, z: -46, zone: 'CT' },
  ];

  return {
    id: 'de_dust',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-6, 3.2, 47),
      new THREE.Vector3(0, 3.2, 48),
      new THREE.Vector3(6, 3.2, 47),
      new THREE.Vector3(-3, 3.2, 44),
      new THREE.Vector3(3, 3.2, 44),
    ],
    ctSpawns: [
      new THREE.Vector3(-6, 3.2, -47),
      new THREE.Vector3(0, 3.2, -48),
      new THREE.Vector3(6, 3.2, -47),
      new THREE.Vector3(-3, 3.2, -44),
      new THREE.Vector3(3, 3.2, -44),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 3.2, 46),
      new THREE.Vector3(0, 3.2, -46),
      new THREE.Vector3(34, 3.2, -34),
      new THREE.Vector3(-36, 3.2, -6),
      new THREE.Vector3(3.5, 0, 0),
      new THREE.Vector3(37, 3.2, 0),
    ],
    bombsites: [
      { label: 'A', x: 34, y: 3.2, z: -34, radius: 6.4 },
      { label: 'B', x: -36, y: 3.2, z: -6, radius: 6.4 },
    ],
    buyZones: [
      { team: 'T', x: 0, z: 46, radius: 11 },
      { team: 'CT', x: 0, z: -46, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0x9ec0d9,
    fogColor: 0xdecbb0,
    fogDensity: 0.0058,
    sunColor: 0xffe4b8,
    sunIntensity: 1.95,
    sunPos: new THREE.Vector3(46, 70, 34),
    hemiSky: 0x9ec5e6,
    hemiGround: 0xa68961,
    hemiIntensity: 0.78,
    surfaceType: 'sand',
    bounds: { minX: -56, maxX: 56, minZ: -58, maxZ: 58 },
    ambientParticleMode: 'dust',
    menuShowcase: {
      camCenter: new THREE.Vector3(0, 7.6, 0),
      camOrbitRadius: 16,
      camHeight: 8.2,
      lookAt: new THREE.Vector3(0, 4.4, 0),
      smokePos: new THREE.Vector3(0, 3.4, 2),
      tSpots: [
        { pos: [-2.8, 3.2, 8], yaw: 0.1, cls: 'classic_t', w: 'ak47', crouch: false },
        { pos: [2.5, 3.2, 7], yaw: -0.1, cls: 'desert_t', w: 'deagle', crouch: true },
      ],
      ctSpots: [
        { pos: [-2.8, 3.2, -8], yaw: 3.05, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [2.5, 3.2, -9], yaw: 3.2, cls: 'assault_ct', w: 'awp', crouch: false },
      ],
    },
  };
}
