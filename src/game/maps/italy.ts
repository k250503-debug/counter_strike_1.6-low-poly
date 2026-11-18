import * as THREE from 'three';
import {
  addArchway,
  addCafeBistroSet,
  addCrate,
  addDoorwayWall,
  addFloorDeck,
  addFountain,
  addGroundAndHorizon,
  addHedgeRow,
  addMarketAwning,
  addOilBarrel,
  addSafetyRail,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addStreetLamp,
  addTerracottaPot,
  addTrimWall,
  addTunnelLantern,
  addWindowShutter,
  BuiltMap,
  linkWaypoints,
  MapBuildContext,
  MapCalloutPin,
  WaypointNode,
} from './shared';

/**
 * Full-scale recreation of CS 1.6 cs_italy (~112m x 116m playable footprint):
 * Town Streets & Market Piazza (y=2.4) over an enclosed Wine Cellar Underground (y=0.0):
 * CT Spawn Plaza -> Long Corridor & Mid Alley -> Underground Wine Cellar Tunnels ->
 * Market Square & Fountain -> Upper Bridge & Apartments (y=4.8) -> T-Spawn Villa.
 */
export function buildItalyFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x5a94cb, 0xead5ba, 0xfff5e8);
  addGroundAndHorizon(ctx, 112, 116, 'cobblestone', 0xd1c4b2, 'terracotta', 0xd4a47d, 8.6, 'villa');

  // =========================================================================
  // 1. TOWN TERRACE DECK (y=2.4) WITH WINE CELLAR STAIRWELL SLOTS (y=0.0)
  // =========================================================================
  // Wine Cellar runs along X: -18..-8 from Z: -20..+24 at y=0.0!
  // Build Town cobblestone decks around the Wine Cellar ramp openings
  addFloorDeck(ctx, -55, 55, 24, 57, 2.4, 'cobblestone', 0xd1c4b2, 0); // South CT Terrace
  addFloorDeck(ctx, -55, 55, -57, -20, 2.4, 'cobblestone', 0xd1c4b2, 0); // North Market/Villa Terrace
  addFloorDeck(ctx, -55, -18, -20, 24, 2.4, 'cobblestone', 0xd1c4b2, 0); // West Long Alley
  addFloorDeck(ctx, -8, 55, -20, 24, 2.4, 'cobblestone', 0xd1c4b2, 0); // Mid + East Apartments

  // Wine Cellar Ramps descending cleanly from y=2.4 -> y=0.0 (South Entry & North Exit)
  addSlopeRamp(ctx, -13, 2.4, 24, -13, 0.0, 14, 9.2, 'cobblestone', 0xa69988, 0, true);
  addSlopeRamp(ctx, -13, 0.0, -10, -13, 2.4, -20, 9.2, 'cobblestone', 0xa69988, 0, true);
  addOilBarrel(ctx, -16, 0, 2, 0x6b472b);
  addOilBarrel(ctx, -10, 0, -2, 0x6b472b);
  addCrate(ctx, -13, 0, 6, 1.6, 1.5, 0x7d5836);
  addTunnelLantern(ctx, -13, 2.2, 8);
  addTunnelLantern(ctx, -13, 2.2, -4);

  // =========================================================================
  // 2. CT SPAWN PLAZA & HEDGES (South: Z +32..+54, y=2.4)
  // =========================================================================
  addHedgeRow(ctx, -20, 2.4, 42, 12, false);
  addHedgeRow(ctx, 20, 2.4, 42, 12, false);
  addArchway(ctx, 0, 2.4, 34, 38, 8.2, 5.8, 4.2, 2.2, 'terracotta', 0xd9b791);
  addTerracottaPot(ctx, -10, 2.4, 37, 1.25);
  addTerracottaPot(ctx, 10, 2.4, 37, 1.25);

  // =========================================================================
  // 3. LONG CORRIDOR (WEST), MID ALLEY & MARKET SQUARE (Z -20..+32)
  // =========================================================================
  // Mid Alley Terracotta Facades + Shutters
  addDoorwayWall(ctx, -6, 2.4, 10, 44, 5.4, 6.2, 4.2, 2.2, 'terracotta', 0xd9b791, true, 10);
  addDoorwayWall(ctx, 12, 2.4, 10, 44, 5.4, 6.2, 4.2, 2.2, 'terracotta', 0xd9b791, true, -8);
  addWindowShutter(ctx, -4.8, 6.2, 4, true, 0x45634b);
  addWindowShutter(ctx, 10.8, 6.2, 14, true, 0x6b472b);
  addCrate(ctx, 3, 2.4, 12, 1.7, 1.6);

  // Long West Corridor (X: -46..-24, Z: -24..+32)
  addTrimWall(ctx, -50, 2.4, 4, 2.4, 6.4, 64, 'terracotta', 0xd2ae87);
  addTrimWall(ctx, -22, 2.4, 4, 2.4, 6.4, 42, 'terracotta', 0xd2ae87);
  addWindowShutter(ctx, -48.6, 6.2, -4, true, 0x45634b);
  addWindowShutter(ctx, -48.6, 6.2, 16, true, 0x6b472b);
  addCrate(ctx, -36, 2.4, 6, 1.8, 1.7);
  addCafeBistroSet(ctx, -30, 2.4, 22);

  // Market Square & Fountain (X: -24..+22, Z: -34..-8, y=2.4)
  addFountain(ctx, 0, 2.4, -22);
  addSolidBox(ctx, -21, 2.4, -24, 4.2, 1.2, 2.4, 'wood_plank', 0x875c38);
  addMarketAwning(ctx, -21, 5.0, -24, 4.8, 3.2, 0xb8483c, false, true);
  addSolidBox(ctx, 18, 2.4, -20, 4.2, 1.2, 2.4, 'wood_plank', 0x875c38);
  addMarketAwning(ctx, 18, 5.0, -20, 4.8, 3.2, 0x457343, false, true);
  addCafeBistroSet(ctx, -14, 2.4, -28);
  addCafeBistroSet(ctx, 14, 2.4, -28);
  addStreetLamp(ctx, -7, 2.4, -26, 0xffd594);

  // =========================================================================
  // 4. UPPER BRIDGE & APARTMENTS (East Wing & North Market Overlook, y=4.8)
  // =========================================================================
  // East Apartments Balcony Deck (y=4.8) + Stairs up from CT/Mid & North Market
  addFloorDeck(ctx, 24, 44, -24, 10, 4.8, 'wood_plank', 0xb69472, 2.4);
  addSlopeRamp(ctx, 34, 2.4, 18, 34, 4.8, 10, 5.2, 'wood_plank', 0xa68362, 2.4, false);
  // Iconic Upper Bridge spanning East-West across North Market (Z: -38..-32, y=4.8)
  addFloorDeck(ctx, -20, 24, -39, -32, 4.8, 'terracotta', 0xc8a47e, 4.2);
  addSlopeRamp(ctx, -20, 4.8, -35.5, -28, 2.4, -35.5, 5.4, 'terracotta', 0xc8a47e, 2.4, false);
  addSafetyRail(ctx, 2, 4.8, -32.2, 42, true);
  addSafetyRail(ctx, 24.2, 4.8, -8, 28, false);

  // =========================================================================
  // 5. T-SPAWN VILLA & HOSTAGE ROOMS (North: Z -56..-38, y=2.4)
  // =========================================================================
  addDoorwayWall(ctx, 0, 2.4, -42, 74, 7.0, 6.2, 4.4, 2.2, 'terracotta', 0xd6b48e, false, 0);
  addSiteDecal(ctx, 22, 2.4, -48, 'A');
  addSiteDecal(ctx, -22, 2.4, -48, 'B');
  addTerracottaPot(ctx, -8, 2.4, -46, 1.3);
  addTerracottaPot(ctx, 8, 2.4, -46, 1.3);

  const waypoints: WaypointNode[] = [
    { id: 'ct_spawn', x: 0, y: 2.4, z: 46, neighbors: [], tag: 'CT' },
    { id: 'mid_alley', x: 3, y: 2.4, z: 16, neighbors: [], tag: 'MID' },
    { id: 'cellar_s', x: -13, y: 2.4, z: 26, neighbors: [] },
    { id: 'cellar_mid', x: -13, y: 0.0, z: 4, neighbors: [] },
    { id: 'long_s', x: -36, y: 2.4, z: 24, neighbors: [] },
    { id: 'long_n', x: -36, y: 2.4, z: -24, neighbors: [] },
    { id: 'market', x: 0, y: 2.4, z: -22, neighbors: [] },
    { id: 'apts', x: 34, y: 4.8, z: -8, neighbors: [] },
    { id: 'bridge', x: 0, y: 4.8, z: -35.5, neighbors: [] },
    { id: 'site_a', x: 22, y: 2.4, z: -48, neighbors: [], tag: 'A' },
    { id: 'site_b', x: -22, y: 2.4, z: -48, neighbors: [], tag: 'B' },
    { id: 't_spawn', x: 0, y: 2.4, z: -48, neighbors: [], tag: 'T' },
  ];
  [
    ['ct_spawn', 'mid_alley'],
    ['ct_spawn', 'long_s'],
    ['ct_spawn', 'apts'],
    ['mid_alley', 'market'],
    ['mid_alley', 'cellar_s'],
    ['cellar_s', 'cellar_mid'],
    ['cellar_mid', 'market'],
    ['long_s', 'long_n'],
    ['long_n', 'market'],
    ['long_n', 'site_b'],
    ['long_n', 'bridge'],
    ['apts', 'bridge'],
    ['market', 'site_a'],
    ['market', 'site_b'],
    ['site_a', 't_spawn'],
    ['site_b', 't_spawn'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'CT Spawn', x: 0, y: 4.0, z: 46, zone: 'CT' },
    { name: 'Mid Alley', x: 3, y: 4.0, z: 16, zone: 'MID' },
    { name: 'Wine Cellar', x: -13, y: 1.5, z: 4, zone: 'MID' },
    { name: 'Long Corridor', x: -36, y: 4.0, z: 0, zone: 'MID' },
    { name: 'Market Square', x: 0, y: 4.0, z: -22, zone: 'MID' },
    { name: 'Apartments', x: 34, y: 6.2, z: -8, zone: 'MID' },
    { name: 'Upper Bridge', x: 0, y: 6.2, z: -35.5, zone: 'T' },
    { name: 'T Villa', x: 0, y: 4.0, z: -48, zone: 'T' },
  ];

  return {
    id: 'cs_italy',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-6, 2.4, -49),
      new THREE.Vector3(0, 2.4, -49),
      new THREE.Vector3(6, 2.4, -49),
      new THREE.Vector3(-3, 2.4, -46),
      new THREE.Vector3(3, 2.4, -46),
    ],
    ctSpawns: [
      new THREE.Vector3(-6, 2.4, 46),
      new THREE.Vector3(0, 2.4, 46),
      new THREE.Vector3(6, 2.4, 46),
      new THREE.Vector3(-3, 2.4, 43),
      new THREE.Vector3(3, 2.4, 43),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 2.4, 46),
      new THREE.Vector3(0, 2.4, -48),
      new THREE.Vector3(5, 2.4, -22),
      new THREE.Vector3(-36, 2.4, 0),
      new THREE.Vector3(34, 4.8, -8),
      new THREE.Vector3(-13, 0, 4),
    ],
    bombsites: [
      { label: 'A', x: 22, y: 2.4, z: -48, radius: 6.4 },
      { label: 'B', x: -22, y: 2.4, z: -48, radius: 6.4 },
    ],
    buyZones: [
      { team: 'T', x: 0, z: -48, radius: 11 },
      { team: 'CT', x: 0, z: 45, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0x99c6e8,
    fogColor: 0xdfcfba,
    fogDensity: 0.006,
    sunColor: 0xffe4b8,
    sunIntensity: 1.9,
    sunPos: new THREE.Vector3(44, 68, 32),
    hemiSky: 0xa6d0f0,
    hemiGround: 0x917458,
    hemiIntensity: 0.78,
    surfaceType: 'concrete',
    bounds: { minX: -55, maxX: 55, minZ: -57, maxZ: 57 },
    ambientParticleMode: 'dust',
    menuShowcase: {
      camCenter: new THREE.Vector3(8, 7.0, -14),
      camOrbitRadius: 15,
      camHeight: 7.4,
      lookAt: new THREE.Vector3(0, 3.8, -22),
      smokePos: new THREE.Vector3(0, 2.6, -15),
      tSpots: [
        { pos: [-4, 4.8, -35.5], yaw: 3.1, cls: 'desert_t', w: 'ak47', crouch: false },
        { pos: [4, 4.8, -35.5], yaw: 3.2, cls: 'classic_t', w: 'galil', crouch: true },
        { pos: [-10, 2.4, -24], yaw: 2.8, cls: 'military_t', w: 'deagle', crouch: false },
      ],
      ctSpots: [
        { pos: [-4, 2.4, -10], yaw: 0.1, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [4, 2.4, -9], yaw: -0.1, cls: 'specops_ct', w: 'aug', crouch: false },
        { pos: [12, 2.4, -13], yaw: -0.4, cls: 'assault_ct', w: 'famas', crouch: true },
      ],
    },
  };
}
