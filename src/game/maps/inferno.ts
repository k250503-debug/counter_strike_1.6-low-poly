import * as THREE from 'three';
import {
  addArchway,
  addCafeBistroSet,
  addCrate,
  addFloorDeck,
  addFountain,
  addGroundAndHorizon,
  addHedgeRow,
  addMarketAwning,
  addOilBarrel,
  addPalmTree,
  addSandbagBarricade,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addSteps,
  addStreetLamp,
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
 * Full-scale recreation of CS 1.6 de_inferno (~114m x 116m)
 * featuring T-Spawn Courtyard, Second Mid, Alt Mid, Banana with Car/Logs,
 * Bombsite B Fountain/Coffins/Ruins, Archway, Library/Speedway,
 * Enterable Multi-Room A Apartments & Balcony, A Pit, A Site & CT Spawn.
 */
export function buildInfernoFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x4b85c9, 0xead6ba, 0xfff5e8);
  addGroundAndHorizon(ctx, 116, 118, 'cobblestone', 0xd5c7b4, 'terracotta', 0xd8a880, 8.6, 'villa');

  // =========================================================================
  // 1. TERRORIST SPAWN & T-RAMP (Z: +40..+56, X: -26..+28, y=1.2)
  // =========================================================================
  addFloorDeck(ctx, -26, 28, 40, 56, 1.2, 'cobblestone', 0xd6c7b2, 0);
  addArchway(ctx, 0, 1.2, 40, 54, 8.4, 5.8, 4.2, 2.2, 'terracotta', 0xd9b892);
  addMarketAwning(ctx, -15, 4.8, 50, 7.2, 3.8, 0xb8483c, false, true);
  addMarketAwning(ctx, 16, 4.8, 50, 7.2, 3.8, 0x4b7444, false, true);
  addCafeBistroSet(ctx, -16, 1.2, 46);
  addTerracottaPot(ctx, -9, 1.2, 43, 1.2);
  addTerracottaPot(ctx, 9, 1.2, 43, 1.2);
  addCrate(ctx, 14, 1.2, 46, 1.7, 1.6);

  // Ramps down from T-Spawn (1.2) -> Banana West (0.0) and Second Mid East (0.0)
  addSlopeRamp(ctx, -26, 1.2, 46, -35, 0.0, 42, 10, 'cobblestone', 0xd5c7b4, 0, false);
  addSlopeRamp(ctx, 0, 1.2, 40, 0, 0.0, 30, 8.0, 'cobblestone', 0xd5c7b4, 0, false);
  addSlopeRamp(ctx, 28, 1.2, 46, 36, 0.0, 40, 10, 'cobblestone', 0xd5c7b4, 0, false);

  // =========================================================================
  // 2. BANANA CORRIDOR -> BOMBSITE B (X: -54..-22, Z: -54..+40)
  // =========================================================================
  // Banana outer boundary walls framing iconic diagonal/stepped cobblestone lane
  addTrimWall(ctx, -23, 0, 12, 2.4, 6.8, 44, 'terracotta', 0xd4ad86);
  addWindowShutter(ctx, -24.25, 4.4, 18, true, 0x45634b);
  addWindowShutter(ctx, -24.25, 4.4, 2, true, 0x6b472b);
  // Banana slight climb from Mid base (y=0.0) up to B-Site (y=1.2)
  addFloorDeck(ctx, -55, -24, -55, -16, 1.2, 'cobblestone', 0xd4c6b2, 0);
  addSlopeRamp(ctx, -38, 0.0, 2, -38, 1.2, -16, 26, 'cobblestone', 0xd5c7b4, 0, false);

  // Banana iconic landmarks: Car, Half-Wall Sandbags, Logs & Canopy Tree
  addVehicle(ctx, -32, 0, 14, 0x6c7c88, true);
  addSandbagBarricade(ctx, -43, 0.3, -2, 5, 2, true);
  addCrate(ctx, -47, 0.8, -10, 1.8, 1.7, 0xffffff, 'crate_military');
  addMarketAwning(ctx, -49, 4.2, 6, 6.2, 4.0, 0xc77d42, false, true);
  addOilBarrel(ctx, -30, 0.6, -5, 0x7d3a2e);

  // Bombsite B Fountain Piazza (X: -55..-24, Z: -55..-16, y=1.2)
  addFountain(ctx, -37, 1.2, -34);
  addCrate(ctx, -48, 1.2, -26, 1.8, 2.1); // First / New Box
  addCrate(ctx, -43, 1.2, -40, 1.7, 1.7, 0xffffff, 'crate_military'); // First/Second Oranges
  addCrate(ctx, -50, 1.2, -48, 1.8, 2.0); // Dark / Coffins cover
  addSandbagBarricade(ctx, -31, 1.2, -48, 4, 2, true);
  addHedgeRow(ctx, -52.5, 1.2, -36, 9, false);
  addSiteDecal(ctx, -38, 1.2, -24, 'B');

  // CT Ruins / Construction Tunnel connecting B-Site (East at X=-24) down to CT Spawn (y=0.0)
  addArchway(ctx, -23, 1.2, -36, 22, 6.4, 6.8, 4.4, 2.4, 'terracotta', 0xc9a078, Math.PI / 2);
  addSlopeRamp(ctx, -23, 1.2, -36, -11, 0.0, -36, 7.2, 'cobblestone', 0xd5c7b4, 0, false);
  addTrimWall(ctx, -17, 0, -29.5, 12, 6.2, 1.8, 'terracotta', 0xcba179);
  addTrimWall(ctx, -17, 0, -42.5, 12, 6.2, 1.8, 'terracotta', 0xcba179);
  addSolidBox(ctx, -17, 5.6, -36, 13, 0.7, 14, 'terracotta', 0xc29870, 0.85, 0.04, 3, 3, false);
  addTunnelLantern(ctx, -17, 5.15, -36);

  // =========================================================================
  // 3. MID, TOP MID, ARCH, SPEEDWAY/LIBRARY & CT SPAWN
  // =========================================================================
  // Mid Alley & Ramp (X: -12..+12, Z: -20..+30)
  addTrimWall(ctx, -10, 0, 8, 2.2, 6.8, 24, 'terracotta', 0xd9b791);
  addTrimWall(ctx, 10, 0, 10, 2.2, 6.8, 20, 'terracotta', 0xd9b791);
  addWindowShutter(ctx, -8.85, 4.4, 12, true, 0x45634b);
  addWindowShutter(ctx, 8.85, 4.4, 12, true, 0x6b472b);
  addCrate(ctx, -2.5, 0, 14, 1.8, 1.7);
  addSandbagBarricade(ctx, 4.5, 0, 2, 3, 2, false);
  addVehicle(ctx, -5, 0, 22, 0x8b6a4e, true); // Top Mid / Second Mid cover cart

  // Mid Quad splitting into Archway (-X toward CT) & Boiler/Short (+X toward A)
  addArchway(ctx, -6, 0, -20, 14, 5.8, 6.4, 4.4, 2.2, 'terracotta', 0xd1a880);
  addStreetLamp(ctx, 4, 0, -14, 0xffd28c);

  // Library / Speedway building separating CT Spawn from A-Site
  addTrimWall(ctx, 12, 0, -28, 2.2, 6.8, 16, 'terracotta', 0xcba179);
  addCrate(ctx, 4, 0, -45, 1.9, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, -8, 0, -48, 1.8, 1.7);
  addSandbagBarricade(ctx, 10, 0, -51, 4, 2, true);
  addHedgeRow(ctx, -14, 0, -52, 8, true);

  // =========================================================================
  // 4. SECOND MID, ENTERABLE A-APARTMENTS & BALCONY, A PIT & BOMBSITE A
  // =========================================================================
  // Second Mid street (X: +12..+42, Z: +10..+40)
  addCafeBistroSet(ctx, 24, 0, 28);
  addMarketAwning(ctx, 28, 3.8, 22, 6.4, 3.6, 0xb8523b, false, true);
  addCrate(ctx, 19, 0, 15, 1.6, 1.6);

  // Multi-Room Enterable Apartments Building (X: +32..+54, Z: -24..+18, Upper Floor y=2.8)
  addFloorDeck(ctx, 32, 54, -24, 18, 2.8, 'wood_plank', 0x7d5838, 0);
  // Alt-Mid Exterior Stairwell climbing up into South Apartments (y=0 -> 2.8)
  addSlopeRamp(ctx, 38, 0.0, 28, 38, 2.8, 18, 6.5, 'cobblestone', 0xd5c7b4, 0, true);
  // Boiler Interior Stairwell connecting Mid (X=16, y=0) up into West Apartments (X=32, y=2.8)
  addSlopeRamp(ctx, 20, 0.0, -4, 32, 2.8, -4, 5.2, 'wood_plank', 0x7d5838, 0, true);

  // Apartments Exterior & Interior Walls (with wide open hallways & Balcony overlooking A!)
  addTrimWall(ctx, 32.5, 2.8, 9, 1.6, 4.4, 16, 'terracotta', 0xdfb892);
  addTrimWall(ctx, 32.5, 2.8, -14, 1.6, 4.4, 16, 'terracotta', 0xdfb892);
  addTrimWall(ctx, 53.2, 2.8, -3, 1.6, 4.4, 42, 'terracotta', 0xdfb892);
  // Interior Bedroom divider with wide 4m doorway
  addArchway(ctx, 43, 2.8, 2, 20, 4.8, 4.4, 3.6, 1.2, 'wood_plank', 0x8f6642);
  // Apartments Roof Ceiling & warm hanging lanterns
  addSolidBox(ctx, 43, 7.2, -3, 22, 0.65, 43, 'roof_tile', 0xc97553, 0.76, 0.06, 5, 8, false);
  addTunnelLantern(ctx, 42, 6.6, 10);
  addTunnelLantern(ctx, 42, 6.6, -12);
  addCrate(ctx, 48, 2.8, -8, 1.5, 1.4);

  // Balcony overlooking A-Site Pit & A-Ramp (Z = -24, y=2.8 -> ramp/drop down to Pit y=0.0!)
  addFloorDeck(ctx, 34, 48, -28, -24, 2.8, 'wood_plank', 0x7d5838, 0);
  addSlopeRamp(ctx, 45, 2.8, -28, 45, 0.0, -35, 5.2, 'wood_plank', 0x7d5838, 0, false);

  // A-Site Platform & Graveyard / Truck / Pit (X: +20..+54, Z: -55..-28)
  addFloorDeck(ctx, 20, 42, -55, -36, 0.8, 'cobblestone', 0xdccbb4, 0);
  addSteps(ctx, 20, 0, -45, -1, 0, 8, 0.8, 2.4, 3, 'cobblestone');
  addSteps(ctx, 31, 0, -36, 0, -1, 8, 0.8, 2.4, 3, 'cobblestone');
  addCrate(ctx, 28, 0.8, -45, 1.8, 1.8, 0xffffff, 'crate_military'); // Default A Box
  addCrate(ctx, 33, 0.8, -43, 1.6, 2.1);
  addVehicle(ctx, 23, 0.8, -50, 0x566470, false); // A-Site Truck cover
  addSandbagBarricade(ctx, 46, 0, -49, 4, 2, false); // Graveyard cover
  addTerracottaPot(ctx, 22, 0.8, -38, 1.2);
  addSiteDecal(ctx, 29, 0.8, -42, 'A');

  // =========================================================================
  // 5. FULL WAYPOINT GRAPH
  // =========================================================================
  const waypoints: WaypointNode[] = [
    { id: 't_spawn', x: 0, y: 1.2, z: 48, neighbors: [], tag: 'T' },
    { id: 't_banana_ramp', x: -30, y: 0.6, z: 44, neighbors: [] },
    { id: 'banana_bot', x: -38, y: 0.0, z: 24, neighbors: [] },
    { id: 'banana_car', x: -38, y: 0.2, z: 10, neighbors: [] },
    { id: 'banana_top', x: -38, y: 0.8, z: -8, neighbors: [] },
    { id: 'b_site', x: -37, y: 1.2, z: -24, neighbors: [], tag: 'B' },
    { id: 'b_coffins', x: -45, y: 1.2, z: -44, neighbors: [], tag: 'B' },
    { id: 'b_ruins', x: -23, y: 1.0, z: -36, neighbors: [] },
    { id: 'ct_spawn', x: 0, y: 0.0, z: -48, neighbors: [], tag: 'CT' },
    { id: 'ct_arch', x: -6, y: 0.0, z: -22, neighbors: [] },
    { id: 'mid_quad', x: 0, y: 0.0, z: -4, neighbors: [], tag: 'MID' },
    { id: 'top_mid', x: 0, y: 0.0, z: 22, neighbors: [], tag: 'MID' },
    { id: 'second_mid', x: 24, y: 0.0, z: 24, neighbors: [] },
    { id: 'apts_stairs_s', x: 38, y: 1.4, z: 23, neighbors: [] },
    { id: 'apts_hall', x: 43, y: 2.8, z: 8, neighbors: [] },
    { id: 'apts_boiler', x: 26, y: 1.4, z: -4, neighbors: [] },
    { id: 'apts_balcony', x: 42, y: 2.8, z: -25, neighbors: [] },
    { id: 'a_pit', x: 47, y: 0.0, z: -38, neighbors: [] },
    { id: 'a_short', x: 22, y: 0.0, z: -22, neighbors: [] },
    { id: 'a_site', x: 29, y: 0.8, z: -42, neighbors: [], tag: 'A' },
    { id: 'ct_library', x: 16, y: 0.0, z: -42, neighbors: [] },
  ];

  [
    ['t_spawn', 't_banana_ramp'],
    ['t_banana_ramp', 'banana_bot'],
    ['banana_bot', 'banana_car'],
    ['banana_car', 'banana_top'],
    ['banana_top', 'b_site'],
    ['b_site', 'b_coffins'],
    ['b_site', 'b_ruins'],
    ['b_ruins', 'ct_spawn'],
    ['t_spawn', 'top_mid'],
    ['top_mid', 'mid_quad'],
    ['mid_quad', 'ct_arch'],
    ['ct_arch', 'ct_spawn'],
    ['mid_quad', 'apts_boiler'],
    ['mid_quad', 'a_short'],
    ['a_short', 'a_site'],
    ['t_spawn', 'second_mid'],
    ['second_mid', 'apts_stairs_s'],
    ['apts_stairs_s', 'apts_hall'],
    ['apts_hall', 'apts_boiler'],
    ['apts_hall', 'apts_balcony'],
    ['apts_balcony', 'a_pit'],
    ['a_pit', 'a_site'],
    ['a_site', 'ct_library'],
    ['ct_library', 'ct_spawn'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'T Spawn', x: 0, y: 2.6, z: 48, zone: 'T' },
    { name: 'Banana', x: -38, y: 1.8, z: 6, zone: 'B' },
    { name: 'Bombsite B (Fountain)', x: -37, y: 3.0, z: -34, zone: 'B' },
    { name: 'Ruins / Construction', x: -17, y: 2.0, z: -36, zone: 'B' },
    { name: 'Mid / Arch', x: 0, y: 2.0, z: -4, zone: 'MID' },
    { name: 'Second Mid', x: 24, y: 2.0, z: 24, zone: 'MID' },
    { name: 'A Apartments / Balcony', x: 42, y: 4.5, z: -12, zone: 'A' },
    { name: 'Bombsite A / Pit', x: 32, y: 2.4, z: -42, zone: 'A' },
    { name: 'CT Spawn / Library', x: 4, y: 2.0, z: -48, zone: 'CT' },
  ];

  return {
    id: 'de_inferno',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-8, 1.2, 49),
      new THREE.Vector3(-3, 1.2, 50),
      new THREE.Vector3(3, 1.2, 50),
      new THREE.Vector3(8, 1.2, 49),
      new THREE.Vector3(0, 1.2, 46),
    ],
    ctSpawns: [
      new THREE.Vector3(-5, 0, -49),
      new THREE.Vector3(0, 0, -51),
      new THREE.Vector3(5, 0, -50),
      new THREE.Vector3(-3, 0, -45),
      new THREE.Vector3(7, 0, -48),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 1.2, 48),
      new THREE.Vector3(0, 0, -48),
      new THREE.Vector3(-37, 1.2, -24),
      new THREE.Vector3(29, 0.8, -42),
      new THREE.Vector3(43, 2.8, 6),
      new THREE.Vector3(0, 0, 12),
    ],
    bombsites: [
      { label: 'A', x: 29, y: 0.8, z: -42, radius: 6.5 },
      { label: 'B', x: -37, y: 1.2, z: -24, radius: 6.5 },
    ],
    buyZones: [
      { team: 'T', x: 0, z: 48, radius: 14 },
      { team: 'CT', x: 0, z: -48, radius: 13 },
    ],
    waypoints,
    callouts,
    skyColor: 0x8bbde8,
    fogColor: 0xe3cfb8,
    fogDensity: 0.0046,
    sunColor: 0xffe0b2,
    sunIntensity: 1.95,
    sunPos: new THREE.Vector3(48, 72, 32),
    hemiSky: 0xa2cdf0,
    hemiGround: 0x917456,
    hemiIntensity: 0.72,
    surfaceType: 'concrete',
    bounds: { minX: -56, maxX: 56, minZ: -57, maxZ: 57 },
    ambientParticleMode: 'dust',
    menuShowcase: {
      camCenter: new THREE.Vector3(-28, 5.2, -16),
      camOrbitRadius: 16,
      camHeight: 5.8,
      lookAt: new THREE.Vector3(-37, 2.2, -32),
      smokePos: new THREE.Vector3(-37, 1.4, -18),
      tSpots: [
        { pos: [-40, 0.8, -9], yaw: 3.1, cls: 'desert_t', w: 'ak47', crouch: false },
        { pos: [-33, 0.8, -11], yaw: 3.0, cls: 'classic_t', w: 'galil', crouch: true },
        { pos: [-45, 0.4, -3], yaw: 2.9, cls: 'military_t', w: 'awp', crouch: false },
      ],
      ctSpots: [
        { pos: [-36, 1.2, -28], yaw: 0.0, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [-43, 1.2, -36], yaw: -0.25, cls: 'specops_ct', w: 'aug', crouch: false },
        { pos: [-26, 1.2, -34], yaw: 0.35, cls: 'assault_ct', w: 'famas', crouch: true },
      ],
    },
  };
}
