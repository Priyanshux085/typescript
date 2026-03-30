import { BaseCharacter } from '../base-character';
import { IWeapon, IAttackStrategy } from '../defintion';
import { MageAttackStrategy } from '../strategies/attack-strategies';

/**
 * Mage character implementation
 * Uses mana for magical attacks
 */
export class MageCharacter extends BaseCharacter {
  override baseStats = { mana: 100 };
  protected attackStrategy: IAttackStrategy = new MageAttackStrategy();

  constructor(
    name: string,
    health: number,
    weapons: IWeapon[],
    idGenerator: () => string,
  ) {
    super(name, health, weapons, idGenerator);
  }
} 