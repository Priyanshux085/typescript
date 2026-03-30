import { characterFactory } from './factory';
import { CharacterTypeEnum } from './defintion';

/**
 * Example usage of the new factory registry pattern
 */

// Create a warrior with default name
const warrior = characterFactory.create(CharacterTypeEnum.WARRIOR, {
  name: 'Aragorn',
  health: 100,
  weapons: [],
});

// Create a named mage
const mage = characterFactory.create(CharacterTypeEnum.MAGE, {
  name: 'Gandalf',
  health: 100,
  weapons: [],
});

// Create a named archer
const archer = characterFactory.create(CharacterTypeEnum.ARCHER, {
  name: 'Legolas',
  health: 100,
  weapons: [],
});

console.log('\n--- Character Attacks ---\n');
warrior.attack();
mage.attack();
archer.attack();

console.log('\n--- Character Details ---\n');
console.log(warrior);
console.log(mage);
console.log(archer);
