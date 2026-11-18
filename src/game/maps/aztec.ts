import * as THREE from 'three';
import {
  addArchway,
  addCrate,
  addDoorwayWall,
  addDoubleDoors,
  addFloorDeck,
  addGroundAndHorizon,
  addPalmTree,
  addSandbagBarricade,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addTempleBrazier,
  addTerracottaPot,
  addTrimWall,
  addTunnelLantern,
  BuiltMap,
  getMat,
  linkWaypoints,
  MapBuildContext,
  MapCalloutPin,
  WaypointNode,
} from './shared';

/**
 * Full-scale recreation of CS 1.6 de_aztec (~114m x 118m playable footprint):
 * Elevated jungle stone plateaus (y=3.2) bisected by a deep river gorge (y=0.0),
 * walkable wooden Suspension Bridge spanning the gorge, Temple Double Doors,
 * stone ramps down into Water/Riverbed and back up to B-Site & CT/A-Site.
 */
export function buildAztecFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x456b65, 0x8da89b, 0xcbdad1);
  addGroundAndHorizon(ctx, 114, 118, 'moss_stone', 0x7e8870, 'moss_stone', 0x6b755f, 8.8, 'jungle');

  // =========================================================================
  // 1. DEEP RIVER GORGE (Z: -16..+8, Elevation: y=0.0)
  // =========================================================================
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(112, 24),
    getMat(ctx, 'water', 14, 4, 0x2c7480, 0.18, 0.38)
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.05, -4);
  ctx.group.add(water);

  // =========================================================================
  // 2. SOUTH TERRORIST STONE PLATEAU (Z: +8..+58, Elevation: y=3.2)
  // =========================================================================
  // Left & Right South Decks leaving wide River Ramp slot at X: -24..-10
  addFloorDeck(ctx, -56, -24, 8, 58, 3.2, 'moss_stone', 0x828c74, 0);
  addFloorDeck(ctx, -10, 56, 8, 58, 3.2, 'moss_stone', 0x828c74, 0);
  addFloorDeck(ctx, -24, -10, 22, 58, 3.2, 'moss_stone', 0x828c74, 0);
  // T-Side Ramp descending into Riverbed (y=3.2 -> y=0.0)
  addSlopeRamp(ctx, -17, 3.2, 22, -17, 0.0, 7, 13, 'moss_stone', 0x768068, 0, true);

  // T-Spawn Jungle Courtyard & Double Doors Entry Building
  addArchway(ctx, -4, 3.2, 42, 40, 8.0, 6.2, 4.4, 2.4, 'moss_stone', 0x5c6952);
  addSandbagBarricade(ctx, -10, 3.2, 48, 4, 2, true, 0x8b8f74);
  addCrate(ctx, 6, 3.2, 46, 1.8, 1.7);
  addTempleBrazier(ctx, -9, 3.2, 44);
  addTempleBrazier(ctx, 1, 3.2, 44);

  // Iconic Aztec Temple Double Doors Hall (Z: +16..+28, X: -4..+8)
  addDoorwayWall(ctx, -2, 3.2, 18, 22, 6.0, 6.4, 4.4, 2.4, 'moss_stone', 0x5f6d55, false, 0);
  addDoubleDoors(ctx, -2, 3.2, 18, 5.8, 2.5, 4.3, 0x453b2e);
  addTunnelLantern(ctx, -2, 7.2, 18);
  addCrate(ctx, -6, 3.2, 26, 1.7, 1.6);

  // =========================================================================
  // 3. WALKABLE WOODEN SUSPENSION BRIDGE OVER GORGE (X: +22..+30, Z: -18..+10)
  // =========================================================================
  addFloorDeck(ctx, 22.5, 29.5, -17, 9, 3.2, 'wood_plank', 0x7d5b3a, 2.6);
  // Bridge stone piers in riverbed
  addSolidBox(ctx, 26, 0, -13, 6.6, 2.6, 2.4, 'moss_stone', 0x5c6952);
  addSolidBox(ctx, 26, 0, 5, 6.6, 2.6, 2.4, 'moss_stone', 0x5c6952);
  // Rope & timber bridge side posts
  [-15, -9, -3, 3, 7].forEach((bz) => {
    addSolidBox(ctx, 22.7, 3.2, bz, 0.26, 1.2, 0.26, 'wood_plank', 0x593d22);
    addSolidBox(ctx, 29.3, 3.2, bz, 0.26, 1.2, 0.26, 'wood_plank', 0x593d22);
  });
  addCrate(ctx, 26, 3.2, -3, 1.4, 1.25);

  // =========================================================================
  // 4. NORTH PLATEAU: B-SITE (WEST), A-SITE (EAST), CT SPAWN & WATER RAMPS
  // =========================================================================
  // North-West B-Site Plateau (leaving Water Ramp slot at X: -40..-26)
  addFloorDeck(ctx, -56, -40, -58, -16, 3.2, 'moss_stone', 0x828c74, 0);
  addFloorDeck(ctx, -40, -26, -58, -30, 3.2, 'moss_stone', 0x828c74, 0);
  addFloorDeck(ctx, -26, -6, -58, -16, 3.2, 'moss_stone', 0x828c74, 0);
  addSlopeRamp(ctx, -33, 0.0, -15, -33, 3.2, -30, 13, 'moss_stone', 0x768068, 0, true);

  // North-East A-Site & CT Spawn Plateau (leaving East Water Ramp at X: +2..+14)
  addFloorDeck(ctx, -6, 2, -58, -16, 3.2, 'moss_stone', 0x828c74, 0);
  addFloorDeck(ctx, 2, 14, -58, -30, 3.2, 'moss_stone', 0x828c74, 0);
  addFloorDeck(ctx, 14, 56, -58, -16, 3.2, 'moss_stone', 0x828c74, 0);
  addSlopeRamp(ctx, 8, 0.0, -15, 8, 3.2, -30, 11, 'moss_stone', 0x768068, 0, true);

  // Mid Double-Door Overlook Balcony facing River & Bridge
  addArchway(ctx, -2, 3.2, -18, 20, 6.0, 6.2, 4.4, 2.2, 'moss_stone', 0x5c6952);
  addCrate(ctx, -8, 3.2, -24, 1.8, 1.8, 0xffffff, 'crate_military');

  // Bombsite B Stone Temple Ruins (X: -34, Z: -38)
  addTrimWall(ctx, -44, 3.2, -38, 3.2, 6.2, 3.2, 'moss_stone', 0x626e58, 0x79876e);
  addTrimWall(ctx, -24, 3.2, -44, 3.2, 6.2, 3.2, 'moss_stone', 0x626e58, 0x79876e);
  addCrate(ctx, -36, 3.2, -40, 1.9, 1.8);
  addCrate(ctx, -31, 3.2, -35, 1.7, 1.6, 0xffffff, 'crate_military');
  addTempleBrazier(ctx, -28, 3.2, -38);
  addTempleBrazier(ctx, -40, 3.2, -32);
  addSiteDecal(ctx, -34, 3.2, -38, 'B');

  // Bombsite A Sacred Altar & Pillars (X: +32, Z: -34)
  addTrimWall(ctx, 24, 3.2, -38, 3.2, 6.2, 3.2, 'moss_stone', 0x626e58, 0x79876e);
  addTrimWall(ctx, 40, 3.2, -30, 3.2, 6.2, 3.2, 'moss_stone', 0x626e58, 0x79876e);
  addCrate(ctx, 35, 3.2, -36, 1.9, 1.8);
  addCrate(ctx, 29, 3.2, -31, 1.8, 1.7, 0xffffff, 'crate_military');
  addTempleBrazier(ctx, 27, 3.2, -34);
  addTempleBrazier(ctx, 37, 3.2, -34);
  addSiteDecal(ctx, 32, 3.2, -34, 'A');

  // CT Spawn Archway & Defense Cover (X: +2, Z: -48)
  addArchway(ctx, 0, 3.2, -42, 36, 8.0, 6.2, 4.4, 2.2, 'moss_stone', 0x5c6952);
  addSandbagBarricade(ctx, 6, 3.2, -47, 3, 2, true, 0x8b8f74);

  // Riverbed Tactical Cover & Jungle Flora
  addCrate(ctx, -18, 0, -4, 1.8, 1.7);
  addCrate(ctx, 10, 0, -6, 1.8, 1.6, 0xffffff, 'crate_military');
  addPalmTree(ctx, -46, 3.2, 24, 7.6);
  addPalmTree(ctx, 44, 3.2, 22, 7.2);
  addPalmTree(ctx, -48, 3.2, -26, 7.4);
  addPalmTree(ctx, 46, 3.2, -24, 7.0);
  addPalmTree(ctx, -6, 0, -6, 8.2);
  addTerracottaPot(ctx, -26, 3.2, -32, 1.35);
  addTerracottaPot(ctx, 24, 3.2, -28, 1.35);

  const waypoints: WaypointNode[] = [
    { id: 't_spawn', x: -4, y: 3.2, z: 48, neighbors: [], tag: 'T' },
    { id: 't_doors', x: -2, y: 3.2, z: 24, neighbors: [] },
    { id: 't_bridge_south', x: 26, y: 3.2, z: 16, neighbors: [] },
    { id: 'bridge_mid', x: 26, y: 3.2, z: -4, neighbors: [], tag: 'MID' },
    { id: 't_water_ramp', x: -17, y: 1.6, z: 14, neighbors: [] },
    { id: 'river_west', x: -26, y: 0, z: -4, neighbors: [] },
    { id: 'river_east', x: 8, y: 0, z: -4, neighbors: [] },
    { id: 'b_water_ramp', x: -33, y: 1.6, z: -22, neighbors: [] },
    { id: 'a_water_ramp', x: 8, y: 1.6, z: -22, neighbors: [] },
    { id: 'b_site', x: -34, y: 3.2, z: -38, neighbors: [], tag: 'B' },
    { id: 'mid_overlook', x: -2, y: 3.2, z: -24, neighbors: [] },
    { id: 'a_site', x: 32, y: 3.2, z: -34, neighbors: [], tag: 'A' },
    { id: 'ct_spawn', x: 0, y: 3.2, z: -48, neighbors: [], tag: 'CT' },
  ];
  [
    ['t_spawn', 't_doors'],
    ['t_spawn', 't_bridge_south'],
    ['t_bridge_south', 'bridge_mid'],
    ['bridge_mid', 'a_site'],
    ['t_doors', 't_water_ramp'],
    ['t_water_ramp', 'river_west'],
    ['river_west', 'river_east'],
    ['river_west', 'b_water_ramp'],
    ['b_water_ramp', 'b_site'],
    ['river_east', 'a_water_ramp'],
    ['a_water_ramp', 'mid_overlook'],
    ['a_water_ramp', 'a_site'],
    ['b_site', 'mid_overlook'],
    ['mid_overlook', 'ct_spawn'],
    ['a_site', 'ct_spawn'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'T Spawn', x: -4, y: 4.8, z: 48, zone: 'T' },
    { name: 'Double Doors', x: -2, y: 4.8, z: 18, zone: 'T' },
    { name: 'Suspension Bridge', x: 26, y: 5.0, z: -4, zone: 'MID' },
    { name: 'Water Gorge', x: -12, y: 1.5, z: -4, zone: 'MID' },
    { name: 'Bombsite B', x: -34, y: 4.8, z: -38, zone: 'B' },
    { name: 'Bombsite A', x: 32, y: 4.8, z: -34, zone: 'A' },
    { name: 'CT Overlook', x: -2, y: 4.8, z: -24, zone: 'CT' },
    { name: 'CT Spawn', x: 0, y: 4.8, z: -48, zone: 'CT' },
  ];

  return {
    id: 'de_aztec',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-8, 3.2, 48),
      new THREE.Vector3(-4, 3.2, 49),
      new THREE.Vector3(0, 3.2, 48),
      new THREE.Vector3(-6, 3.2, 45),
      new THREE.Vector3(-2, 3.2, 45),
    ],
    ctSpawns: [
      new THREE.Vector3(-4, 3.2, -49),
      new THREE.Vector3(0, 3.2, -50),
      new THREE.Vector3(4, 3.2, -49),
      new THREE.Vector3(-2, 3.2, -46),
      new THREE.Vector3(3, 3.2, -46),
    ],
    dmSpawns: [
      new THREE.Vector3(-4, 3.2, 48),
      new THREE.Vector3(26, 3.2, -8),
      new THREE.Vector3(32, 3.2, -34),
      new THREE.Vector3(-34, 3.2, -38),
      new THREE.Vector3(-12, 0, -4),
      new THREE.Vector3(0, 3.2, -48),
    ],
    bombsites: [
      { label: 'A', x: 32, y: 3.2, z: -34, radius: 6.5 },
      { label: 'B', x: -34, y: 3.2, z: -38, radius: 6.5 },
    ],
    buyZones: [
      { team: 'T', x: -4, z: 47, radius: 11 },
      { team: 'CT', x: 0, z: -48, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0x627d73,
    fogColor: 0x6c877c,
    fogDensity: 0.008,
    sunColor: 0xd9f0dc,
    sunIntensity: 1.75,
    sunPos: new THREE.Vector3(28, 66, 26),
    hemiSky: 0x82a697,
    hemiGround: 0x3b4a33,
    hemiIntensity: 0.78,
    surfaceType: 'concrete',
    bounds: { minX: -56, maxX: 56, minZ: -58, maxZ: 58 },
    ambientParticleMode: 'mist',
    menuShowcase: {
      camCenter: new THREE.Vector3(14, 7.6, -4),
      camOrbitRadius: 15,
      camHeight: 8.2,
      lookAt: new THREE.Vector3(26, 4.8, -4),
      smokePos: new THREE.Vector3(26, 3.4, -4),
      tSpots: [
        { pos: [24.8, 3.2, 2], yaw: 0, cls: 'military_t', w: 'ak47', crouch: false },
        { pos: [27.2, 3.2, 4], yaw: 0.1, cls: 'classic_t', w: 'sg552', crouch: true },
        { pos: [25.5, 3.2, 6], yaw: 0.15, cls: 'desert_t', w: 'deagle', crouch: false },
      ],
      ctSpots: [
        { pos: [24.8, 3.2, -10], yaw: 3.14, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [27.2, 3.2, -12], yaw: 3.0, cls: 'specops_ct', w: 'aug', crouch: false },
        { pos: [25.5, 3.2, -14], yaw: 3.0, cls: 'urban_ct', w: 'awp', crouch: true },
      ],
    },
  };
}
