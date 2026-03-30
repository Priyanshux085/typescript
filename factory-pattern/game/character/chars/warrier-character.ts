import { BaseCharacter } from '../base-character';
import { IWeapon, IAttackStrategy } from '../defintion';
import { WarriorAttackStrategy } from '../strategies/attack-strategies';

/**
 * Warrior character implementation
 * Uses physical power and heavy weapons
 */
export class WarrierCharacter extends BaseCharacter {
  override baseStats = { power: 50 };
  protected attackStrategy: IAttackStrategy = new WarriorAttackStrategy();

  constructor(
    name: string,
    health: number,
    weapons: IWeapon[],
    idGenerator: () => string,
  ) {
    super(name, health, weapons, idGenerator);
  }
}