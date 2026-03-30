import { ICharacter } from './character/defintion';
import { characterFactory } from './character/factory';
import { CharacterTypeEnum } from './character/defintion';

interface Game {
  start(): void;
  listCharacters(): ICharacter[];
}

/**
 * Onyx Game
 * Manages character creation and game state
 */
export class Onyx implements Game {
  private characterList: ICharacter[] = [];

  private readonly DEFAULT_HEALTH = 100;

  /**
   * Create characters using the factory registry
   */
  private createCharacters() {
    // Create 4 warriors
    for (let i = 0; i < 4; i++) {
      const char = characterFactory.create(CharacterTypeEnum.WARRIOR, {
        name: `Warrior${i + 1}`,
        health: this.DEFAULT_HEALTH,
        weapons: [],
      });
      this.characterList.push(char);
    }

    // Create 2 mages
    for (let i = 0; i < 2; i++) {
      const char = characterFactory.create(CharacterTypeEnum.MAGE, {
        name: `Mage${i + 1}`,
        health: this.DEFAULT_HEALTH,
        weapons: [],
      });
      this.characterList.push(char);
    }

    // Create 2 archers
    for (let i = 0; i < 2; i++) {
      const char = characterFactory.create(CharacterTypeEnum.ARCHER, {
        name: `Archer${i + 1}`,
        health: this.DEFAULT_HEALTH,
        weapons: [],
      });
      this.characterList.push(char);
    }
  }

  start(): void {
    console.log('Starting Onyx...');
    this.createCharacters();
  }

  listCharacters(): ICharacter[] {
    this.characterList.forEach((char, index) => {
      console.log(`${index + 1}. ${char.name} - ${char.health} HP`);
    });
    return this.characterList;
  }
}

function main() {
  const game: Game = new Onyx();
  game.start();

  // Create a Warrior using the factory
  const newWarrior = characterFactory.create(CharacterTypeEnum.WARRIOR, {
    name: 'NewWarrior',
    health: 100,
    weapons: [],
  });
  console.log(`\nCreated character: ${newWarrior.name} with ${newWarrior.health} HP`);

  // Create a Mage using the factory
  const newMage = characterFactory.create(CharacterTypeEnum.MAGE, {
    name: 'NewMage',
    health: 100,
    weapons: [],
  });
  console.log(`Created character: ${newMage.name} with ${newMage.health} HP`);

  // Attack with the new warrior and mage
  console.log(`\n${newWarrior.name} attacks!`);
  newWarrior.attack();

  console.log(`${newMage.name} attacks!`);
  newMage.attack();

  console.log(`\n${newWarrior.name}'s weapons: ${newWarrior.weapon.map(w => w.name).join(', ')}`);
  console.log(`${newMage.name}'s weapons: ${newMage.weapon.map(w => w.name).join(', ')}`);
}

main();