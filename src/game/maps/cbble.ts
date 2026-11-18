import * as THREE from 'three';
import {
  addArchedBlindWindow,
  addArchway,
  addCrate,
  addDoorwayWall,
  addDoubleDoors,
  addFloorDeck,
  addFountain,
  addGroundAndHorizon,
  addHedgeRow,
  addOilBarrel,
  addSafetyRail,
  addSandbagBarricade,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addStreetLamp,
  addTempleBrazier,
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
 * Full-scale recreation of CS 1.6 de_cbble / Cobblestone (~118m x 120m playable footprint):
 * Medieval Stone Castle Fortress: T Spawn Courtyard -> B-Long & B-Plat ->
 * Sunken Drop Courtyard (y=0.0) & Connector -> Mid Gate & Archway ->
 * Bombsite A Courtyard & Watchtower Balcony (y=4.8) -> CT Keep Hall.
 */
export function buildCbbleFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x4f78a6, 0xcbd9e6, 0xf2f6fa);
  addGroundAndHorizon(ctx, 118, 120, 'cobblestone', 0xbab3a8, 'moss_stone', 0x7c8276, 8.8, 'villa');

  // =========================================================================
  // 1. CASTLE TERRACE (y=2.4) WITH SUNKEN DROP COURTYARD SLOT (y=0.0)
  // =========================================================================
  // Drop Room / Courtyard sits at X: -18..-4, Z: -14..+6 at y=0.0!
  addFloorDeck(ctx, -58, 58, 6, 58, 2.4, 'cobblestone', 0xbab3a8, 0); // South T-Side
  addFloorDeck(ctx, -58, 58, -58, -14, 2.4, 'cobblestone', 0xbab3a8, 0); // North A/B/CT Side
  addFloorDeck(ctx, -58, -18, -14, 6, 2.4, 'cobblestone', 0xbab3a8, 0); // West B-Long
  addFloorDeck(ctx, -4, 58, -14, 6, 2.4, 'cobblestone', 0xbab3a8, 0); // Mid & A-Long

  // Drop Ramps: T-side Drop Entry (Z:+10 -> 0) & North Exit toward B/Mid (Z:-10 -> -18)
  addSlopeRamp(ctx, -11, 2.4, 8, -11, 0.0, 0, 10, 'cobblestone', 0x999288, 0, true);
  addSlopeRamp(ctx, -11, 0.0, -8, -11, 2.4, -16, 10, 'cobblestone', 0x999288, 0, true);
  addTunnelLantern(ctx, -11, 2.4, -4);

  // =========================================================================
  // 2. T SPAWN COURTYARD & BATTLEMENT ARCHES (South: Z +36..+54, y=2.4)
  // =========================================================================
  addArchway(ctx, 0, 2.4, 34, 54, 8.8, 6.8, 4.6, 2.4, 'moss_stone', 0x878d84);
  addHedgeRow(ctx, -18, 2.4, 44, 12, false);
  addHedgeRow(ctx, 18, 2.4, 44, 12, false);
  addCrate(ctx, -6, 2.4, 42, 1.8, 1.7, 0xffffff, 'crate_military');
  addTempleBrazier(ctx, -8, 2.4, 36);
  addTempleBrazier(ctx, 8, 2.4, 36);

  // =========================================================================
  // 3. B-LONG COURTYARD & BOMBSITE B STATUE PIAZZA (West: X -52..-22)
  // =========================================================================
  addTrimWall(ctx, -56, 2.4, 0, 2.4, 7.2, 106, 'moss_stone', 0x7c8276);
  addArchway(ctx, -38, 2.4, 16, 32, 6.8, 6.6, 4.4, 2.2, 'moss_stone', 0x878d84);
  addFountain(ctx, -36, 2.4, -28); // Iconic B Piazza Monument / Fountain
  addCrate(ctx, -44, 2.4, -22, 1.8, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, -28, 2.4, -34, 1.8, 2.0);
  addSandbagBarricade(ctx, -44, 2.4, -36, 3, 2, true, 0x8f8a7d);
  addSiteDecal(ctx, -34, 2.4, -22, 'B');

  // =========================================================================
  // 4. MID CASTLE GATE, DOUBLE DOORS & CONNECTOR
  // =========================================================================
  addDoorwayWall(ctx, 8, 2.4, 8, 28, 6.2, 6.8, 4.4, 2.2, 'moss_stone', 0x848a80, false, 0);
  addDoubleDoors(ctx, 8, 2.4, 8, 6.0, 2.8, 4.3, 0x543c26);
  addCrate(ctx, 12, 2.4, -6, 1.8, 1.7);
  addStreetLamp(ctx, 4, 2.4, -14, 0xffd594);

  // =========================================================================
  // 5. BOMBSITE A COURTYARD, LONG A & CASTLE WATCHTOWER (East: X +24..+54)
  // =========================================================================
  addTrimWall(ctx, 56, 2.4, 0, 2.4, 7.2, 106, 'moss_stone', 0x7c8276);
  addArchway(ctx, 38, 2.4, 12, 32, 6.8, 6.6, 4.4, 2.2, 'moss_stone', 0x878d84);
  addArchedBlindWindow(ctx, 54.6, 6.2, -16, true);
  addArchedBlindWindow(ctx, 54.6, 6.2, -32, true);

  // Elevated Castle Watchtower Balcony overlooking Site A (y=5.0)
  addFloorDeck(ctx, 42, 54, -46, -28, 5.0, 'cobblestone', 0xa69f94, 2.4);
  addSlopeRamp(ctx, 48, 2.4, -20, 48, 5.0, -28, 5.2, 'cobblestone', 0x9c958a, 2.4, false);
  addSafetyRail(ctx, 42.2, 5.0, -37, 16, false);

  addCrate(ctx, 32, 2.4, -30, 1.8, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, 27, 2.4, -24, 1.7, 1.7);
  addOilBarrel(ctx, 38, 2.4, -36, 0x5c422c);
  addTerracottaPot(ctx, 25, 2.4, -34, 1.3);
  addSiteDecal(ctx, 32, 2.4, -24, 'A');

  // =========================================================================
  // 6. CT KEEP SPAWN HALL (North: Z -54..-36, y=2.4)
  // =========================================================================
  addArchway(ctx, 0, 2.4, -34, 48, 8.2, 6.8, 4.6, 2.4, 'moss_stone', 0x878d84);
  addCrate(ctx, -8, 2.4, -44, 1.8, 1.7);
  addCrate(ctx, 10, 2.4, -44, 1.8, 1.7, 0xffffff, 'crate_military');

  const waypoints: WaypointNode[] = [
    { id: 't_spawn', x: 0, y: 2.4, z: 46, neighbors: [], tag: 'T' },
    { id: 'b_long', x: -38, y: 2.4, z: 16, neighbors: [] },
    { id: 'site_b', x: -34, y: 2.4, z: -22, neighbors: [], tag: 'B' },
    { id: 'drop_s', x: -11, y: 2.4, z: 14, neighbors: [] },
    { id: 'drop_floor', x: -11, y: 0.0, z: -4, neighbors: [] },
    { id: 'mid_doors', x: 8, y: 2.4, z: 8, neighbors: [], tag: 'MID' },
    { id: 'mid_north', x: 8, y: 2.4, z: -20, neighbors: [] },
    { id: 'a_long', x: 38, y: 2.4, z: 12, neighbors: [] },
    { id: 'site_a', x: 32, y: 2.4, z: -24, neighbors: [], tag: 'A' },
    { id: 'tower', x: 48, y: 5.0, z: -36, neighbors: [] },
    { id: 'ct_spawn', x: 0, y: 2.4, z: -46, neighbors: [], tag: 'CT' },
  ];
  [
    ['t_spawn', 'b_long'],
    ['t_spawn', 'drop_s'],
    ['t_spawn', 'mid_doors'],
    ['t_spawn', 'a_long'],
    ['b_long', 'site_b'],
    ['drop_s', 'drop_floor'],
    ['drop_floor', 'mid_north'],
    ['drop_floor', 'site_b'],
    ['mid_doors', 'mid_north'],
    ['mid_north', 'site_b'],
    ['mid_north', 'site_a'],
    ['mid_north', 'ct_spawn'],
    ['a_long', 'site_a'],
    ['site_a', 'tower'],
    ['site_a', 'ct_spawn'],
    ['site_b', 'ct_spawn'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'T Courtyard', x: 0, y: 4.0, z: 46, zone: 'T' },
    { name: 'B Long', x: -38, y: 4.0, z: 16, zone: 'B' },
    { name: 'Drop Room', x: -11, y: 1.5, z: -4, zone: 'MID' },
    { name: 'Mid Gate', x: 8, y: 4.0, z: 8, zone: 'MID' },
    { name: 'Bombsite B', x: -34, y: 4.0, z: -22, zone: 'B' },
    { name: 'A Long', x: 38, y: 4.0, z: 12, zone: 'A' },
    { name: 'Bombsite A', x: 32, y: 4.0, z: -24, zone: 'A' },
    { name: 'Castle Tower', x: 48, y: 6.4, z: -36, zone: 'A' },
    { name: 'CT Keep', x: 0, y: 4.0, z: -46, zone: 'CT' },
  ];

  return {
    id: 'de_cbble',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-6, 2.4, 47),
      new THREE.Vector3(0, 2.4, 48),
      new THREE.Vector3(6, 2.4, 47),
      new THREE.Vector3(-3, 2.4, 44),
      new THREE.Vector3(3, 2.4, 44),
    ],
    ctSpawns: [
      new THREE.Vector3(-6, 2.4, -47),
      new THREE.Vector3(0, 2.4, -48),
      new THREE.Vector3(6, 2.4, -47),
      new THREE.Vector3(-3, 2.4, -44),
      new THREE.Vector3(3, 2.4, -44),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 2.4, 46),
      new THREE.Vector3(0, 2.4, -46),
      new THREE.Vector3(32, 2.4, -24),
      new THREE.Vector3(-34, 2.4, -22),
      new THREE.Vector3(-11, 0, -4),
      new THREE.Vector3(48, 5.0, -36),
    ],
    bombsites: [
      { label: 'A', x: 32, y: 2.4, z: -24, radius: 6.5 },
      { label: 'B', x: -34, y: 2.4, z: -22, radius: 6.5 },
    ],
    buyZones: [
      { team: 'T', x: 0, z: 46, radius: 11 },
      { team: 'CT', x: 0, z: -46, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0x89abc9,
    fogColor: 0xc9d5df,
    fogDensity: 0.0058,
    sunColor: 0xfff0d8,
    sunIntensity: 1.8,
    sunPos: new THREE.Vector3(-42, 68, 36),
    hemiSky: 0x9ec0de,
    hemiGround: 0x6f6c64,
    hemiIntensity: 0.78,
    surfaceType: 'concrete',
    bounds: { minX: -58, maxX: 58, minZ: -59, maxZ: 59 },
    ambientParticleMode: 'dust',
    menuShowcase: {
      camCenter: new THREE.Vector3(8, 7.4, -4),
      camOrbitRadius: 16,
      camHeight: 7.8,
      lookAt: new THREE.Vector3(8, 4.0, -10),
      smokePos: new THREE.Vector3(8, 2.6, 2),
      tSpots: [
        { pos: [5, 2.4, 14], yaw: 0.1, cls: 'classic_t', w: 'ak47', crouch: false },
        { pos: [11, 2.4, 13], yaw: -0.1, cls: 'military_t', w: 'galil', crouch: true },
      ],
      ctSpots: [
        { pos: [6, 2.4, -14], yaw: 3.1, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [11, 2.4, -15], yaw: 3.2, cls: 'specops_ct', w: 'aug', crouch: false },
      ],
    },
  };
}
