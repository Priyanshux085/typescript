import { randomUUIDv7 } from "bun";
import {
	CharacterTypeEnum,
	ICharacter,
	ICharacterConfig,
	CharacterCreator,
	ICharacterFactoryRegistry,
} from "./defintion";
import { WarrierCharacter } from "./chars/warrier-character";
import { MageCharacter } from "./chars/mage-character";
import { ArcherCharacter } from "./chars/archer-character";
import { getWeapons } from "./config/weapon-config";
import { WeaponType } from "./defintion";

/**
 * Registry-based factory pattern
 * Eliminates switch statements and makes adding new character types trivial
 */
export class CharacterFactoryRegistry implements ICharacterFactoryRegistry {
	private creators: Map<CharacterTypeEnum, CharacterCreator> = new Map();

	private readonly defaultIdGenerator = () => randomUUIDv7();

	constructor() {
		this.registerDefaultCreators();
	}

	/**
	 * Register character creators
	 */
	register(type: CharacterTypeEnum, creator: CharacterCreator): void {
		this.creators.set(type, creator);
	}

	/**
	 * Create a character by type
	 */
	create(type: CharacterTypeEnum, config: ICharacterConfig): ICharacter {
		const creator = this.creators.get(type);
		if (!creator) {
			throw new Error(`Unknown character type: ${type}`);
		}
		return creator(config, this.defaultIdGenerator);
	}

	/**
	 * Register default character creators
	 */
	private registerDefaultCreators(): void {
		// Warrior creator
		this.register(CharacterTypeEnum.WARRIOR, (config, idGen) => {
			const weapons = getWeapons([WeaponType.SWORD, WeaponType.AXE]);
			return new WarrierCharacter(config.name, config.health, weapons, idGen);
		});

		// Mage creator
		this.register(CharacterTypeEnum.MAGE, (config, idGen) => {
			const weapons = getWeapons([WeaponType.FIREBALL, WeaponType.ICE_SPIKE]);
			return new MageCharacter(config.name, config.health, weapons, idGen);
		});

		// Archer creator
		this.register(CharacterTypeEnum.ARCHER, (config, idGen) => {
			const weapons = getWeapons([WeaponType.GUN, WeaponType.CROSSBOW]);
			return new ArcherCharacter(config.name, config.health, weapons, idGen);
		});
	}
}

/**
 * Global factory instance
 */
export const characterFactory = new CharacterFactoryRegistry();
