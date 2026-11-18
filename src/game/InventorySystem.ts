import { WEAPON_DATABASE } from './WeaponDatabase';
import { Team, WeaponId, WeaponInstance, WeaponSlot } from './types';

export class InventorySystem {
  public primary: WeaponInstance | null = null;
  public secondary: WeaponInstance | null = null;
  public knife: WeaponInstance = { id: 'knife', ammoInMag: 0, ammoReserve: 0 };
  public grenades: { he: number; flash: number; smoke: number } = { he: 0, flash: 0, smoke: 0 };
  public hasC4 = false;
  public hasDefuseKit = false;
  public activeSlot: WeaponSlot = 'secondary';
  public lastSlot: WeaponSlot = 'knife';
  public money = 800;

  public resetForNewMatch(team: Team, startMoney = 800): void {
    this.money = startMoney;
    this.primary = null;
    this.secondary = this.createInstance(team === 'CT' ? 'usp' : 'glock18');
    this.grenades = { he: 0, flash: 0, smoke: 0 };
    this.hasC4 = false;
    this.hasDefuseKit = false;
    this.activeSlot = 'secondary';
    this.lastSlot = 'knife';
  }

  public resetAfterDeath(team: Team): void {
    this.primary = null;
    this.secondary = this.createInstance(team === 'CT' ? 'usp' : 'glock18');
    this.grenades = { he: 0, flash: 0, smoke: 0 };
    this.hasC4 = false;
    this.hasDefuseKit = false;
    this.activeSlot = 'secondary';
    this.lastSlot = 'knife';
  }

  public createInstance(id: WeaponId): WeaponInstance {
    const def = WEAPON_DATABASE[id];
    return {
      id,
      ammoInMag: def.magazineSize,
      ammoReserve: def.reserveMax,
      silenced: id === 'm4a1' || id === 'usp',
      burstMode: false,
    };
  }

  public equipWeapon(id: WeaponId, free = false): boolean {
    const def = WEAPON_DATABASE[id];
    if (!free && this.money < def.price) return false;
    if (!free) this.money -= def.price;

    if (def.slot === 'primary') {
      if (this.activeSlot !== 'primary') this.lastSlot = this.activeSlot;
      this.primary = this.createInstance(id);
      this.activeSlot = 'primary';
      return true;
    }
    if (def.slot === 'secondary') {
      if (this.activeSlot !== 'secondary') this.lastSlot = this.activeSlot;
      this.secondary = this.createInstance(id);
      this.activeSlot = 'secondary';
      return true;
    }
    if (id === 'hegrenade') {
      if (this.grenades.he >= 1) {
        if (!free) this.money += def.price;
        return false;
      }
      this.grenades.he += 1;
      return true;
    }
    if (id === 'flashbang') {
      if (this.grenades.flash >= 2) {
        if (!free) this.money += def.price;
        return false;
      }
      this.grenades.flash += 1;
      return true;
    }
    if (id === 'smokegrenade') {
      if (this.grenades.smoke >= 1) {
        if (!free) this.money += def.price;
        return false;
      }
      this.grenades.smoke += 1;
      return true;
    }
    if (id === 'defuse_kit') {
      if (this.hasDefuseKit) {
        if (!free) this.money += def.price;
        return false;
      }
      this.hasDefuseKit = true;
      return true;
    }
    return true;
  }

  public addMoney(amount: number): void {
    this.money = Math.min(16000, Math.max(0, this.money + amount));
  }

  public getActiveWeapon(): WeaponInstance {
    if (this.activeSlot === 'primary' && this.primary) return this.primary;
    if (this.activeSlot === 'secondary' && this.secondary) return this.secondary;
    if (this.activeSlot === 'grenade') {
      const gid = this.getAvailableGrenadeId();
      if (gid) return { id: gid, ammoInMag: 1, ammoReserve: 0 };
    }
    if (this.activeSlot === 'c4' && this.hasC4) {
      return { id: 'c4', ammoInMag: 1, ammoReserve: 0 };
    }
    return this.knife;
  }

  public getAvailableGrenadeId(): WeaponId | null {
    if (this.grenades.he > 0) return 'hegrenade';
    if (this.grenades.flash > 0) return 'flashbang';
    if (this.grenades.smoke > 0) return 'smokegrenade';
    return null;
  }

  public setActiveSlot(slot: WeaponSlot): boolean {
    if (slot === this.activeSlot) return false;
    if (slot === 'primary' && !this.primary) return false;
    if (slot === 'secondary' && !this.secondary) return false;
    if (slot === 'grenade' && !this.getAvailableGrenadeId()) return false;
    if (slot === 'c4' && !this.hasC4) return false;
    this.lastSlot = this.activeSlot;
    this.activeSlot = slot;
    return true;
  }

  public quickSwitch(): boolean {
    const candidates: WeaponSlot[] = [this.lastSlot];
    if (this.primary && this.activeSlot !== 'primary') candidates.push('primary');
    if (this.secondary && this.activeSlot !== 'secondary') candidates.push('secondary');
    if (this.activeSlot !== 'knife') candidates.push('knife');
    for (const c of candidates) {
      if (this.setActiveSlot(c)) return true;
    }
    return false;
  }

  public cycleSlot(dir: 1 | -1): void {
    const order: WeaponSlot[] = [];
    if (this.primary) order.push('primary');
    if (this.secondary) order.push('secondary');
    order.push('knife');
    if (this.getAvailableGrenadeId()) order.push('grenade');
    if (this.hasC4) order.push('c4');
    const idx = order.indexOf(this.activeSlot);
    const next = (idx + dir + order.length) % order.length;
    this.setActiveSlot(order[next]);
  }
}
