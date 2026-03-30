import { ICharacter, IWeapon, IAttackStrategy, WeaponType } from './defintion';

/**
 * Abstract base character class providing common functionality
 * This reduces code duplication and ensures consistent behavior
 */
export abstract class BaseCharacter implements ICharacter {
  public id: string;
  public name: string;
  public health: number;
  public weapon: IWeapon[];

  /**
   * Base stats that can be extended by subclasses
   */
  protected baseStats: Record<string, number> = {};

  /**
   * Attack strategy implementation by subclasses
   */
  protected abstract attackStrategy: IAttackStrategy;

  constructor(
    name: string,
    health: number,
    weapons: IWeapon[],
    idGenerator: () => string,
  ) {
    this.id = idGenerator();
    this.name = name;
    this.health = health;
    this.weapon = weapons;
  }

  /**
   * Perform an attack using a weapon
   */
  attack(weaponName?: WeaponType): void {
    const weapon = weaponName ? this.weapon.find(w => w.name === weaponName) : this.weapon[0];
    const damage = this.attackStrategy.calculateDamage(this.baseStats, weapon);
    const weaponLabel = weapon?.name || 'unarmed';
    console.log(`${this.name} attacks with ${weaponLabel}, dealing ${damage} damage!`);
  }

  /**
   * Take damage and reduce health
   */
  takeDamage(damage: number): void {
    this.health -= damage;
    console.log(`${this.name} takes ${damage} damage. Health: ${this.health}`);
  }

  /**
   * Check if character is alive
   */
  isAlive(): boolean {
    return this.health > 0;
  }
}
