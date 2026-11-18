import * as THREE from 'three';
import { textures } from '../ProceduralTextures';
import {
  addArchway,
  addCrate,
  addDoorwayWall,
  addFloorDeck,
  addFluorescentTube,
  addGroundAndHorizon,
  addIndustrialPipeRun,
  addOilBarrel,
  addPlaneDecal,
  addRedWallLadder,
  addSafetyBollard,
  addSafetyRail,
  addShippingContainer,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addStreetLamp,
  addTrimWall,
  addVehicle,
  BuiltMap,
  linkWaypoints,
  MapBuildContext,
  MapCalloutPin,
  WaypointNode,
} from './shared';

/**
 * Full-scale recreation of CS 1.6 cs_assault (~114m x 116m playable footprint):
 * Nighttime Industrial Street, CT Spawn & Overpass Bridge -> Cargo Yard ->
 * Massive Enterable Multi-Level Warehouse with Main/Back/Side Entrances,
 * 2nd-Tier Interior Catwalk (y=3.4) + Control Room, Walkable Roof (y=6.2),
 * and Rooftop Vent Shaft Drop straight onto the upper catwalk!
 */
export function buildAssaultFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x1b2430, 0x425368, 0x677c94);
  addGroundAndHorizon(ctx, 114, 116, 'asphalt', 0x495059, 'brick', 0x614a40, 8.8, 'urban');

  // =========================================================================
  // 1. NIGHT URBAN STREET, CARGO YARD & CT SPAWN (South: Z +14..+56)
  // =========================================================================
  addPlaneDecal(ctx, 0, 0.025, 36, 92, 1.5, textures.createRoadStripeTexture(), 0, -Math.PI / 2);
  addVehicle(ctx, -12, 0, 34, 0x707880, false);
  addVehicle(ctx, 24, 0, 32, 0x3b4856, true);
  addShippingContainer(ctx, -32, 0, 32, 8.4, 3.0, 3.4, 'container_red', true);
  addShippingContainer(ctx, -32, 3.0, 32, 8.4, 3.0, 3.4, 'container_red', true);
  addShippingContainer(ctx, 12, 0, 24, 8.0, 3.0, 3.4, 'container_blue', false);
  addCrate(ctx, -18, 0, 22, 1.8, 1.8, 0xffffff, 'crate_military');
  addOilBarrel(ctx, 5, 0, 22, 0x3b593d);
  addStreetLamp(ctx, -22, 0, 28, 0xffaa44);
  addStreetLamp(ctx, 20, 0, 28, 0xffaa44);
  addStreetLamp(ctx, -6, 0, 48, 0xffaa44);

  // =========================================================================
  // 2. MASSIVE ENTERABLE MULTI-LEVEL WAREHOUSE (X -36..+36, Z -46..+12)
  // =========================================================================
  // South Facade with 10m Main Roller Entrance + Side Personnel Door
  addArchway(ctx, 0, 0, 12, 72, 10.5, 6.4, 4.6, 1.8, 'corrugated_metal', 0x566270);
  addPlaneDecal(ctx, -16, 4.8, 13.0, 5.4, 1.6, textures.createTrainSignTexture('WAREHOUSE 04', '#265c37', '#f0f4f0'), 0);
  addSolidBox(ctx, 0, 5.2, 12, 11.2, 0.4, 2.2, 'hazard', 0xffffff, 0.6, 0.2, 4, 1, false);
  addSafetyBollard(ctx, -6.5, 0, 14.5);
  addSafetyBollard(ctx, 6.5, 0, 14.5);

  // West & East Side Walls with Side Access Doorways + North Back Wall with Back Door
  addDoorwayWall(ctx, -36, 0, -17, 58, 5.4, 6.4, 4.2, 1.8, 'corrugated_metal', 0x525d6b, true, 0);
  addDoorwayWall(ctx, 36, 0, -17, 58, 5.4, 6.4, 4.2, 1.8, 'corrugated_metal', 0x525d6b, true, 6);
  addDoorwayWall(ctx, 0, 0, -46, 72, 6.2, 6.4, 4.4, 1.8, 'corrugated_metal', 0x4f5a68, false, -14);

  // Ground-floor Interior Containers, Crates & Overhead Pipes
  addShippingContainer(ctx, -18, 0, -10, 8.2, 3.2, 3.5, 'container_blue', true);
  addShippingContainer(ctx, 16, 0, -18, 8.2, 3.2, 3.5, 'container_red', true);
  addCrate(ctx, 0, 0, -8, 1.9, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, -6, 0, -24, 1.8, 1.7);
  addOilBarrel(ctx, 10, 0, -4, 0x3b593d);
  addIndustrialPipeRun(ctx, -16, 5.6, -18, 42, false, 0x4e5863, 0.34);
  addIndustrialPipeRun(ctx, 16, 5.6, -18, 42, false, 0x4e5863, 0.34);
  addFluorescentTube(ctx, -18, 5.7, -20, false);
  addFluorescentTube(ctx, 18, 5.7, -20, false);
  addFluorescentTube(ctx, 0, 5.7, -34, false);

  // 2nd-Tier Interior Catwalk & Control Room (y=3.4)
  addFloorDeck(ctx, -34, 34, -44, -32, 3.4, 'metal', 0x5b646e, 3.0);
  addFloorDeck(ctx, -34, -24, -32, -8, 3.4, 'metal', 0x5b646e, 3.0);
  addFloorDeck(ctx, 24, 34, -32, -8, 3.4, 'metal', 0x5b646e, 3.0);
  // Stairs up to 2nd floor on both West and East sides
  addSlopeRamp(ctx, -29, 0.0, 2, -29, 3.4, -8, 4.8, 'metal', 0x626b75, 0, false);
  addSlopeRamp(ctx, 29, 0.0, 2, 29, 3.4, -8, 4.8, 'metal', 0x626b75, 0, false);
  addSafetyRail(ctx, 0, 3.4, -32.2, 46, true);
  addSafetyRail(ctx, -24.2, 3.4, -20, 22, false);
  addSafetyRail(ctx, 24.2, 3.4, -20, 22, false);

  // Hostage / T Control Office on Upper Back Catwalk (y=3.4)
  addDoorwayWall(ctx, 4, 3.4, -36, 22, 4.4, 2.8, 2.4, 0.8, 'concrete', 0x8a929a, false, 0);
  addSiteDecal(ctx, 4, 3.4, -40, 'A');
  addSiteDecal(ctx, -16, 0, -24, 'B');

  // =========================================================================
  // 3. WALKABLE WAREHOUSE ROOF (y=6.4) + EXTERIOR STAIRS + VENT DROP SHAFT!
  // =========================================================================
  // Exterior West Steel Staircase from Street (y=0) up to Warehouse Roof (y=6.4)
  addFloorDeck(ctx, -46, -37, -14, 10, 3.4, 'metal', 0x58626c, 0);
  addSlopeRamp(ctx, -41.5, 0.0, 24, -41.5, 3.4, 10, 5.0, 'metal', 0x626c76, 0, true);
  addSlopeRamp(ctx, -41.5, 3.4, -14, -41.5, 6.4, -26, 5.0, 'metal', 0x626c76, 3.4, true);
  addFloorDeck(ctx, -46, -37, -36, -26, 6.4, 'metal', 0x58626c, 0);

  // Walkable Roof Perimeter Ring around Central Skylight/Vent Opening
  addFloorDeck(ctx, -37, 37, -47, -26, 6.4, 'corrugated_metal', 0x4d5763, 6.0);
  addFloorDeck(ctx, -37, -10, -26, 13, 6.4, 'corrugated_metal', 0x4d5763, 6.0);
  addFloorDeck(ctx, 10, 37, -26, 13, 6.4, 'corrugated_metal', 0x4d5763, 6.0);
  addRedWallLadder(ctx, -20, 0, 13.0, 6.4, 'z+');
  addCrate(ctx, -22, 6.4, -10, 1.8, 1.4);
  addCrate(ctx, 20, 6.4, -28, 1.8, 1.4, 0xffffff, 'crate_military');

  // Roof Vent Shaft Access Ramp descending cleanly from Roof (y=6.4) -> Interior Upper Catwalk (y=3.4)
  addSlopeRamp(ctx, 18, 6.4, -26, 18, 3.4, -36, 4.6, 'metal', 0x6e7882, 3.4, true);
  addStreetLamp(ctx, 0, 0, -20, 0x99ccff);

  const waypoints: WaypointNode[] = [
    { id: 'ct_spawn', x: 0, y: 0, z: 46, neighbors: [], tag: 'CT' },
    { id: 'yard_front', x: 0, y: 0, z: 22, neighbors: [] },
    { id: 'main_door', x: 0, y: 0, z: 10, neighbors: [], tag: 'MID' },
    { id: 'wh_center', x: 0, y: 0, z: -14, neighbors: [] },
    { id: 'site_b', x: -16, y: 0, z: -24, neighbors: [], tag: 'B' },
    { id: 'west_alley', x: -42, y: 0, z: 26, neighbors: [] },
    { id: 'west_side_door', x: -36, y: 0, z: -17, neighbors: [] },
    { id: 'east_side_door', x: 36, y: 0, z: -11, neighbors: [] },
    { id: 'catwalk_w', x: -29, y: 3.4, z: -20, neighbors: [] },
    { id: 'catwalk_e', x: 29, y: 3.4, z: -20, neighbors: [] },
    { id: 'site_a', x: 4, y: 3.4, z: -40, neighbors: [], tag: 'A' },
    { id: 't_spawn', x: -12, y: 3.4, z: -40, neighbors: [], tag: 'T' },
    { id: 'roof_w', x: -24, y: 6.4, z: -28, neighbors: [] },
    { id: 'roof_vent', x: 18, y: 6.4, z: -24, neighbors: [] },
  ];
  [
    ['ct_spawn', 'yard_front'],
    ['ct_spawn', 'west_alley'],
    ['yard_front', 'main_door'],
    ['main_door', 'wh_center'],
    ['wh_center', 'site_b'],
    ['site_b', 'west_side_door'],
    ['west_alley', 'roof_w'],
    ['roof_w', 'roof_vent'],
    ['roof_vent', 'catwalk_e'],
    ['wh_center', 'east_side_door'],
    ['wh_center', 'catwalk_w'],
    ['wh_center', 'catwalk_e'],
    ['catwalk_w', 't_spawn'],
    ['catwalk_e', 'site_a'],
    ['t_spawn', 'site_a'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'CT Street', x: 0, y: 1.5, z: 46, zone: 'CT' },
    { name: 'Cargo Yard', x: -16, y: 1.5, z: 26, zone: 'CT' },
    { name: 'Main Warehouse Door', x: 0, y: 1.5, z: 12, zone: 'MID' },
    { name: 'Warehouse Floor (B)', x: -16, y: 1.5, z: -24, zone: 'B' },
    { name: 'Upper Catwalk', x: 29, y: 4.8, z: -20, zone: 'MID' },
    { name: 'Roof & Vent', x: 18, y: 7.8, z: -24, zone: 'MID' },
    { name: 'Control Office (A)', x: 4, y: 4.8, z: -40, zone: 'A' },
    { name: 'T Spawn', x: -12, y: 4.8, z: -40, zone: 'T' },
  ];

  return {
    id: 'cs_assault',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-16, 3.4, -40),
      new THREE.Vector3(-12, 3.4, -41),
      new THREE.Vector3(-8, 3.4, -40),
      new THREE.Vector3(-14, 3.4, -37),
      new THREE.Vector3(-10, 3.4, -37),
    ],
    ctSpawns: [
      new THREE.Vector3(-6, 0, 46),
      new THREE.Vector3(0, 0, 46),
      new THREE.Vector3(6, 0, 46),
      new THREE.Vector3(-3, 0, 43),
      new THREE.Vector3(3, 0, 43),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 0, 46),
      new THREE.Vector3(-12, 3.4, -40),
      new THREE.Vector3(-16, 0, -24),
      new THREE.Vector3(4, 3.4, -40),
      new THREE.Vector3(-24, 6.4, -28),
      new THREE.Vector3(0, 0, -14),
    ],
    bombsites: [
      { label: 'A', x: 4, y: 3.4, z: -40, radius: 6.2 },
      { label: 'B', x: -16, y: 0, z: -24, radius: 6.4 },
    ],
    buyZones: [
      { team: 'T', x: -12, z: -40, radius: 11 },
      { team: 'CT', x: 0, z: 45, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0x2c3847,
    fogColor: 0x3b4859,
    fogDensity: 0.0068,
    sunColor: 0xb0c9e8,
    sunIntensity: 1.45,
    sunPos: new THREE.Vector3(-40, 62, 42),
    hemiSky: 0x6f859e,
    hemiGround: 0x353b42,
    hemiIntensity: 0.82,
    surfaceType: 'metal',
    bounds: { minX: -56, maxX: 56, minZ: -57, maxZ: 57 },
    ambientParticleMode: 'sparks',
    menuShowcase: {
      camCenter: new THREE.Vector3(6, 5.2, 24),
      camOrbitRadius: 16,
      camHeight: 5.5,
      lookAt: new THREE.Vector3(-2, 1.5, 12),
      smokePos: new THREE.Vector3(0, 0.2, 14),
      tSpots: [
        { pos: [-3, 0, 6], yaw: 3.1, cls: 'classic_t', w: 'ak47', crouch: false },
        { pos: [3, 0, 8], yaw: 3.0, cls: 'urban_t', w: 'mac10', crouch: true },
        { pos: [-1, 0, 3], yaw: 3.14, cls: 'military_t', w: 'galil', crouch: false },
      ],
      ctSpots: [
        { pos: [-5, 0, 24], yaw: 0, cls: 'urban_ct', w: 'mp5', crouch: true },
        { pos: [6, 0, 24], yaw: -0.2, cls: 'classic_ct', w: 'm4a1', crouch: false },
        { pos: [1, 0, 21], yaw: 0.1, cls: 'assault_ct', w: 'famas', crouch: true },
      ],
    },
  };
}
