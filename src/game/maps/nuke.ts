import * as THREE from 'three';
import {
  addArchway,
  addBunkerBlastDoor,
  addCrate,
  addDoorwayWall,
  addFloorDeck,
  addFluorescentTube,
  addGroundAndHorizon,
  addIndustrialPipeRun,
  addOilBarrel,
  addPineTree,
  addRedWallLadder,
  addSafetyBollard,
  addSafetyRail,
  addShippingContainer,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addTrimWall,
  addVehicle,
  BuiltMap,
  linkWaypoints,
  MapBuildContext,
  MapCalloutPin,
  WaypointNode,
} from './shared';

/**
 * Full-scale recreation of CS 1.6 de_nuke (~112m x 114m) with TRUE stacked geometry:
 * - Upper Level (y=5.2): T-Spawn Bunker, Silo Yard, Catwalk, Lobby, Hut, Squeaky, Upper A Site, Heaven, CT Spawn
 * - Lower Level (y=0.0): Lower B Reactor Chamber directly underneath A Site, Ramp Room & Secret Stairs descending physically down!
 */
export function buildNukeFullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x5c8ab8, 0xc3d0dc, 0xeef3f7);
  addGroundAndHorizon(ctx, 114, 116, 'asphalt', 0x626a72, 'cliff_rock', 0x735243, 11.5, 'canyon');

  // =========================================================================
  // 1. LOWER LEVEL: BOMBSITE B REACTOR CHAMBER (X: -22..+26, Z: -26..+16, y=0.0)
  //    Literally beneath Upper Bombsite A (slab spans y=4.6..5.2)!
  // =========================================================================
  // Industrial underground reactor hall floor is y=0.0 (already backed by plane; reinforce concrete floor slab)
  addFloorDeck(ctx, -28, 34, -30, 22, 0.15, 'concrete', 0x6c737a, 0);
  // Reactor Hall North/South underground walls
  addTrimWall(ctx, 2, 0.15, -27, 58, 4.5, 2.0, 'concrete', 0x626a72);
  addTrimWall(ctx, 2, 0.15, 19, 58, 4.5, 2.0, 'concrete', 0x626a72);
  // Twin glowing blue reactor tanks on Lower B Site
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x3b86b8,
    emissive: 0x1a5680,
    emissiveIntensity: 0.72,
    roughness: 0.35,
    metalness: 0.6,
  });
  [-8, 8].forEach((rx) => {
    const core = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3.8, 18), coreMat);
    core.position.set(rx, 2.05, -5);
    core.castShadow = ctx.shadows;
    core.receiveShadow = ctx.shadows;
    ctx.group.add(core);
    ctx.raycastMeshes.push(core);
    ctx.colliders.push({
      minX: rx - 2.3,
      maxX: rx + 2.3,
      minY: 0.15,
      maxY: 4.0,
      minZ: -7.3,
      maxZ: -2.7,
    });
  });
  addCrate(ctx, -15, 0.15, 7, 1.6, 1.6, 0xffffff, 'crate_military');
  addCrate(ctx, 16, 0.15, -15, 1.7, 1.7);
  addIndustrialPipeRun(ctx, 0, 3.85, -18, 42, true, 0xd4a438, 0.25);
  addFluorescentTube(ctx, -8, 4.35, -14, false);
  addFluorescentTube(ctx, 8, 4.35, 6, false);
  addSiteDecal(ctx, 0, 0.16, 4, 'B');

  // RAMP ROOM (West side X: -44..-20, Z: -18..+12) sloping physically UP from Lower B (0.15) to Upper Level (5.2)!
  addSlopeRamp(ctx, -20, 0.15, -4, -40, 5.2, -4, 14, 'concrete', 0x7b828a, 0, true);
  addTrimWall(ctx, -31, 0, -14, 24, 9.8, 2.0, 'concrete', 0x626a72);
  addTrimWall(ctx, -31, 0, 6, 24, 9.8, 2.0, 'concrete', 0x626a72);
  addCrate(ctx, -32, 3.0, -7, 1.5, 1.5, 0xffffff, 'crate_military');

  // SECRET STAIRS CORRIDOR (East side X: +24..+50, Z: -4..+28) descending from Outside Yard (5.2) to Lower B (0.15)!
  addFloorDeck(ctx, 24, 34, -10, 2, 0.15, 'concrete', 0x6c737a, 0);
  addSlopeRamp(ctx, 26, 0.15, 0, 44, 5.2, 20, 8.5, 'concrete', 0x707780, 0, true);
  addFluorescentTube(ctx, 35, 6.2, 10, true);

  // =========================================================================
  // 2. UPPER LEVEL DECKS (Elevation: y=5.2) & EXTERIOR SILO YARD
  // =========================================================================
  // T-Spawn South Bunker Plaza (X: -54..+54, Z: +26..+56, y=5.2)
  addFloorDeck(ctx, -54, 54, 26, 56, 5.2, 'asphalt', 0x5c636b, 0);
  addBunkerBlastDoor(ctx, 0, 5.2, 54.5, 9.5, 6.2, Math.PI);
  addPineTree(ctx, -45, 5.2, 46, 1.25);
  addPineTree(ctx, -34, 5.2, 50, 1.1);
  addSafetyBollard(ctx, -18, 5.2, 39);
  addSafetyBollard(ctx, 18, 5.2, 39);
  addCrate(ctx, -20, 5.2, 44, 1.7, 1.6);

  // Outside Yard East (X: +26..+54, Z: -54..+26, y=5.2)
  // Leave cutout X: +36..+48, Z: +8..+24 open for Secret Stairs descent!
  addFloorDeck(ctx, 26, 54, -54, 8, 5.2, 'asphalt', 0x626a72, 0);
  addFloorDeck(ctx, 26, 36, 8, 26, 5.2, 'asphalt', 0x626a72, 0);
  addFloorDeck(ctx, 48, 54, 8, 26, 5.2, 'asphalt', 0x626a72, 0);
  // Iconic Yard Silo, Red Container, Blue Main Container & Twinkie
  addShippingContainer(ctx, 36, 5.2, -10, 7.6, 2.8, 2.8, 'container_red', false);
  addShippingContainer(ctx, 47, 5.2, -26, 7.6, 2.8, 2.8, 'container_blue', true);
  const silo = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 9.5, 22),
    ctx.materials.get('corrugated_metal:2:2:16777215:0.45:0.65:0.85') ||
      new THREE.MeshStandardMaterial({ color: 0xb5bcc4, roughness: 0.42, metalness: 0.62 })
  );
  silo.position.set(47, 5.2 + 4.75, 2);
  silo.castShadow = ctx.shadows;
  silo.receiveShadow = ctx.shadows;
  ctx.group.add(silo);
  ctx.raycastMeshes.push(silo);
  ctx.colliders.push({ minX: 43.8, maxX: 50.2, minY: 5.2, maxY: 14.7, minZ: -1.2, maxZ: 5.2 });
  addRedWallLadder(ctx, 43.7, 5.2, 2, 9.2, 'x-');
  addSafetyRail(ctx, 47, 5.2, 16, 8, false, true);

  // CT Spawn North Yard (X: -54..+26, Z: -56..-26, y=5.2)
  addFloorDeck(ctx, -54, 26, -56, -26, 5.2, 'asphalt', 0x5c636b, 0);
  addVehicle(ctx, -18, 5.2, -46, 0x3b4d63, false);
  addCrate(ctx, 6, 5.2, -42, 1.8, 1.8, 0xffffff, 'crate_military');
  addPineTree(ctx, -46, 5.2, -46, 1.25);

  // =========================================================================
  // 3. UPPER NUCLEAR BUILDING: LOBBY, HUT, SQUEAKY, A-SITE & HEAVEN (y=5.2!)
  // =========================================================================
  // Ceiling slab of Lower B doubles as Upper A Site Floor! (X: -22..+26, Z: -26..+26, topY = 5.2, bottomY = 4.6)
  addFloorDeck(ctx, -22, 26, -26, 26, 5.2, 'concrete', 0x7b828a, 4.6);
  // West Upper Deck beside Ramp Room top (X: -54..-36, Z: -26..+26, y=5.2)
  addFloorDeck(ctx, -54, -36, -26, 26, 5.2, 'concrete', 0x707780, 0);

  // T-Lobby South Wall (Z = 26) with wide Lobby Entrance Doors
  addDoorwayWall(ctx, 2, 5.2, 26, 48, 8.0, 5.8, 4.2, 1.8, 'concrete', 0x707882, false, 0);
  // Dividing wall between Lobby (Z=+12..+26) and Upper A-Site (Z=-18..+12)
  // With Squeaky Door opening (X=-8, gap 3.8m) & Hut / Radio passage (X=+8)
  addDoorwayWall(ctx, 2, 5.2, 12, 46, 4.0, 5.6, 3.8, 1.4, 'corrugated_metal', 0x59738c, false, -10);
  // Interior Wooden Hut on A-Site (enterable from South Lobby & exiting East onto A-Site!)
  addSolidBox(ctx, 9, 5.2, 8.5, 6.2, 0.25, 6.2, 'wood_plank', 0x826040, 0.8, 0.05);
  addTrimWall(ctx, 6.2, 5.2, 8.5, 0.6, 3.2, 6.2, 'wood_plank', 0x826040);
  addSolidBox(ctx, 9, 8.4, 8.5, 6.4, 0.4, 6.4, 'metal', 0x454c54, 0.5, 0.6, 2, 2, false);

  // East Reactor Wall (X = +26) separating Upper A Site from Outside Yard (Main Doorway Z=-12, Mini Doorway Z=-22)
  addDoorwayWall(ctx, 26, 5.2, -2, 48, 6.4, 6.2, 4.2, 1.8, 'corrugated_metal', 0x62778c, true, -10);
  // North Reactor Wall (Z = -26) opening toward CT Hell/Garage & Ramp
  addDoorwayWall(ctx, 2, 5.2, -26, 48, 6.8, 6.2, 4.2, 1.8, 'concrete', 0x6d757f, false, -6);

  // Upper A-Site Central Twin Reactor Caps & Military Crates
  addSolidBox(ctx, 0, 5.2, -4, 4.6, 3.2, 4.6, 'metal', 0xb84032, 0.45, 0.55, 2, 2);
  addSolidBox(ctx, 11, 5.2, -4, 4.2, 2.8, 4.2, 'hazard', 0xebb63b, 0.48, 0.3, 2, 2);
  addCrate(ctx, -9, 5.2, -9, 1.7, 1.7, 0xffffff, 'crate_military');
  addOilBarrel(ctx, 18, 5.2, -14, 0x3b593d);
  addSiteDecal(ctx, 5, 5.2, -4, 'A');

  // Heaven Catwalk overlooking Upper A-Site (Z = -22, y=8.4) + Ramp from CT North
  addFloorDeck(ctx, -18, 22, -25, -19, 8.4, 'metal', 0x4b535c, 8.0);
  addSlopeRamp(ctx, -18, 8.4, -22, -32, 5.2, -22, 4.5, 'metal', 0x4b535c, 5.2, false);
  addSafetyRail(ctx, 2, 8.4, -19.2, 38, true, true);
  // Reactor Hall High Roof Skylights & Pipes
  addIndustrialPipeRun(ctx, 0, 10.6, -4, 44, true, 0x708090, 0.28);
  addFluorescentTube(ctx, -2, 10.8, 2, false);
  addFluorescentTube(ctx, 10, 10.8, -12, false);

  // =========================================================================
  // 4. WAYPOINT GRAPH (True 2-Floor Stacked 3D Navigation)
  // =========================================================================
  const waypoints: WaypointNode[] = [
    { id: 't_spawn', x: 0, y: 5.2, z: 44, neighbors: [], tag: 'T' },
    { id: 't_lobby', x: 0, y: 5.2, z: 20, neighbors: [] },
    { id: 'a_squeaky', x: -8, y: 5.2, z: 10, neighbors: [] },
    { id: 'a_hut', x: 9, y: 5.4, z: 8, neighbors: [] },
    { id: 'a_site', x: 5, y: 5.2, z: -8, neighbors: [], tag: 'A' },
    { id: 'a_main', x: 24, y: 5.2, z: -12, neighbors: [] },
    { id: 'yard_s', x: 36, y: 5.2, z: 22, neighbors: [], tag: 'MID' },
    { id: 'yard_n', x: 38, y: 5.2, z: -22, neighbors: [], tag: 'MID' },
    { id: 'ct_spawn', x: 0, y: 5.2, z: -42, neighbors: [], tag: 'CT' },
    { id: 'ct_garage', x: -4, y: 5.2, z: -24, neighbors: [] },
    { id: 'ramp_top', x: -38, y: 5.2, z: -4, neighbors: [] },
    { id: 'ramp_mid', x: -29, y: 2.6, z: -4, neighbors: [] },
    { id: 'b_site', x: 0, y: 0.15, z: 2, neighbors: [], tag: 'B' },
    { id: 'b_decon', x: 16, y: 0.15, z: -12, neighbors: [], tag: 'B' },
    { id: 'secret_bot', x: 28, y: 0.15, z: 2, neighbors: [] },
    { id: 'secret_top', x: 42, y: 5.2, z: 18, neighbors: [] },
  ];

  [
    ['t_spawn', 't_lobby'],
    ['t_lobby', 'a_squeaky'],
    ['t_lobby', 'a_hut'],
    ['a_squeaky', 'a_site'],
    ['a_hut', 'a_site'],
    ['a_site', 'a_main'],
    ['a_site', 'ct_garage'],
    ['ct_garage', 'ct_spawn'],
    ['a_main', 'yard_n'],
    ['yard_n', 'ct_spawn'],
    ['t_spawn', 'yard_s'],
    ['yard_s', 'yard_n'],
    ['t_lobby', 'ramp_top'],
    ['ct_spawn', 'ramp_top'],
    ['ramp_top', 'ramp_mid'],
    ['ramp_mid', 'b_site'],
    ['b_site', 'b_decon'],
    ['b_decon', 'secret_bot'],
    ['secret_bot', 'secret_top'],
    ['secret_top', 'yard_s'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'T Spawn Bunker', x: 0, y: 7.0, z: 44, zone: 'T' },
    { name: 'Lobby & Hut', x: 2, y: 7.0, z: 16, zone: 'MID' },
    { name: 'Bombsite A (Upper)', x: 5, y: 7.2, z: -6, zone: 'A' },
    { name: 'Ramp Room', x: -30, y: 5.0, z: -4, zone: 'MID' },
    { name: 'Bombsite B (Lower)', x: 0, y: 2.0, z: 2, zone: 'B' },
    { name: 'Outside Yard & Silo', x: 40, y: 7.5, z: -6, zone: 'MID' },
    { name: 'Secret Stairs', x: 38, y: 4.5, z: 14, zone: 'B' },
    { name: 'CT Spawn', x: 0, y: 7.0, z: -42, zone: 'CT' },
  ];

  return {
    id: 'de_nuke',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-8, 5.2, 44),
      new THREE.Vector3(-3, 5.2, 46),
      new THREE.Vector3(3, 5.2, 46),
      new THREE.Vector3(8, 5.2, 44),
      new THREE.Vector3(0, 5.2, 41),
    ],
    ctSpawns: [
      new THREE.Vector3(-8, 5.2, -43),
      new THREE.Vector3(-2, 5.2, -45),
      new THREE.Vector3(4, 5.2, -45),
      new THREE.Vector3(10, 5.2, -42),
      new THREE.Vector3(0, 5.2, -39),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 5.2, 42),
      new THREE.Vector3(0, 5.2, -42),
      new THREE.Vector3(5, 5.2, -6),
      new THREE.Vector3(0, 0.15, 2),
      new THREE.Vector3(38, 5.2, -8),
      new THREE.Vector3(-36, 5.2, -4),
    ],
    bombsites: [
      { label: 'A', x: 5, y: 5.2, z: -4, radius: 7.0 },
      { label: 'B', x: 0, y: 0.15, z: 2, radius: 7.0 },
    ],
    buyZones: [
      { team: 'T', x: 0, z: 44, radius: 14 },
      { team: 'CT', x: 0, z: -43, radius: 14 },
    ],
    waypoints,
    callouts,
    skyColor: 0x90aec9,
    fogColor: 0xbcc8d4,
    fogDensity: 0.0042,
    sunColor: 0xf4f0e8,
    sunIntensity: 1.75,
    sunPos: new THREE.Vector3(44, 72, 24),
    hemiSky: 0x9fb8cf,
    hemiGround: 0x4b5561,
    hemiIntensity: 0.8,
    surfaceType: 'metal',
    bounds: { minX: -55, maxX: 55, minZ: -57, maxZ: 57 },
    ambientParticleMode: 'sparks',
    menuShowcase: {
      camCenter: new THREE.Vector3(40, 10.5, 10),
      camOrbitRadius: 18,
      camHeight: 11.2,
      lookAt: new THREE.Vector3(36, 7.2, -10),
      smokePos: new THREE.Vector3(34, 5.4, -2),
      tSpots: [
        { pos: [28, 5.2, 20], yaw: 3.1, cls: 'urban_t', w: 'ak47', crouch: false },
        { pos: [30, 5.2, 14], yaw: 3.2, cls: 'military_t', w: 'awp', crouch: true },
        { pos: [29, 5.2, 6], yaw: 2.9, cls: 'classic_t', w: 'sg552', crouch: false },
      ],
      ctSpots: [
        { pos: [33, 5.2, -16], yaw: 0.1, cls: 'specops_ct', w: 'm4a1', crouch: true },
        { pos: [43, 5.2, -20], yaw: -0.25, cls: 'classic_ct', w: 'aug', crouch: false },
        { pos: [25, 5.2, -12], yaw: 0.25, cls: 'assault_ct', w: 'famas', crouch: false },
      ],
    },
  };
}
