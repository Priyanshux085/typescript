import { BaseCharacter } from '../base-character';
import { IWeapon, IAttackStrategy } from '../defintion';
import { ArcherAttackStrategy } from '../strategies/attack-strategies';

/**
 * Archer character implementation
 * Uses agility for ranged attacks
 */
export class ArcherCharacter extends BaseCharacter {
  override baseStats = { agility: 70 };
  protected attackStrategy: IAttackStrategy = new ArcherAttackStrategy();

  constructor(
    name: string,
    health: number,
    weapons: IWeapon[],
    idGenerator: () => string,
  ) {
    super(name, health, weapons, idGenerator);
  }
}
