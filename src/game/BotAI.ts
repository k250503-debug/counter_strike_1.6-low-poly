import * as THREE from 'three';
import { audioManager } from './AudioManager';
import { animateCharacterPose, buildCharacterRig, CharacterRig, setCharacterWeapon } from './CharacterModels';
import { HealthSystem } from './HealthSystem';
import { ColliderBox, WaypointNode } from './MapManager';
import { WEAPON_DATABASE } from './WeaponDatabase';
import { BotDifficulty, CharacterClassId, Team, WeaponId } from './types';

export interface BotContext {
  id: string;
  name: string;
  team: 'T' | 'CT';
  classId: CharacterClassId;
  rig: CharacterRig;
  health: HealthSystem;
  position: THREE.Vector3;
  yaw: number;
  weaponId: WeaponId;
  ammoInMag: number;
  kills: number;
  deaths: number;
  money: number;
  hasC4: boolean;
  hasDefuseKit: boolean;
  isCrouching: boolean;
  fireCooldown: number;
  reloadTimer: number;
  recoilKick: number;
  hitFlinch: number;
  speedRatio: number;
  stepAccum: number;
  reactionTimer: number;
  state: 'PATROL' | 'ATTACK' | 'PLANT' | 'DEFUSE' | 'HOLD' | 'INVESTIGATE';
  targetWaypointId: string | null;
  lastWaypointId: string | null;
  alertPos: THREE.Vector3 | null;
  alertTimer: number;
  pathTimer: number;
  strafeDir: number;
  strafeTimer: number;
  deathTimer: number;
  deathStyle: number;
  respawnTimer: number;
  plantDefuseProgress: number;
}

const BOT_NAMES_T = ['Phoenix', 'Viper', 'Kobra', 'Maverick', 'Dagger', 'Nomad', 'Zed'];
const BOT_NAMES_CT = ['Steel', 'Hawk', 'Delta', 'Bishop', 'Ranger', 'Echo', 'Vanguard'];
const T_CLASSES: CharacterClassId[] = ['classic_t', 'desert_t', 'urban_t', 'military_t'];
const CT_CLASSES: CharacterClassId[] = ['classic_ct', 'specops_ct', 'urban_ct', 'assault_ct'];

export function createBot(
  index: number,
  team: 'T' | 'CT',
  shadows: boolean
): BotContext {
  const classId =
    team === 'T'
      ? T_CLASSES[index % T_CLASSES.length]
      : CT_CLASSES[index % CT_CLASSES.length];
  const weaponId: WeaponId = team === 'T' ? 'glock18' : 'usp';
  const rig = buildCharacterRig(classId, weaponId, shadows);
  const name =
    team === 'T'
      ? `${BOT_NAMES_T[index % BOT_NAMES_T.length]}`
      : `${BOT_NAMES_CT[index % BOT_NAMES_CT.length]}`;

  const bot: BotContext = {
    id: `bot_${team}_${index}`,
    name,
    team,
    classId,
    rig,
    health: new HealthSystem(),
    position: new THREE.Vector3(),
    yaw: 0,
    weaponId,
    ammoInMag: WEAPON_DATABASE[weaponId].magazineSize,
    kills: 0,
    deaths: 0,
    money: 800,
    hasC4: false,
    hasDefuseKit: false,
    isCrouching: false,
    fireCooldown: 0,
    reloadTimer: 0,
    recoilKick: 0,
    hitFlinch: 0,
    speedRatio: 0,
    stepAccum: 0,
    reactionTimer: 0,
    state: 'PATROL',
    targetWaypointId: null,
    lastWaypointId: null,
    alertPos: null,
    alertTimer: 0,
    pathTimer: 0,
    strafeDir: index % 2 === 0 ? 1 : -1,
    strafeTimer: 1.5,
    deathTimer: 0,
    deathStyle: index % 4,
    respawnTimer: 0,
    plantDefuseProgress: 0,
  };

  rig.headMesh.userData = { entityId: bot.id, isHead: true };
  rig.bodyHitMeshes.forEach((m) => {
    m.userData = { entityId: bot.id, isHead: false };
  });

  return bot;
}

export function triggerBotHitReaction(bot: BotContext, isHead: boolean): void {
  bot.hitFlinch = isHead ? 1.0 : 0.72;
  bot.deathStyle = isHead ? 1 : (Math.floor(Math.random() * 3) === 1 ? 3 : Math.floor(Math.random() * 3));
}

export function notifyBotsOfGunfire(
  bots: BotContext[],
  soundPos: THREE.Vector3,
  shooterTeam: Team,
  isFreeForAll: boolean
): void {
  for (const b of bots) {
    if (!b.health.alive) continue;
    if (!isFreeForAll && b.team === shooterTeam) continue;
    if (b.position.distanceTo(soundPos) < 34) {
      b.alertPos = soundPos.clone();
      b.alertTimer = 4.5;
    }
  }
}

export function equipBotWeaponForRound(bot: BotContext): void {
  let chosen: WeaponId = bot.team === 'T' ? 'glock18' : 'usp';
  if (bot.money >= 4750 && Math.random() < 0.18) {
    chosen = 'awp';
    bot.money -= 4750;
  } else if (bot.money >= 3100 && bot.team === 'CT') {
    chosen = 'm4a1';
    bot.money -= 3100;
  } else if (bot.money >= 2500 && bot.team === 'T') {
    chosen = 'ak47';
    bot.money -= 2500;
  } else if (bot.money >= 1500) {
    chosen = 'mp5';
    bot.money -= 1500;
  } else if (bot.money >= 650) {
    chosen = 'deagle';
    bot.money -= 650;
  }

  if (bot.money >= 1000) {
    bot.health.grantArmor(true);
    bot.money -= 1000;
  } else if (bot.money >= 650) {
    bot.health.grantArmor(false);
    bot.money -= 650;
  }

  if (bot.team === 'CT' && bot.money >= 200 && !bot.hasDefuseKit) {
    bot.hasDefuseKit = true;
    bot.money -= 200;
  }

  if (bot.weaponId !== chosen) {
    bot.weaponId = chosen;
    setCharacterWeapon(bot.rig, chosen);
  }
  bot.ammoInMag = WEAPON_DATABASE[chosen].magazineSize;
  bot.hitFlinch = 0;
  bot.alertPos = null;
  bot.alertTimer = 0;
}

export interface CombatTarget {
  id: string;
  team: Team;
  position: THREE.Vector3;
  alive: boolean;
}

const _dir = new THREE.Vector3();
const _eyeOrigin = new THREE.Vector3();
const _targetEye = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

export function updateBotAI(
  bot: BotContext,
  dt: number,
  time: number,
  difficulty: BotDifficulty,
  targets: CombatTarget[],
  waypoints: WaypointNode[],
  colliders: ColliderBox[],
  raycastWalls: THREE.Mesh[],
  bombPlantedPos: THREE.Vector3 | null,
  bombsites: { label: 'A' | 'B'; x: number; y: number; z: number; radius: number }[],
  playerPos: THREE.Vector3,
  surfaceType: 'sand' | 'concrete' | 'metal',
  isFreeForAll: boolean,
  onBotFire: (bot: BotContext, origin: THREE.Vector3, dir: THREE.Vector3) => void,
  onBotPlantBomb: (bot: BotContext, site: 'A' | 'B') => void,
  onBotDefuseBomb: (bot: BotContext) => void
): void {
  if (!bot.health.alive) {
    bot.deathTimer = Math.min(1, bot.deathTimer + dt * 1.85);
    animateCharacterPose(bot.rig, time, 0, false, 0, true, bot.deathTimer, {
      deathStyle: bot.deathStyle,
      baseY: bot.position.y,
    });
    return;
  }

  bot.fireCooldown = Math.max(0, bot.fireCooldown - dt);
  bot.recoilKick = THREE.MathUtils.damp(bot.recoilKick, 0, 14, dt);
  bot.hitFlinch = THREE.MathUtils.damp(bot.hitFlinch, 0, 10, dt);
  if (bot.alertTimer > 0) {
    bot.alertTimer -= dt;
    if (bot.alertTimer <= 0) bot.alertPos = null;
  }

  if (bot.reloadTimer > 0) {
    bot.reloadTimer -= dt;
    if (bot.reloadTimer <= 0) {
      bot.ammoInMag = WEAPON_DATABASE[bot.weaponId].magazineSize;
    }
  }

  const diffCfg = {
    easy: { react: 0.45, spread: 0.135, speed: 3.5 },
    normal: { react: 0.24, spread: 0.08, speed: 4.3 },
    hard: { react: 0.13, spread: 0.045, speed: 4.8 },
    expert: { react: 0.07, spread: 0.022, speed: 5.2 },
  }[difficulty];

  // 1. Line-of-sight enemy scan
  let bestTarget: CombatTarget | null = null;
  let bestDist = Infinity;

  _eyeOrigin.set(bot.position.x, bot.position.y + 1.5, bot.position.z);

  for (const t of targets) {
    if (!t.alive || t.id === bot.id) continue;
    if (!isFreeForAll && t.team === bot.team) continue;

    const d = bot.position.distanceTo(t.position);
    if (d > 62) continue;

    _targetEye.set(t.position.x, t.position.y + 1.35, t.position.z);
    _dir.subVectors(_targetEye, _eyeOrigin);
    const len = _dir.length();
    if (len < 0.1) continue;
    _dir.divideScalar(len);

    _raycaster.set(_eyeOrigin, _dir);
    _raycaster.far = len;
    const hits = _raycaster.intersectObjects(raycastWalls, false);
    if (hits.length === 0 && d < bestDist) {
      bestDist = d;
      bestTarget = t;
    }
  }

  let targetSpeedRatio = 0;

  // 2. Objective checks: CT defuse / T plant
  const shouldDefuse =
    !isFreeForAll &&
    bot.team === 'CT' &&
    bombPlantedPos !== null &&
    (!bestTarget || bestDist > 11);

  const shouldPlant =
    !isFreeForAll &&
    bot.team === 'T' &&
    bot.hasC4 &&
    bombPlantedPos === null &&
    !bestTarget;

  if (shouldDefuse && bombPlantedPos) {
    const distToBomb = bot.position.distanceTo(bombPlantedPos);
    if (distToBomb < 2.4) {
      bot.state = 'DEFUSE';
      bot.isCrouching = true;
      bot.speedRatio = THREE.MathUtils.damp(bot.speedRatio, 0, 12, dt);
      bot.plantDefuseProgress += dt / (bot.hasDefuseKit ? 5.0 : 10.0);
      if (bot.plantDefuseProgress >= 1) {
        bot.plantDefuseProgress = 0;
        onBotDefuseBomb(bot);
      }
      bot.rig.root.position.copy(bot.position);
      bot.rig.root.rotation.y = bot.yaw;
      animateCharacterPose(bot.rig, time, bot.speedRatio, true, bot.recoilKick, false, 0, {
        hitFlinch: bot.hitFlinch,
      });
      return;
    }
  }

  if (shouldPlant) {
    for (const site of bombsites) {
      const distSite = Math.hypot(bot.position.x - site.x, bot.position.z - site.z);
      if (distSite < site.radius * 0.75) {
        bot.state = 'PLANT';
        bot.isCrouching = true;
        bot.speedRatio = THREE.MathUtils.damp(bot.speedRatio, 0, 12, dt);
        bot.plantDefuseProgress += dt / 3.2;
        if (bot.plantDefuseProgress >= 1) {
          bot.plantDefuseProgress = 0;
          onBotPlantBomb(bot, site.label);
        }
        bot.rig.root.position.copy(bot.position);
        bot.rig.root.rotation.y = bot.yaw;
        animateCharacterPose(bot.rig, time, bot.speedRatio, true, bot.recoilKick, false, 0, {
          hitFlinch: bot.hitFlinch,
        });
        return;
      }
    }
  }

  bot.plantDefuseProgress = 0;

  // 3. Combat / Cover / Patrol / Investigate
  let aimPitch = 0;
  if (bestTarget) {
    bot.state = 'ATTACK';
    bot.alertPos = bestTarget.position.clone();
    bot.alertTimer = 4.0;
    bot.isCrouching = (bestDist > 16 && difficulty !== 'easy') || bot.reloadTimer > 0;

    const dx = bestTarget.position.x - bot.position.x;
    const dy = bestTarget.position.y - bot.position.y;
    const dz = bestTarget.position.z - bot.position.z;
    const desiredYaw = Math.atan2(-dx, -dz);
    bot.yaw = lerpAngle(bot.yaw, desiredYaw, Math.min(1, dt * 10));
    aimPitch = Math.atan2(dy, Math.max(1.5, Math.hypot(dx, dz)));

    bot.strafeTimer -= dt;
    if (bot.strafeTimer <= 0) {
      bot.strafeTimer = 0.75 + Math.random() * 1.1;
      bot.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    // Back off slightly into cover while reloading, otherwise tactical strafe-peek
    const strafeMult = bot.reloadTimer > 0 ? 0.75 : bestDist > 7 ? 0.58 : 0.35;
    const sx = Math.cos(bot.yaw) * bot.strafeDir;
    const sz = -Math.sin(bot.yaw) * bot.strafeDir;
    const moveStep = diffCfg.speed * strafeMult * dt;
    moveBotWithCollision(bot, sx * moveStep, sz * moveStep, colliders);
    targetSpeedRatio = strafeMult;

    if (bot.reloadTimer <= 0 && bot.fireCooldown <= 0) {
      if (bot.ammoInMag <= 0) {
        bot.reloadTimer = WEAPON_DATABASE[bot.weaponId].reloadTime;
      } else {
        const def = WEAPON_DATABASE[bot.weaponId];
        bot.ammoInMag -= 1;
        bot.fireCooldown = Math.max(60 / def.fireRateRPM, diffCfg.react * (def.automatic ? 0.6 : 1.25));
        bot.recoilKick = 1.0;

        _targetEye.set(bestTarget.position.x, bestTarget.position.y + 1.32, bestTarget.position.z);
        _dir.subVectors(_targetEye, _eyeOrigin).normalize();
        _dir.x += (Math.random() - 0.5) * diffCfg.spread;
        _dir.y += (Math.random() - 0.5) * diffCfg.spread;
        _dir.z += (Math.random() - 0.5) * diffCfg.spread;
        _dir.normalize();

        const distToPlayer = bot.position.distanceTo(playerPos);
        const atten = Math.max(0, 1 - distToPlayer / 60);
        audioManager.playWeaponFire(
          bot.weaponId,
          bot.weaponId === 'm4a1' || bot.weaponId === 'usp',
          atten * 0.72,
          _eyeOrigin
        );
        onBotFire(bot, _eyeOrigin.clone(), _dir.clone());
      }
    }
  } else if (waypoints.length > 0) {
    bot.state = bot.alertPos ? 'INVESTIGATE' : 'PATROL';
    bot.isCrouching = false;

    let wp = waypoints.find((w) => w.id === bot.targetWaypointId);
    if (!wp || Math.hypot(wp.x - bot.position.x, wp.z - bot.position.z) < 2.2) {
      const current = wp || findClosestWaypoint(bot.position, waypoints);
      const candidates = current.neighbors.filter((nid) => nid !== bot.lastWaypointId);
      const pool = candidates.length > 0 ? candidates : current.neighbors;
      let nextId = pool[Math.floor(Math.random() * pool.length)];

      // Priority goal: Bomb > Gunfire alert > Bombsite patrol
      const goalPos: THREE.Vector3 | null =
        bombPlantedPos && bot.team === 'CT'
          ? bombPlantedPos
          : bot.alertPos
          ? bot.alertPos
          : bot.hasC4 && bombsites.length > 0
          ? new THREE.Vector3(bombsites[0].x, 0, bombsites[0].z)
          : null;

      if (goalPos) {
        let bestScore = Infinity;
        for (const nid of pool) {
          const nw = waypoints.find((w) => w.id === nid);
          if (!nw) continue;
          const d = Math.hypot(nw.x - goalPos.x, nw.z - goalPos.z);
          if (d < bestScore) {
            bestScore = d;
            nextId = nid;
          }
        }
      }

      bot.lastWaypointId = current.id;
      bot.targetWaypointId = nextId;
      wp = waypoints.find((w) => w.id === nextId);
    }

    if (wp) {
      const dx = wp.x - bot.position.x;
      const dz = wp.z - bot.position.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.2) {
        const desiredYaw = Math.atan2(-dx, -dz);
        bot.yaw = lerpAngle(bot.yaw, desiredYaw, Math.min(1, dt * 6.5));
        const sprintBoost = bot.alertPos || (bombPlantedPos && bot.team === 'CT') ? 1.1 : 0.92;
        const step = diffCfg.speed * sprintBoost * dt;
        moveBotWithCollision(bot, (dx / d) * step, (dz / d) * step, colliders);
        targetSpeedRatio = sprintBoost * 0.88;
      }
    }
  }

  bot.speedRatio = THREE.MathUtils.damp(bot.speedRatio, targetSpeedRatio, 10, dt);

  // Spatial bot footsteps when audible nearby
  if (bot.speedRatio > 0.35 && !bot.isCrouching) {
    bot.stepAccum += bot.speedRatio * diffCfg.speed * dt;
    if (bot.stepAccum >= 2.35) {
      bot.stepAccum = 0;
      const distToPlayer = bot.position.distanceTo(playerPos);
      if (distToPlayer < 24) {
        audioManager.playFootstep(surfaceType, Math.max(0.03, (1 - distToPlayer / 24) * 0.16), bot.position);
      }
    }
  }

  bot.rig.root.position.copy(bot.position);
  bot.rig.root.rotation.y = bot.yaw;
  animateCharacterPose(bot.rig, time, bot.speedRatio, bot.isCrouching, bot.recoilKick, false, 0, {
    isReloading: bot.reloadTimer > 0,
    hitFlinch: bot.hitFlinch,
    aimPitch,
  });
}

function findClosestWaypoint(pos: THREE.Vector3, waypoints: WaypointNode[]): WaypointNode {
  let best = waypoints[0];
  let bestD = Infinity;
  for (const w of waypoints) {
    const d = Math.hypot(w.x - pos.x, w.z - pos.z);
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  }
  return best;
}

function moveBotWithCollision(bot: BotContext, dx: number, dz: number, colliders: ColliderBox[]): void {
  const r = 0.42;
  const h = 1.75;

  bot.position.x += dx;
  for (const c of colliders) {
    if (bot.position.y + h <= c.minY || bot.position.y + 0.1 >= c.maxY) continue;
    if (
      bot.position.x + r > c.minX &&
      bot.position.x - r < c.maxX &&
      bot.position.z + r > c.minZ &&
      bot.position.z - r < c.maxZ
    ) {
      if (c.maxY - bot.position.y <= 0.45) {
        bot.position.y = c.maxY;
      } else {
        bot.position.x -= dx;
      }
    }
  }

  bot.position.z += dz;
  for (const c of colliders) {
    if (bot.position.y + h <= c.minY || bot.position.y + 0.1 >= c.maxY) continue;
    if (
      bot.position.x + r > c.minX &&
      bot.position.x - r < c.maxX &&
      bot.position.z + r > c.minZ &&
      bot.position.z - r < c.maxZ
    ) {
      if (c.maxY - bot.position.y <= 0.45) {
        bot.position.y = c.maxY;
      } else {
        bot.position.z -= dz;
      }
    }
  }

  let floorY = 0;
  for (const c of colliders) {
    if (
      bot.position.x + r * 0.7 > c.minX &&
      bot.position.x - r * 0.7 < c.maxX &&
      bot.position.z + r * 0.7 > c.minZ &&
      bot.position.z - r * 0.7 < c.maxZ &&
      c.maxY <= bot.position.y + 0.3
    ) {
      floorY = Math.max(floorY, c.maxY);
    }
  }
  bot.position.y = THREE.MathUtils.lerp(bot.position.y, floorY, 0.35);
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
