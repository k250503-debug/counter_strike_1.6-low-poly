import * as THREE from 'three';
import { textures } from '../ProceduralTextures';
import {
  addArchedBlindWindow,
  addArchway,
  addCrate,
  addDoubleDoors,
  addFloorDeck,
  addFluorescentTube,
  addGroundAndHorizon,
  addMarketAwning,
  addOilBarrel,
  addPalmTree,
  addPlaneDecal,
  addSandbagBarricade,
  addShippingContainer,
  addSiteDecal,
  addSkyDome,
  addSlopeRamp,
  addSolidBox,
  addSteps,
  addTerracottaPot,
  addTrimWall,
  addTunnelLantern,
  addVehicle,
  BuiltMap,
  linkWaypoints,
  MapBuildContext,
  MapCalloutPin,
  WaypointNode,
} from './shared';

/**
 * Full-scale recreation of CS 1.6 de_dust2 (~116m x 120m playable footprint)
 * preserving canonical layout proportions, continuous elevation changes,
 * enclosed Long Doors house, vaulted Upper/Lower B Tunnels, Suicide, Catwalk/Short A,
 * sunken Long A Pit, Bombsite A & B, and CT Spawn/Mid.
 */
export function buildDust2FullScale(ctx: MapBuildContext): BuiltMap {
  addSkyDome(ctx, 0x457bc0, 0xeddbc0, 0xfff8ed);
  addGroundAndHorizon(ctx, 118, 124, 'sand', 0xe5cca0, 'sandstone', 0xdac197, 8.8, 'desert');

  // =========================================================================
  // 1. TERRORIST SPAWN TERRACE (Z: +40..+58, X: -26..+24, Elevation: y=3.2)
  // =========================================================================
  addFloorDeck(ctx, -26, 24, 40, 58, 3.2, 'dust_stone_floor', 0xdac49e, 0);
  // T-Spawn South & Side Arches facing Suicide
  addArchway(ctx, 0, 3.2, 40.5, 50, 7.2, 5.4, 4.2, 2.2, 'sandstone', 0xd9c29c);
  addArchedBlindWindow(ctx, -14, 6.9, 39.35, false);
  addArchedBlindWindow(ctx, 14, 6.9, 39.35, false);
  addArchedBlindWindow(ctx, -14, 6.9, 41.65, false);
  addArchedBlindWindow(ctx, 14, 6.9, 41.65, false);
  addMarketAwning(ctx, -15, 6.9, 53, 7.4, 3.6, 0xb8523b, false, true);
  addMarketAwning(ctx, 14, 6.9, 53, 7.4, 3.6, 0x4f7354, false, true);
  addSandbagBarricade(ctx, -9.5, 3.2, 47, 4, 2, true);
  addPalmTree(ctx, -21, 3.2, 52, 6.8);
  addPalmTree(ctx, 20, 3.2, 52, 6.4);
  addCrate(ctx, -5, 3.2, 49, 1.7, 1.6, 0xffffff, 'crate_military');
  addCrate(ctx, 7.5, 3.2, 48, 1.6, 1.6);
  addTerracottaPot(ctx, -19, 3.2, 43, 1.25);
  addTerracottaPot(ctx, 19, 3.2, 43, 1.25);

  // T-Ramp West (down to Outside Tunnels y=1.8) & East (down to Outside Long y=1.8)
  addSlopeRamp(ctx, -26, 3.2, 47, -38, 1.8, 47, 12, 'sand', 0xe5cca0, 0, false);
  addSlopeRamp(ctx, 24, 3.2, 47, 36, 1.8, 47, 12, 'sand', 0xe5cca0, 0, false);
  // Retaining walls framing East/West ramps nicely
  addTrimWall(ctx, -26, 1.8, 55.5, 1.6, 5.2, 5, 'sandstone', 0xd1b88e);
  addTrimWall(ctx, 24, 1.8, 55.5, 1.6, 5.2, 5, 'sandstone', 0xd1b88e);

  // =========================================================================
  // 2. SUICIDE CORRIDOR, TOP MID, MID DOORS & CT MID
  // =========================================================================
  // Suicide ramp descending from T-Spawn (3.2) to Top Mid (2.0)
  addSlopeRamp(ctx, 0, 3.2, 40, 0, 2.0, 24, 7.0, 'sand', 0xe5cca0, 0, true);
  addTrimWall(ctx, -4.6, 0, 32, 2.2, 7.8, 15, 'sandstone', 0xcfb68c);
  addTrimWall(ctx, 4.6, 0, 32, 2.2, 7.8, 15, 'sandstone', 0xcfb68c);

  // Flanking connector decks behind Suicide walls (connecting Outside Tunnels & Outside Long into Top Mid)
  addFloorDeck(ctx, -56, -26, 22, 58, 1.8, 'sand', 0xe5cca0, 0);
  addFloorDeck(ctx, -26, -13, 22, 40, 1.8, 'sand', 0xe5cca0, 0);
  addFloorDeck(ctx, 24, 56, 24, 58, 1.8, 'sand', 0xe5cca0, 0);
  addFloorDeck(ctx, 13, 24, 24, 40, 1.8, 'sand', 0xe5cca0, 0);

  // Top Mid Courtyard (Elevation: y=2.0)
  addFloorDeck(ctx, -13, 13, 12, 25, 2.0, 'sand', 0xe5cca0, 0);
  addCrate(ctx, -6.5, 2.0, 18.5, 1.8, 1.7, 0xffffff, 'crate_military');
  addCrate(ctx, 7.5, 2.0, 17, 1.6, 1.6);
  addPalmTree(ctx, 10.5, 2.0, 21.5, 6.2);
  addSandbagBarricade(ctx, 5.5, 2.0, 14, 3, 2, true);

  // Mid Ramp sloping cleanly from Top Mid (2.0) down to Lower Mid (0.0)
  addSlopeRamp(ctx, 0, 2.0, 12, 0, 0.0, 1, 20, 'sand', 0xe5cca0, 0, false);

  // Mid side walls separating Mid from Upper Tuns (West) and Mid from A-Long (East)
  addTrimWall(ctx, -11.5, 0, 10, 2.4, 7.2, 16, 'sandstone', 0xd1b88e); // South-west Mid wall (gap Z=-10..+2 for Lower Tuns)
  addTrimWall(ctx, -11.5, 0, -10.5, 2.4, 7.2, 7, 'sandstone', 0xd1b88e); // North of Lower Tuns into Mid Doors
  addArchedBlindWindow(ctx, -10.25, 4.4, 9, true);
  addTrimWall(ctx, 11.5, 0, 10.5, 2.4, 7.2, 17, 'sandstone', 0xd1b88e);
  addArchedBlindWindow(ctx, 10.25, 4.4, 10, true);

  // Archways from Top Mid East -> Outside Long and Top Mid West -> Outside Tunnels
  addArchway(ctx, -13, 1.8, 28, 14, 6.8, 6.2, 4.4, 2.2, 'sandstone', 0xd4bb91, Math.PI / 2);
  addArchway(ctx, 13, 1.8, 30, 14, 6.8, 6.2, 4.4, 2.2, 'sandstone', 0xd4bb91, Math.PI / 2);

  // Iconic Mid Xbox & Oil Barrel cover at Mid (y=0.0)
  addCrate(ctx, 2.8, 0, -2.5, 2.1, 1.85, 0xd4b688);
  addSandbagBarricade(ctx, -3.5, 0, 0.5, 3, 2, false);
  addOilBarrel(ctx, -7.8, 0, -4.5, 0x7d3a2e);

  // Mid Double Doors (Z = -14) dividing Mid from CT Mid
  addDoubleDoors(ctx, 0, 0, -14, 20.5, 3.4, 4.6, 0x5c4732);
  addSolidBox(ctx, 0, 5.1, -14, 21.5, 2.4, 1.2, 'sandstone', 0xcfb68c, 0.85, 0.04, 5, 1);

  // =========================================================================
  // 3. CATWALK & SHORT A (X: +5..+24, Z: -45..+2)
  // =========================================================================
  // Mid-to-Catwalk Steps/Ramp (Mid y=0.0 -> Catwalk y=2.4)
  addSlopeRamp(ctx, 8.8, 0.0, 2.5, 8.8, 2.4, -7.5, 5.4, 'dust_stone_floor', 0xd6c29d, 0, false);
  // Catwalk Platform (y=2.4) running beside Mid
  addFloorDeck(ctx, 5.6, 13.5, -24, -7.5, 2.4, 'dust_stone_floor', 0xd6c29d, 0);
  // Retaining wall separating Catwalk from Mid/CT Mid below with peek parapet
  addTrimWall(ctx, 5.2, 2.4, -18, 0.9, 1.1, 13, 'sandstone', 0xc9ac82);
  addMarketAwning(ctx, 9.5, 5.6, -15, 6.8, 4.8, 0xc77d42, false, false);
  // Divider Citadel Wall separating Catwalk from Long A (X: 14..24)
  addTrimWall(ctx, 19, 0, -8, 10.5, 7.6, 36, 'sandstone', 0xcbb086);
  addArchedBlindWindow(ctx, 13.7, 5.2, -16, true);

  // Short A Stairs/Ramp climbing Catwalk (2.4) -> Short A / A-Site (3.2)
  addSlopeRamp(ctx, 9.6, 2.4, -24, 14.5, 3.2, -35, 7.4, 'dust_stone_floor', 0xd6c29d, 0, true);
  // Short A Upper Plateau & Goose Corner approach (y=3.2)
  addFloorDeck(ctx, 9.5, 26, -45, -35, 3.2, 'dust_stone_floor', 0xd9c39e, 0);
  addCrate(ctx, 12.2, 3.2, -38.5, 1.5, 1.5, 0xffffff, 'crate_military');
  // Retaining parapet overlooking CT Mid from Short A
  addTrimWall(ctx, 9.2, 3.2, -39, 1.0, 1.25, 12, 'sandstone', 0xc9ac82);
  addTrimWall(ctx, 16, 3.2, -45.4, 12.5, 1.4, 1.0, 'sandstone', 0xc9ac82);

  // =========================================================================
  // 4. OUTSIDE LONG, LONG DOORS HOUSE, LONG A, SUNKEN PIT & A-RAMP
  // =========================================================================
  // Outside Long Courtyard (y=1.8)
  addPalmTree(ctx, 48, 1.8, 48, 7.0);
  addPalmTree(ctx, 31, 1.8, 35, 6.4);
  addCrate(ctx, 38, 1.8, 35, 1.8, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, 40, 1.8, 35.4, 1.5, 1.5);
  addSandbagBarricade(ctx, 47, 1.8, 34, 4, 2, true);
  addMarketAwning(ctx, 51, 5.4, 38, 6.0, 4.2, 0xb8523b, true, true);

  // Long Doors Interior Building ("Blue Room" / Long House, X: +25..+52, Z: +8..+24, floor y=1.8)
  addFloorDeck(ctx, 25, 56, 8, 24, 1.8, 'dust_stone_floor', 0xd4be98, 0);
  // West wall of Long House
  addTrimWall(ctx, 25.2, 1.8, 16, 2.0, 5.4, 16, 'sandstone', 0xcbb086);
  // South wall with Outer Long Double Doors (X: +35, gap 4.0m)
  addDoubleDoors(ctx, 35, 1.8, 24, 20, 4.0, 4.2, 0x5c4732);
  // Interior partition wall creating the iconic Long Doors peek vestibule
  addTrimWall(ctx, 33, 1.8, 16, 12, 4.6, 1.6, 'sandstone', 0xcbb086);
  addCrate(ctx, 46.5, 1.8, 19.5, 1.7, 1.7);
  addOilBarrel(ctx, 28.5, 1.8, 11.5, 0x3b593d);
  // North wall with Long Double Doors opening straight onto Long A (X: +42, gap 4.2m)
  addDoubleDoors(ctx, 42, 1.8, 8, 28, 4.2, 4.4, 0x5c4732);
  // Enclosed Sandstone Ceiling Roof & Interior Lanterns
  addSolidBox(ctx, 40.5, 6.3, 16, 31, 0.75, 17, 'sandstone', 0xc4a980, 0.86, 0.04, 6, 4, false);
  addTunnelLantern(ctx, 35, 5.85, 20.5);
  addTunnelLantern(ctx, 42, 5.85, 12.0);

  // Long A Street (X: +25..+38 continuous road y=1.6, East pit cutout at X: +38..+56, Z: -18..-4)
  addFloorDeck(ctx, 25, 56, -2, 8, 1.6, 'sand', 0xe5cca0, 0); // Exit apron outside Long Doors
  addFloorDeck(ctx, 25, 38, -28, -2, 1.6, 'sand', 0xe5cca0, 0); // West Long Road past Pit
  // Smooth step down from Long House threshold (1.8) to Long Road (1.6)
  addSlopeRamp(ctx, 42, 1.8, 8, 42, 1.6, 5, 12, 'sand', 0xe5cca0, 0, false);

  // SUNKEN A-LONG PIT (X: +38..+56, Z: -18..-4, sunken floor y=0.0!)
  // Pit South entry slope (y=1.6 -> y=0.0)
  addSlopeRamp(ctx, 46, 1.6, -2, 46, 0.0, -7, 16, 'sand', 0xdac094, 0, false);
  // Pit West steps so you can step cleanly onto Long Road from Pit
  addSteps(ctx, 38.2, 0.0, -12, -1, 0, 5.5, 1.6, 2.8, 6, 'dust_stone_floor');
  // Pit North exit slope back up to Long Street / Car (y=0.0 -> y=1.6)
  addFloorDeck(ctx, 38, 56, -28, -22, 1.6, 'sand', 0xe5cca0, 0);
  addSlopeRamp(ctx, 46, 0.0, -16, 46, 1.6, -22, 16, 'sand', 0xdac094, 0, false);
  addCrate(ctx, 51, 0, -11, 1.5, 1.4);

  // Long A Blue Container, Palm, Barrel & Iconic A Car
  addShippingContainer(ctx, 30, 1.6, -7, 5.8, 2.5, 2.5, 'container_blue', false);
  addOilBarrel(ctx, 27.5, 1.6, -15, 0x3b593d);
  addCrate(ctx, 35.5, 1.6, -21, 1.7, 1.7);
  addVehicle(ctx, 49.5, 1.6, -24.5, 0x7a6c5a, true); // Long A Car cover!
  addPalmTree(ctx, 52, 1.6, -30, 7.2);

  // A-Ramp climbing Long Street (1.6) -> Bombsite A (3.2)
  addSlopeRamp(ctx, 41, 1.6, -28, 41, 3.2, -43, 28, 'sand', 0xe5cca0, 0, false);

  // =========================================================================
  // 5. BOMBSITE A PLATFORM, GOOSE CORNER & CT-TO-A RAMP
  // =========================================================================
  addFloorDeck(ctx, 24, 56, -58, -43, 3.2, 'dust_stone_floor', 0xd9c39e, 0);
  addCrate(ctx, 34, 3.2, -49.5, 1.8, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, 37.5, 3.2, -48.5, 1.6, 2.4);
  addCrate(ctx, 34.8, 3.2, -52.5, 1.5, 1.5, 0xffffff, 'crate_military');
  addSandbagBarricade(ctx, 29, 3.2, -54, 4, 2, true);
  addCrate(ctx, 51, 3.2, -54.5, 1.7, 1.7); // Ninja / Site corner boxes
  addTerracottaPot(ctx, 27, 3.2, -45, 1.2);
  addPlaneDecal(ctx, 37, 5.6, -58.85, 7.2, 3.4, textures.createGooseGraffitiTexture(), 0);
  addSiteDecal(ctx, 36, 3.2, -49.5, 'A');

  // CT-to-A Ramp descending from A-Site (3.2) down to CT Spawn (0.0)
  addSlopeRamp(ctx, 24, 3.2, -51.5, 10, 0.0, -51.5, 11, 'dust_stone_floor', 0xd6c29d, 0, true);

  // =========================================================================
  // 6. CT SPAWN & CT MID (Elevation: y=0.0)
  // =========================================================================
  // CT Mid spans X: -13..+9, Z: -58..-14 at y=0.0
  addArchway(ctx, -2, 0, -34, 22, 7.4, 6.8, 4.6, 2.6, 'sandstone', 0xd1b88e);
  addFluorescentTube(ctx, -2, 4.4, -34, false);
  addCrate(ctx, 4.5, 0, -45, 1.9, 1.8, 0xffffff, 'crate_military');
  addCrate(ctx, -8, 0, -48, 1.8, 1.7);
  addSandbagBarricade(ctx, -3, 0, -53, 4, 2, true);
  addVehicle(ctx, 3.5, 0, -25, 0x5c6873, false); // CT Mid cover vehicle

  // Divider wall between CT Mid and B Site (X = -19.5) with B Doors & B Window
  addTrimWall(ctx, -19.5, 0, -16.5, 2.0, 6.8, 11, 'sandstone', 0xd1b88e);
  addDoubleDoors(ctx, -19.5, 0, -26, 8.2, 4.0, 4.4, 0x5c4732, Math.PI / 2); // B Doors
  addTrimWall(ctx, -19.5, 0, -33.5, 2.0, 6.8, 7, 'sandstone', 0xd1b88e);
  // B Window frame (opening Z=-37..-41, sill height y=2.55 -> walkable/jumpable with ramp & crates)
  addSolidBox(ctx, -19.5, 0, -39.5, 2.0, 2.45, 5.2, 'sandstone', 0xcbb086);
  addSolidBox(ctx, -19.5, 4.8, -39.5, 2.0, 2.0, 5.2, 'sandstone', 0xcbb086);
  addTrimWall(ctx, -19.5, 0, -50, 2.0, 6.8, 16, 'sandstone', 0xd1b88e);

  // Ramps connecting CT Mid (0.0) up into B Doors (1.8) and up to B Window sill!
  addSlopeRamp(ctx, -13, 0.0, -26, -20.5, 1.8, -26, 4.2, 'dust_stone_floor', 0xd6c29d, 0, false);
  addSlopeRamp(ctx, -11, 0.0, -39.5, -18.5, 2.45, -39.5, 3.8, 'dust_stone_floor', 0xd6c29d, 0, false);

  // =========================================================================
  // 7. BOMBSITE B COURTYARD, B CAR, BACK PLAT & B TUNNELS (UPPER & LOWER)
  // =========================================================================
  // B Site Main Deck (X: -56..-20.5, Z: -58..-8, y=1.8)
  addFloorDeck(ctx, -56, -20.5, -58, -8, 1.8, 'dust_stone_floor', 0xd6c29d, 0);
  // Elevated B Back Platform (y=2.8) + stone steps
  addFloorDeck(ctx, -56, -42, -58, -46, 2.8, 'dust_stone_floor', 0xdcc7a4, 1.8);
  addSteps(ctx, -42, 1.8, -51, -1, 0, 7.5, 1.0, 3.2, 4, 'dust_stone_floor');
  addCrate(ctx, -49, 2.8, -51, 1.7, 1.7, 0xffffff, 'crate_military');

  // B Site iconic landmarks: B Car, Plinth/Default Double Stack, B Closet
  addVehicle(ctx, -51, 1.8, -16, 0x566470, true); // B Car cover
  addCrate(ctx, -37.5, 1.8, -30, 1.8, 1.8, 0xffffff, 'crate_military'); // B Plinth Stack
  addCrate(ctx, -37.5, 3.6, -30, 1.5, 1.5);
  addCrate(ctx, -35, 1.8, -33.5, 1.7, 1.7, 0xffffff, 'crate_military');
  addCrate(ctx, -43, 1.8, -36, 1.7, 2.2); // Big Box / Double Stack
  addSandbagBarricade(ctx, -29, 1.8, -44, 4, 2, true);
  addTerracottaPot(ctx, -23.5, 1.8, -22, 1.15);
  addSiteDecal(ctx, -39, 1.8, -26, 'B');
  // Crate step up to B Window from inside B Site
  addSteps(ctx, -24.5, 1.8, -39.5, 1, 0, 4.0, 0.75, 2.4, 3, 'wood_plank');

  // Vaulted Upper Tunnels (X: -56..-29, Z: -8..+22, floor y=1.8, roof y=6.2)
  addFloorDeck(ctx, -56, -29, -8, 22, 1.8, 'dust_stone_floor', 0xc9b594, 0);
  // North wall of Upper Tunnels with B-Tuns Archway (X: -43, opening 5.4m)
  addArchway(ctx, -42.5, 1.8, -8, 27, 5.4, 5.4, 4.1, 2.2, 'sandstone', 0xc4aa82);
  // East wall of Upper Tunnels leaving Lower Tunnels junction open at Z=-7..+2!
  addTrimWall(ctx, -29, 1.8, 13, 2.0, 5.2, 18, 'sandstone', 0xc4aa82);
  // South wall of Upper Tunnels with Outside Tunnels entry archway (X: -43, opening 5.4m)
  addArchway(ctx, -42.5, 1.8, 22, 27, 5.4, 5.4, 4.1, 2.2, 'sandstone', 0xc4aa82);
  // Interior structural pillar, crates & vaulted ceiling with warm lanterns
  addSolidBox(ctx, -43.5, 1.8, 7.5, 2.8, 4.6, 2.8, 'sandstone', 0xbca076);
  addCrate(ctx, -51, 1.8, 6, 1.6, 1.6);
  addCrate(ctx, -35.5, 1.8, 14, 1.5, 1.5, 0xffffff, 'crate_military');
  addSolidBox(ctx, -42.5, 6.4, 7, 29, 0.75, 31, 'sandstone', 0xbca076, 0.88, 0.04, 6, 6, false);
  [-2, 7.5, 16].forEach((lz) => {
    addSolidBox(ctx, -42.5, 5.95, lz, 27, 0.45, 0.8, 'sandstone', 0x9c825e, 0.88, 0.04, 5, 1, false);
    addTunnelLantern(ctx, -38.5, 5.75, lz);
  });

  // Lower Tunnels enclosed sloped passage (Upper Tuns X=-29, y=1.8 -> Mid X=-10.5, y=0.0)
  addSlopeRamp(ctx, -29, 1.8, -3.5, -10.5, 0.0, -3.5, 7.5, 'dust_stone_floor', 0xc9b594, 0, false);
  addTrimWall(ctx, -20, 0, 1.2, 19, 6.2, 1.6, 'sandstone', 0xc4aa82);
  addTrimWall(ctx, -20, 0, -8.2, 19, 6.2, 1.6, 'sandstone', 0xc4aa82);
  addSolidBox(ctx, -20, 5.6, -3.5, 19.5, 0.7, 10.6, 'sandstone', 0xbca076, 0.88, 0.04, 4, 2, false);
  addTunnelLantern(ctx, -20, 5.15, -3.5);
  // Outside Tunnels decorative awnings & props (y=1.8)
  addMarketAwning(ctx, -49, 5.4, 29, 6.4, 3.8, 0xc77d42, false, true);
  addPalmTree(ctx, -50, 1.8, 36, 6.6);
  addCrate(ctx, -34, 1.8, 28, 1.7, 1.6);

  // =========================================================================
  // 8. WAYPOINT GRAPH (Full 3D multi-elevation coverage of every CS 1.6 route)
  // =========================================================================
  const waypoints: WaypointNode[] = [
    { id: 't_spawn', x: 0, y: 3.2, z: 50, neighbors: [], tag: 'T' },
    { id: 't_east_ramp', x: 30, y: 2.5, z: 47, neighbors: [] },
    { id: 'outside_long', x: 42, y: 1.8, z: 38, neighbors: [] },
    { id: 'long_house_in', x: 35, y: 1.8, z: 21, neighbors: [] },
    { id: 'long_house_mid', x: 43, y: 1.8, z: 14, neighbors: [] },
    { id: 'long_doors', x: 42, y: 1.7, z: 7, neighbors: [] },
    { id: 'long_road', x: 34, y: 1.6, z: -6, neighbors: [] },
    { id: 'long_pit', x: 46, y: 0.0, z: -11, neighbors: [] },
    { id: 'long_car', x: 44, y: 1.6, z: -25, neighbors: [] },
    { id: 'a_ramp', x: 41, y: 2.4, z: -36, neighbors: [] },
    { id: 'a_site', x: 35, y: 3.2, z: -47, neighbors: [], tag: 'A' },
    { id: 'a_goose', x: 30, y: 3.2, z: -53, neighbors: [], tag: 'A' },
    { id: 'a_short', x: 18, y: 3.2, z: -41, neighbors: [] },
    { id: 'short_stairs', x: 12, y: 2.8, z: -30, neighbors: [] },
    { id: 'catwalk', x: 9.5, y: 2.4, z: -16, neighbors: [] },
    { id: 'mid_cat_stairs', x: 8.8, y: 1.2, z: -3, neighbors: [] },
    { id: 'suicide', x: 0, y: 2.6, z: 32, neighbors: [] },
    { id: 'top_mid', x: 0, y: 2.0, z: 19, neighbors: [], tag: 'MID' },
    { id: 'top_mid_east', x: 13, y: 1.9, z: 29, neighbors: [] },
    { id: 'top_mid_west', x: -13, y: 1.9, z: 28, neighbors: [] },
    { id: 'mid', x: -2, y: 0.2, z: 2, neighbors: [], tag: 'MID' },
    { id: 'mid_doors', x: 0, y: 0.0, z: -14, neighbors: [], tag: 'MID' },
    { id: 'ct_mid', x: -2, y: 0.0, z: -27, neighbors: [] },
    { id: 'ct_spawn', x: -2, y: 0.0, z: -48, neighbors: [], tag: 'CT' },
    { id: 'ct_a_ramp', x: 16, y: 1.6, z: -51.5, neighbors: [] },
    { id: 't_west_ramp', x: -32, y: 2.5, z: 47, neighbors: [] },
    { id: 'outside_tuns', x: -42.5, y: 1.8, z: 32, neighbors: [] },
    { id: 'upper_tuns_s', x: -42.5, y: 1.8, z: 16, neighbors: [] },
    { id: 'upper_tuns_n', x: -36, y: 1.8, z: 0, neighbors: [] },
    { id: 'lower_tuns', x: -20, y: 0.9, z: -3.5, neighbors: [] },
    { id: 'b_tuns_exit', x: -42.5, y: 1.8, z: -9, neighbors: [] },
    { id: 'b_site', x: -36, y: 1.8, z: -26, neighbors: [], tag: 'B' },
    { id: 'b_plat', x: -47, y: 2.8, z: -50, neighbors: [], tag: 'B' },
    { id: 'b_doors', x: -19, y: 1.4, z: -26, neighbors: [] },
    { id: 'b_window', x: -19, y: 2.4, z: -39.5, neighbors: [] },
  ];

  [
    ['t_spawn', 'suicide'],
    ['suicide', 'top_mid'],
    ['t_spawn', 't_east_ramp'],
    ['t_east_ramp', 'outside_long'],
    ['outside_long', 'top_mid_east'],
    ['top_mid_east', 'top_mid'],
    ['outside_long', 'long_house_in'],
    ['long_house_in', 'long_house_mid'],
    ['long_house_mid', 'long_doors'],
    ['long_doors', 'long_road'],
    ['long_doors', 'long_pit'],
    ['long_pit', 'long_car'],
    ['long_road', 'long_car'],
    ['long_car', 'a_ramp'],
    ['a_ramp', 'a_site'],
    ['a_site', 'a_goose'],
    ['a_site', 'a_short'],
    ['a_short', 'short_stairs'],
    ['short_stairs', 'catwalk'],
    ['catwalk', 'mid_cat_stairs'],
    ['mid_cat_stairs', 'mid'],
    ['top_mid', 'mid'],
    ['mid', 'mid_doors'],
    ['mid_doors', 'ct_mid'],
    ['ct_mid', 'ct_spawn'],
    ['ct_spawn', 'ct_a_ramp'],
    ['ct_a_ramp', 'a_site'],
    ['t_spawn', 't_west_ramp'],
    ['t_west_ramp', 'outside_tuns'],
    ['outside_tuns', 'top_mid_west'],
    ['top_mid_west', 'top_mid'],
    ['outside_tuns', 'upper_tuns_s'],
    ['upper_tuns_s', 'upper_tuns_n'],
    ['upper_tuns_n', 'lower_tuns'],
    ['lower_tuns', 'mid'],
    ['upper_tuns_n', 'b_tuns_exit'],
    ['b_tuns_exit', 'b_site'],
    ['b_site', 'b_plat'],
    ['b_site', 'b_doors'],
    ['b_doors', 'ct_mid'],
    ['b_site', 'b_window'],
    ['b_window', 'ct_spawn'],
  ].forEach(([a, b]) => linkWaypoints(waypoints, a, b));

  const callouts: MapCalloutPin[] = [
    { name: 'T Spawn', x: 0, y: 4.5, z: 50, zone: 'T' },
    { name: 'Suicide / Top Mid', x: 0, y: 3.4, z: 22, zone: 'MID' },
    { name: 'Long Doors', x: 42, y: 3.4, z: 12, zone: 'A' },
    { name: 'Long A / Pit', x: 43, y: 2.2, z: -14, zone: 'A' },
    { name: 'Bombsite A', x: 35, y: 4.8, z: -48, zone: 'A' },
    { name: 'Catwalk / Short A', x: 11, y: 3.8, z: -22, zone: 'MID' },
    { name: 'Mid Doors', x: 0, y: 2.4, z: -14, zone: 'MID' },
    { name: 'Upper / Lower Tunnels', x: -37, y: 3.4, z: 2, zone: 'B' },
    { name: 'Bombsite B', x: -37, y: 3.4, z: -27, zone: 'B' },
    { name: 'CT Spawn', x: -2, y: 2.0, z: -49, zone: 'CT' },
  ];

  return {
    id: 'de_dust2',
    group: ctx.group,
    colliders: ctx.colliders,
    raycastMeshes: ctx.raycastMeshes,
    tSpawns: [
      new THREE.Vector3(-8, 3.2, 51),
      new THREE.Vector3(-3, 3.2, 52),
      new THREE.Vector3(3, 3.2, 52),
      new THREE.Vector3(8, 3.2, 51),
      new THREE.Vector3(0, 3.2, 47),
    ],
    ctSpawns: [
      new THREE.Vector3(-8, 0, -50),
      new THREE.Vector3(-3, 0, -52),
      new THREE.Vector3(3, 0, -52),
      new THREE.Vector3(7, 0, -49),
      new THREE.Vector3(-2, 0, -45),
    ],
    dmSpawns: [
      new THREE.Vector3(0, 3.2, 48),
      new THREE.Vector3(-2, 0, -48),
      new THREE.Vector3(36, 3.2, -45),
      new THREE.Vector3(-36, 1.8, -24),
      new THREE.Vector3(35, 1.6, -12),
      new THREE.Vector3(-42, 1.8, 12),
      new THREE.Vector3(9.5, 2.4, -18),
    ],
    bombsites: [
      { label: 'A', x: 35, y: 3.2, z: -48, radius: 6.5 },
      { label: 'B', x: -38, y: 1.8, z: -27, radius: 6.5 },
    ],
    buyZones: [
      { team: 'T', x: 0, z: 50, radius: 14 },
      { team: 'CT', x: -2, z: -50, radius: 13 },
    ],
    waypoints,
    callouts,
    skyColor: 0x89bce8,
    fogColor: 0xe6d4b5,
    fogDensity: 0.0042,
    sunColor: 0xffdfb0,
    sunIntensity: 2.05,
    sunPos: new THREE.Vector3(54, 78, 38),
    hemiSky: 0xa0cbf0,
    hemiGround: 0x9c7b56,
    hemiIntensity: 0.72,
    surfaceType: 'sand',
    bounds: { minX: -58, maxX: 58, minZ: -61, maxZ: 61 },
    ambientParticleMode: 'dust',
    menuShowcase: {
      camCenter: new THREE.Vector3(6, 5.6, -24),
      camOrbitRadius: 17,
      camHeight: 6.4,
      lookAt: new THREE.Vector3(24, 3.0, -44),
      smokePos: new THREE.Vector3(19, 3.3, -40),
      tSpots: [
        { pos: [14, 3.2, -37], yaw: 2.4, cls: 'desert_t', w: 'ak47', crouch: false },
        { pos: [41, 1.6, -24], yaw: 3.1, cls: 'classic_t', w: 'awp', crouch: true },
        { pos: [30, 1.6, -12], yaw: 2.9, cls: 'military_t', w: 'galil', crouch: false },
      ],
      ctSpots: [
        { pos: [33, 3.2, -47], yaw: -0.6, cls: 'classic_ct', w: 'm4a1', crouch: true },
        { pos: [26, 3.2, -52], yaw: -0.3, cls: 'specops_ct', w: 'famas', crouch: false },
        { pos: [2, 0, -39], yaw: 0.2, cls: 'assault_ct', w: 'aug', crouch: false },
      ],
    },
  };
}
