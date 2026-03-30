import { IAttackStrategy, IWeapon } from '../defintion';

/**
 * Warrior attack strategy - relies on physical power
 */
export class WarriorAttackStrategy implements IAttackStrategy {
  calculateDamage(baseStats: Record<string, number>, weapon?: IWeapon): number {
    const power = baseStats.power ?? 50;
    const weaponDamage = weapon?.damage ?? 0;
    return power + weaponDamage;
  }
}

/**
 * Mage attack strategy - relies on mana
 */
export class MageAttackStrategy implements IAttackStrategy {
  calculateDamage(baseStats: Record<string, number>, weapon?: IWeapon): number {
    const mana = baseStats.mana ?? 100;
    const weaponDamage = weapon?.damage ?? 0;
    return mana * 1.5 + weaponDamage * 0.5;
  }
}

/**
 * Archer attack strategy - relies on agility
 */
export class ArcherAttackStrategy implements IAttackStrategy {
  calculateDamage(baseStats: Record<string, number>, weapon?: IWeapon): number {
    const agility = baseStats.agility ?? 70;
    const weaponDamage = weapon?.damage ?? 0;
    return agility * 1.8 + weaponDamage;
  }
}
