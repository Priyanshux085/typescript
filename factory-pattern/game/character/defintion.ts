/**
 * Weapon enumeration for type safety
 */
export enum WeaponType {
  SWORD = 'Sword',
  AXE = 'Axe',
  FIREBALL = 'Fireball',
  ICE_SPIKE = 'Ice Spike',
  GUN = 'Gun',
  CROSSBOW = 'Crossbow',
}

/**
 * Character type enumeration
 */
export enum CharacterTypeEnum {
  WARRIOR = 'Warrior',
  MAGE = 'Mage',
  ARCHER = 'Archer',
}

export type CharacterType = keyof typeof CharacterTypeEnum;

/**
 * Weapon configuration interface
 */
export interface IWeapon {
  name: WeaponType;
  strength: number;
  damage: number;
}

/**
 * Character instance interface
 */
export interface ICharacter {
  id: string;
  name: string;
  health: number;
  weapon: IWeapon[];
  attack(weaponName?: WeaponType): void;
  takeDamage(damage: number): void;
  isAlive(): boolean;
}

/**
 * Character configuration for factory creation
 */
export interface ICharacterConfig {
  name: string;
  health: number;
  weapons: IWeapon[];
}

/**
 * Attack strategy interface for polymorphic attack behavior
 */
export interface IAttackStrategy {
  calculateDamage(baseStats: Record<string, number>, weapon?: IWeapon): number;
}

/**
 * Factory creator interface - part of the registry pattern
 */
export type CharacterCreator = (config: ICharacterConfig, idGenerator: () => string) => ICharacter;

/**
 * Factory registry interface
 */
export interface ICharacterFactoryRegistry {
  register(type: CharacterTypeEnum, creator: CharacterCreator): void;
  create(type: CharacterTypeEnum, config: ICharacterConfig): ICharacter;
}