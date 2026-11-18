export class HealthSystem {
  public health = 100;
  public armor = 0;
  public hasHelmet = false;
  public alive = true;

  public reset(keepArmor = false): void {
    this.health = 100;
    this.alive = true;
    if (!keepArmor) {
      this.armor = 0;
      this.hasHelmet = false;
    }
  }

  public grantArmor(withHelmet: boolean): void {
    this.armor = 100;
    if (withHelmet) {
      this.hasHelmet = true;
    }
  }

  /**
   * Classic Counter-Strike armor absorption & headshot multiplier calculation.
   * Returns actual health damage dealt.
   */
  public applyDamage(
    rawDamage: number,
    armorPenetration: number,
    isHeadshot: boolean
  ): { healthDamage: number; killed: boolean } {
    if (!this.alive) return { healthDamage: 0, killed: false };

    let dmg = rawDamage * (isHeadshot ? 3.2 : 1.0);

    if (this.armor > 0) {
      const protectedZone = !isHeadshot || this.hasHelmet;
      if (protectedZone) {
        const effective = dmg * armorPenetration;
        const absorbed = (dmg - effective) * 0.5;
        this.armor = Math.max(0, Math.round(this.armor - absorbed));
        dmg = effective;
      }
    }

    const finalDmg = Math.max(1, Math.round(dmg));
    this.health = Math.max(0, this.health - finalDmg);
    if (this.health <= 0) {
      this.alive = false;
      this.armor = 0;
      this.hasHelmet = false;
      return { healthDamage: finalDmg, killed: true };
    }
    return { healthDamage: finalDmg, killed: false };
  }
}
