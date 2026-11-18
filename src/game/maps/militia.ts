import * as THREE from 'three';
import {
  addArchway,
  addCafeBistroSet,
  addCrate,
  addDoorwayWall,
  addFloorDeck,
  addFluorescentTube,
  addGroundAndHorizon,
  addHedgeRow,
  addMarketAwning,
  addOilBarrel,
  addPineTree,
  addSafetyRail,
  addSandbagBarricade,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
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
 * Full-scale recreation of CS 1.6 cs_militia (~116m x 116m playable footprint):
 * Countryside Canyon Courtyard (y=2.4) over a walkable Underground Sewer Tunnel Network (y=0.0):
 * CT Canyon Spawn -> Front Yard & SWAT APC -> Enterable 2-Story Farmhouse & Attic Balcony (y=5.4) ->
 * Red Wooden Barn & Garage -> Backyard / Shed & Sewer Access -> T Villa Rear Patio.
 */
export function buildMilitiaFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x4b7cb5, 0xcfd6d9, 0xf2f4f5);
  addGroundAndHorizon(ctx, 116, 116, 'cracked_earth', 0xa6896b, 'cliff_rock', 0x9c725a, 8.8, 'canyon');

  // =========================================================================
  // 1. CANYON GROUND TERRACE (y=2.4) WITH SEWER MANHOLE RAMPS (y=0.0)
  // =========================================================================
  // Sewer runs along X: -26..-14 from Z: -34..+32 at y=0.0!
  addFloorDeck(ctx, -56, 56, 32, 56, 2.4, 'cracked_earth', 0xa6896b, 0); // South CT Canyon
  addFloorDeck(ctx, -56, 56, -56, -34, 2.4, 'cracked_earth', 0xa6896b, 0); // North T Backyard
  addFloorDeck(ctx, -56, -26, -34, 32, 2.4, 'cracked_earth', 0xa6896b, 0); // West Barn & Cliff
  addFloorDeck(ctx, -14, 56, -34, 32, 2.4, 'cracked_earth', 0xa6896b, 0); // Main Yard & Farmhouse

  // Underground Sewer Ramps descending from CT Courtyard (Z:+32->+20) & Backyard Shed (Z:-22->-34)
  addSlopeRamp(ctx, -20, 2.4, 32, -20, 0.0, 20, 10.5, 'concrete', 0x565d63, 0, true);
  addSlopeRamp(ctx, -20, 0.0, -22, -20, 2.4, -34, 10.5, 'concrete', 0x565d63, 0, true);
  addTunnelLantern(ctx, -20, 2.2, 10);
  addTunnelLantern(ctx, -20, 2.2, -10);
  addCrate(ctx, -20, 0, 0, 1.5, 1.4);

  // =========================================================================
  // 2. CT CANYON SPAWN & FRONT YARD (South: Z +28..+52, y=2.4)
  // =========================================================================
  addVehicle(ctx, 10, 2.4, 36, 0x2a3b4f, false); // SWAT Armored Van
  addSandbagBarricade(ctx, -4, 2.4, 30, 4, 2, true, 0x8f806b);
  addPineTree(ctx, -38, 2.4, 42, 1.2);
  addPineTree(ctx, 38, 2.4, 42, 1.15);
  addPineTree(ctx, 42, 2.4, 16, 1.1);
  addStreetLamp(ctx, 2, 2.4, 42, 0xffd28a);

  // =========================================================================
  // 3. ENTERABLE TWO-STORY FARMHOUSE & ATTIC BALCONY (X -4..+32, Z -24..+12)
  // =========================================================================
  // Ground-floor Wood Flooring
  addSolidBox(ctx, 14, 2.41, -6, 34, 0.06, 34, 'wood_plank', 0x8c6742, 0.85, 0.04, 8, 8, false);
  // South Front Porch Wall (wide doorway + flanking shutters)
  addDoorwayWall(ctx, 14, 2.4, 10, 34, 6.2, 6.2, 4.0, 1.6, 'terracotta', 0xd8c3a8, false, 0);
  addWindowShutter(ctx, 2, 5.8, 11.0, false, 0x45634b);
  addWindowShutter(ctx, 26, 5.8, 11.0, false, 0x45634b);
  addMarketAwning(ctx, 14, 6.0, 13.0, 14, 3.6, 0x6b472b, false, true);

  // North Back Door Wall & West/East Side Walls with Garage Access
  addDoorwayWall(ctx, 14, 2.4, -22, 34, 6.2, 6.2, 4.0, 1.6, 'terracotta', 0xd8c3a8, false, 0);
  addDoorwayWall(ctx, -3, 2.4, -6, 32, 5.2, 6.2, 4.0, 1.6, 'terracotta', 0xd8c3a8, true, 0);
  addDoorwayWall(ctx, 31, 2.4, -6, 32, 5.2, 6.2, 4.0, 1.6, 'terracotta', 0xd8c3a8, true, 0);

  // 2nd-Floor Farmhouse Attic / Loft Balcony (y=5.4) + Interior Wood Stairs
  addFloorDeck(ctx, 2, 28, -20, -4, 5.4, 'wood_plank', 0x7d5836, 5.0);
  addSlopeRamp(ctx, 24, 2.4, 6, 24, 5.4, -4, 5.0, 'wood_plank', 0x916a45, 2.4, false);
  addSafetyRail(ctx, 15, 5.4, -4.2, 24, true);
  addFluorescentTube(ctx, 14, 8.2, -12, false);
  addCrate(ctx, 8, 2.4, 0, 1.7, 1.5);
  addSiteDecal(ctx, 14, 5.4, -12, 'A'); // Upper Farmhouse Hostage Room

  // =========================================================================
  // 4. RED WOODEN BARN & GARAGE (West: X -48..-28, Z -16..+18, y=2.4)
  // =========================================================================
  addArchway(ctx, -38, 2.4, 16, 18, 6.4, 5.8, 4.2, 1.8, 'brick', 0x8f4338);
  addArchway(ctx, -38, 2.4, -16, 18, 6.4, 5.8, 4.2, 1.8, 'brick', 0x8f4338);
  addTrimWall(ctx, -47, 2.4, 0, 2.0, 5.8, 32, 'brick', 0x8f4338);
  addCrate(ctx, -42, 2.4, 4, 1.8, 1.7, 0xffffff, 'crate_military');
  addOilBarrel(ctx, -43, 2.4, -6, 0x3b593d);
  addSiteDecal(ctx, -38, 2.4, -4, 'B');

  // =========================================================================
  // 5. BACKYARD POOL TERRACE & T-SPAWN PATIO (North: Z -52..-32, y=2.4)
  // =========================================================================
  addHedgeRow(ctx, -20, 2.4, -38, 12, true);
  addHedgeRow(ctx, 26, 2.4, -38, 12, true);
  addCafeBistroSet(ctx, 24, 2.4, -44);
  addTerracottaPot(ctx, 8, 2.4, -36, 1.3);
  addTerracottaPot(ctx, 20, 2.4, -36, 1.3);

  const waypoints: WaypointNode[] = [
    { id: 'ct_spawn', x: 0, y: 2.4, z: 46, neighbors: [], tag: 'CT' },
    { id: 'sewer_s', x: -20, y: 2.4, z: 36, neighbors: [] },
    { id: 'sewer_mid', x: -20, y: 0.0, z: 0, neighbors: [] },
    { id: 'sewer_n', x: -20, y: 2.4, z: -38, neighbors: [] },
    { id: 'front_yard', x: 14, y: 2.4, z: 22, neighbors: [], tag: 'MID' },
    { id: 'house_ground', x: 14, y: 2.4, z: 0, neighbors: [] },
    { id: 'site_a', x: 14, y: 5.4, z: -12, neighbors: [], tag: 'A' },
    { id: 'barn', x: -38, y: 2.4, z: 0, neighbors: [], tag: 'B' },
    { id: 'backyard', x: 14, y: 2.4, z: -38, neighbors: [] },
    { id: 't_spawn', x: 10, y: 2.4, z: -46, neighbors: [], tag: 'T' },
  ];
  [
    ['ct_spawn', 'front_yard'],
    ['ct_spawn', 'sewer_s'],
    ['ct_spawn', 'barn'],
    ['sewer_s', 'sewer_mid'],
    ['sewer_mid', 'sewer_n'],
    ['sewer_n', 't_spawn'],
    ['sewer_n', 'barn'],
    ['front_yard', 'house_ground'],
    ['house_ground', 'site_a'],
    ['house_ground', 'backyard'],
    ['house_ground', 'barn'],
    ['backyard', 't_spawn'],
    ['barn', 't_spawn'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'CT Canyon', x: 0, y: 4.0, z: 46, zone: 'CT' },
    { name: 'Sewer Tunnel', x: -20, y: 1.5, z: 0, zone: 'MID' },
    { name: 'Front Yard', x: 14, y: 4.0, z: 22, zone: 'MID' },
    { name: 'Barn (B)', x: -38, y: 4.0, z: 0, zone: 'B' },
    { name: 'Farmhouse Loft (A)', x: 14, y: 6.8, z: -12, zone: 'A' },
    { name: 'T Backyard', x: 10, y: 4.0, z: -46, zone: 'T' },
  ];

  return {
    id: 'cs_militia',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(4, 2.4, -46),
      new THREE.Vector3(10, 2.4, -47),
      new THREE.Vector3(16, 2.4, -46),
      new THREE.Vector3(7, 2.4, -43),
      new THREE.Vector3(13, 2.4, -43),
    ],
    ctSpawns: [
      new THREE.Vector3(-6, 2.4, 46),
      new THREE.Vector3(0, 2.4, 47),
      new THREE.Vector3(6, 2.4, 46),
      new THREE.Vector3(-3, 2.4, 43),
      new THREE.Vector3(3, 2.4, 43),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 2.4, 46),
      new THREE.Vector3(10, 2.4, -46),
      new THREE.Vector3(14, 5.4, -12),
      new THREE.Vector3(-38, 2.4, 0),
      new THREE.Vector3(-20, 0, 5),
      new THREE.Vector3(14, 2.4, 22),
    ],
    bombsites: [
      { label: 'A', x: 14, y: 5.4, z: -12, radius: 6.4 },
      { label: 'B', x: -38, y: 2.4, z: 0, radius: 6.4 },
    ],
    buyZones: [
      { team: 'T', x: 10, z: -46, radius: 11 },
      { team: 'CT', x: 0, z: 45, radius: 11 },
    ],
    waypoints,
    callouts,
    skyColor: 0x7b98b2,
    fogColor: 0xc2b9ae,
    fogDensity: 0.0058,
    sunColor: 0xffe6c2,
    sunIntensity: 1.85,
    sunPos: new THREE.Vector3(42, 66, 36),
    hemiSky: 0xa2bed6,
    hemiGround: 0x6b5642,
    hemiIntensity: 0.78,
    surfaceType: 'concrete',
    bounds: { minX: -56, maxX: 56, minZ: -56, maxZ: 56 },
    ambientParticleMode: 'dust',
    menuShowcase: {
      camCenter: new THREE.Vector3(12, 6.8, 24),
      camOrbitRadius: 16,
      camHeight: 7.0,
      lookAt: new THREE.Vector3(14, 4.0, 10),
      smokePos: new THREE.Vector3(14, 2.6, 14),
      tSpots: [
        { pos: [11, 2.4, 6], yaw: 3.1, cls: 'military_t', w: 'ak47', crouch: false },
        { pos: [17, 2.4, 5], yaw: 3.0, cls: 'classic_t', w: 'galil', crouch: true },
      ],
      ctSpots: [
        { pos: [10, 2.4, 22], yaw: 0.1, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [18, 2.4, 21], yaw: -0.1, cls: 'specops_ct', w: 'aug', crouch: false },
      ],
    },
  };
}
