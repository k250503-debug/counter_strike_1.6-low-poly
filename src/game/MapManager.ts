import * as THREE from 'three';
import { buildAssaultFullScale } from './maps/assault';
import { buildAztecFullScale } from './maps/aztec';
import { buildCbbleFullScale } from './maps/cbble';
import { buildDustFullScale } from './maps/dust';
import { buildDust2FullScale } from './maps/dust2';
import { buildInfernoFullScale } from './maps/inferno';
import { buildItalyFullScale } from './maps/italy';
import { buildMilitiaFullScale } from './maps/militia';
import { buildMirageFullScale } from './maps/mirage';
import { buildNukeFullScale } from './maps/nuke';
import { buildOfficeFullScale } from './maps/office';
import {
  BuiltMap,
  getMat,
  MapBuildContext,
} from './maps/shared';
import { buildTrainFullScale } from './maps/train';
import { attachHeroGlbLodProps, HeroGlbSpot, PropBatchBuilder } from './scenes/InstancedProps';
import { MapId } from './types';

export type {
  BombsiteZone,
  BuiltMap,
  ColliderBox,
  MapCalloutPin,
  MenuFirefightSpot,
  MenuShowcaseConfig,
  WaypointNode,
} from './maps/shared';

const HERO_GLB_SPOTS: Record<MapId, HeroGlbSpot[]> = {
  de_dust2: [
    { assetId: 'jersey_barrier_glb', x: 1.6, y: 0, z: -24, rotY: Math.PI / 2 },
    { assetId: 'jersey_barrier_glb', x: 37, y: 1.6, z: -12, rotY: 0.25 },
    { assetId: 'fuel_drum_glb', x: 28, y: 1.6, z: -32, rotY: 0.4 },
  ],
  de_inferno: [
    { assetId: 'jersey_barrier_glb', x: 0, y: 0, z: 12, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: -35, y: 1.2, z: -16, rotY: 0.2 },
    { assetId: 'tactical_crate_glb', x: 24, y: 0.8, z: -36, rotY: 0.3 },
  ],
  de_nuke: [
    { assetId: 'jersey_barrier_glb', x: 32, y: 5.2, z: -12, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: 42, y: 5.2, z: 6, rotY: 0.8 },
    { assetId: 'tactical_crate_glb', x: -8, y: 0.15, z: 2, rotY: 0.35 },
  ],
  de_train: [
    { assetId: 'jersey_barrier_glb', x: -6, y: 0, z: -14, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: 14, y: 0, z: -16, rotY: 1.1 },
    { assetId: 'tactical_crate_glb', x: -12, y: 0, z: 26, rotY: 0.4 },
  ],
  de_aztec: [
    { assetId: 'tactical_crate_glb', x: -10, y: 3.2, z: 34, rotY: 0.2 },
    { assetId: 'fuel_drum_glb', x: 24, y: 3.2, z: -26, rotY: 0.5 },
  ],
  de_dust: [
    { assetId: 'jersey_barrier_glb', x: 16, y: 3.2, z: 24, rotY: Math.PI / 2 },
    { assetId: 'tactical_crate_glb', x: 28, y: 3.2, z: -26, rotY: 0.3 },
  ],
  de_cbble: [
    { assetId: 'jersey_barrier_glb', x: 14, y: 2.4, z: 20, rotY: Math.PI / 2 },
    { assetId: 'tactical_crate_glb', x: -28, y: 2.4, z: -18, rotY: 0.4 },
  ],
  de_mirage: [
    { assetId: 'jersey_barrier_glb', x: 6, y: 0.8, z: 10, rotY: Math.PI / 2 },
    { assetId: 'tactical_crate_glb', x: 24, y: 0.8, z: -26, rotY: 0.25 },
  ],
  cs_office: [
    { assetId: 'jersey_barrier_glb', x: -14, y: 0, z: 32, rotY: Math.PI / 2 },
    { assetId: 'jersey_barrier_glb', x: 10, y: 0, z: 34, rotY: Math.PI / 2 },
  ],
  cs_assault: [
    { assetId: 'jersey_barrier_glb', x: 8, y: 0, z: 28, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: -10, y: 0, z: -16, rotY: 0.6 },
  ],
  cs_italy: [
    { assetId: 'fuel_drum_glb', x: 10, y: 2.4, z: -18, rotY: 0.4 },
    { assetId: 'tactical_crate_glb', x: -10, y: 2.4, z: 24, rotY: 0.15 },
  ],
  cs_militia: [
    { assetId: 'jersey_barrier_glb', x: 2, y: 2.4, z: 28, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: -30, y: 2.4, z: 14, rotY: 0.5 },
  ],
};

export class MapManager {
  public buildMap(mapId: MapId, shadows = true): BuiltMap {
    const ctx: MapBuildContext = {
      group: new THREE.Group(),
      colliders: [],
      raycastMeshes: [],
      materials: new Map(),
      propBatch: new PropBatchBuilder(),
      shadows,
    };

    let built: BuiltMap;
    switch (mapId) {
      case 'de_dust2':
        built = buildDust2FullScale(ctx);
        break;
      case 'de_inferno':
        built = buildInfernoFullScale(ctx);
        break;
      case 'de_nuke':
        built = buildNukeFullScale(ctx);
        break;
      case 'de_train':
        built = buildTrainFullScale(ctx);
        break;
      case 'de_aztec':
        built = buildAztecFullScale(ctx);
        break;
      case 'de_dust':
        built = buildDustFullScale(ctx);
        break;
      case 'de_cbble':
        built = buildCbbleFullScale(ctx);
        break;
      case 'de_mirage':
        built = buildMirageFullScale(ctx);
        break;
      case 'cs_office':
        built = buildOfficeFullScale(ctx);
        break;
      case 'cs_assault':
        built = buildAssaultFullScale(ctx);
        break;
      case 'cs_italy':
        built = buildItalyFullScale(ctx);
        break;
      case 'cs_militia':
        built = buildMilitiaFullScale(ctx);
        break;
    }

    ctx.propBatch.flush(ctx.group, ctx.raycastMeshes, shadows, (kind, rx, ry, tint, rough, metal) =>
      getMat(ctx, kind, rx, ry, tint, rough, metal)
    );
    attachHeroGlbLodProps(ctx.group, shadows, HERO_GLB_SPOTS[mapId] || []);

    return built;
  }
}

export const mapManager = new MapManager();
