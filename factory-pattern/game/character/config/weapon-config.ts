import { IWeapon, WeaponType } from '../defintion';

/**
 * Centralized weapon configuration
 * This makes it easy to add new weapons without changing character classes
 */
export const WEAPON_CONFIG: Record<WeaponType, IWeapon> = {
  [WeaponType.SWORD]: {
    name: WeaponType.SWORD,
    strength: 80,
    damage: 25,
  },
  [WeaponType.AXE]: {
    name: WeaponType.AXE,
    strength: 90,
    damage: 30,
  },
  [WeaponType.FIREBALL]: {
    name: WeaponType.FIREBALL,
    strength: 90,
    damage: 35,
  },
  [WeaponType.ICE_SPIKE]: {
    name: WeaponType.ICE_SPIKE,
    strength: 80,
    damage: 30,
  },
  [WeaponType.GUN]: {
    name: WeaponType.GUN,
    strength: 60,
    damage: 20,
  },
  [WeaponType.CROSSBOW]: {
    name: WeaponType.CROSSBOW,
    strength: 70,
    damage: 25,
  },
};

/**
 * Get weapon by type
 */
export function getWeapon(type: WeaponType): IWeapon {
  return WEAPON_CONFIG[type];
}

/**
 * Get weapons list by types
 */
export function getWeapons(types: WeaponType[]): IWeapon[] {
  return types.map(type => getWeapon(type));
}
