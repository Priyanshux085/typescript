import { Onyx } from './index';

const playground = new Onyx();

playground.start();
const characters = playground.listCharacters();

/**
 * Attack with all characters to demonstrate polymorphic behavior
 */
function attackWithAllCharacters() {
  console.log('\n--- All Characters Attack ---');
  characters.forEach(char => {
    char.attack();
  });
}

attackWithAllCharacters();

