import type { BoostEvent } from "../../../util/Exp";
import type { BoostPolicy } from "../CandyDialog";

export type HolidayAction =
	| {
			type: "updateHolidaySettings";
			payload: { settings: Partial<HolidaySettings> };
	  }
	| {
			type: "updatePokemonHolidayStatus";
			payload: { id: number; status: Partial<PokemonHolidayStatus> };
	  }
	| {
			type: "togglePokemonHolidayInclude";
			payload: { id: number };
	  };

/** Holiday-specific settings for resource planning */
export type HolidaySettings = {
	shards: number; // Dream shards currently owned
	clustersS: number; // Dream shard S clusters
	clustersM: number; // Dream shard M clusters
	clustersL: number; // Dream shard L clusters
	researchRank: number; // Research rank (1-70), affects cluster conversion
	candiesS: number; // Handy candy S size
	candiesM: number; // Handy candy M size
	candiesL: number; // Handy candy L size
};

/** Holiday status for a single Pokémon */
export type PokemonHolidayStatus = {
	included: boolean; // Whether to include in grand total
	levelFrom: number; // Starting level
	expToGo: number; // Remaining EXP to reach the next level in levelFrom (-1 = full level)
	levelTo: number; // Target level
	candyCount: number; // Pokémon's current candy count (same as CandyDialog's pokemonCandy)
	extraCandies: number; // Extra candies to contribute from pool (-1 = default to the full needed amount)
	candyBoost: BoostEvent; // Candy boost event used for cost calculation
	boostPolicy: BoostPolicy; // How much candy is spent on the candy boost
	boostCandyCount: number; // Number of candy uses, when boostPolicy is "candy"
	boostLevel: number; // Target level for the boost, when boostPolicy is "level"
};

/** Default holiday status for a Pokémon that has no entry yet. */
export function defaultPokemonHolidayStatus(): PokemonHolidayStatus {
	return {
		included: true,
		levelFrom: -1, // -1 = follow the Pokémon's current level in the box
		expToGo: -1, // -1 = full level remaining, equivalent to starting at the level floor
		levelTo: 65,
		candyCount: 0,
		extraCandies: -1,
		candyBoost: "unlimited",
		boostPolicy: "all",
		boostCandyCount: 0,
		boostLevel: 65,
	};
}

function defaultHolidaySettings(): HolidaySettings {
	return {
		shards: 0,
		clustersS: 0,
		clustersM: 0,
		clustersL: 0,
		researchRank: 65,
		candiesS: 0,
		candiesM: 0,
		candiesL: 0,
	};
}

function normalizeFiniteNumber(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeHolidaySettings(value: unknown): HolidaySettings {
	const base = defaultHolidaySettings();
	if (typeof value !== "object" || value === null) {
		return base;
	}
	const source = value as Partial<HolidaySettings>;
	return {
		...base,
		shards: normalizeFiniteNumber(source.shards, base.shards),
		clustersS: normalizeFiniteNumber(source.clustersS, base.clustersS),
		clustersM: normalizeFiniteNumber(source.clustersM, base.clustersM),
		clustersL: normalizeFiniteNumber(source.clustersL, base.clustersL),
		researchRank: normalizeFiniteNumber(source.researchRank, base.researchRank),
		candiesS: normalizeFiniteNumber(source.candiesS, base.candiesS),
		candiesM: normalizeFiniteNumber(source.candiesM, base.candiesM),
		candiesL: normalizeFiniteNumber(source.candiesL, base.candiesL),
	};
}

function normalizePokemonHolidayStatus(value: unknown): PokemonHolidayStatus {
	const base = defaultPokemonHolidayStatus();
	if (typeof value !== "object" || value === null) {
		return base;
	}
	const source = value as Partial<PokemonHolidayStatus>;
	const status: PokemonHolidayStatus = {
		...base,
		included:
			typeof source.included === "boolean" ? source.included : base.included,
		levelFrom: normalizeFiniteNumber(source.levelFrom, base.levelFrom),
		expToGo: normalizeFiniteNumber(source.expToGo, base.expToGo),
		levelTo: normalizeFiniteNumber(source.levelTo, base.levelTo),
		candyCount: normalizeFiniteNumber(source.candyCount, base.candyCount),
		extraCandies: normalizeFiniteNumber(source.extraCandies, base.extraCandies),
		candyBoost:
			source.candyBoost === "none" ||
			source.candyBoost === "mini" ||
			source.candyBoost === "unlimited"
				? source.candyBoost
				: base.candyBoost,
		boostPolicy:
			source.boostPolicy === "all" ||
			source.boostPolicy === "candy" ||
			source.boostPolicy === "level"
				? source.boostPolicy
				: base.boostPolicy,
		boostCandyCount: normalizeFiniteNumber(
			source.boostCandyCount,
			base.boostCandyCount,
		),
		boostLevel: normalizeFiniteNumber(source.boostLevel, base.boostLevel),
	};
	return status;
}

/**
 * State for the Holiday event planner. This is fully independent from
 * IvState - IvState (box items, parameter) feeds into Holiday components as
 * read-only input, but Holiday never mutates IvState.
 */
export type HolidayState = {
	holidaySettings: HolidaySettings;
	pokemonHolidayStatus: Map<number, PokemonHolidayStatus>;
};

/** localStorage key used to persist HolidayState. */
const storageKey = "PstHolidayState";

type HolidayStateCache = {
	holidaySettings?: string; // JSON serialized HolidaySettings
	pokemonHolidayStatus?: string; // JSON serialized [id, PokemonHolidayStatus][]
};

function loadHolidayStateCache(): HolidayStateCache {
	const ret: HolidayStateCache = {};
	const settings = localStorage.getItem(storageKey);
	if (settings === null) {
		return ret;
	}
	let json: unknown;
	try {
		json = JSON.parse(settings);
	} catch {
		return ret;
	}
	if (typeof json !== "object" || json === null) {
		return ret;
	}
	if ("holidaySettings" in json && typeof json.holidaySettings === "string") {
		try {
			JSON.parse(json.holidaySettings);
			ret.holidaySettings = json.holidaySettings;
		} catch {
			// ignore deserialization error
		}
	}
	if (
		"pokemonHolidayStatus" in json &&
		typeof json.pokemonHolidayStatus === "string"
	) {
		try {
			JSON.parse(json.pokemonHolidayStatus);
			ret.pokemonHolidayStatus = json.pokemonHolidayStatus;
		} catch {
			// ignore deserialization error
		}
	}
	return ret;
}

/**
 * Save HolidayState to localStorage.
 * @param state HolidayState.
 */
function saveHolidayStateCache(state: HolidayState) {
	const cache: HolidayStateCache = {
		holidaySettings: JSON.stringify(state.holidaySettings),
		pokemonHolidayStatus: JSON.stringify(
			Array.from(state.pokemonHolidayStatus.entries()),
		),
	};
	localStorage.setItem(storageKey, JSON.stringify(cache));
}

/**
 * Get initial HolidayState object, restoring from localStorage when available.
 * @returns Initial HolidayState.
 */
export function getInitialHolidayState(): HolidayState {
	const cache = loadHolidayStateCache();

	let holidaySettings = defaultHolidaySettings();
	if (cache.holidaySettings) {
		try {
			holidaySettings = normalizeHolidaySettings(
				JSON.parse(cache.holidaySettings),
			);
		} catch {
			// keep defaults
		}
	}

	const pokemonHolidayStatus = new Map<number, PokemonHolidayStatus>();
	if (cache.pokemonHolidayStatus) {
		try {
			const entries = JSON.parse(cache.pokemonHolidayStatus) as [
				number,
				PokemonHolidayStatus,
			][];
			for (const [id, status] of entries) {
				pokemonHolidayStatus.set(id, normalizePokemonHolidayStatus(status));
			}
		} catch {
			// keep empty map
		}
	}

	return { holidaySettings, pokemonHolidayStatus };
}

export function holidayStateReducer(
	state: HolidayState,
	action: HolidayAction,
): HolidayState {
	if (action.type === "updateHolidaySettings") {
		const updatedSettings = normalizeHolidaySettings({
			...state.holidaySettings,
			...action.payload.settings,
		});
		const newState = { ...state, holidaySettings: updatedSettings };
		saveHolidayStateCache(newState);
		return newState;
	}

	if (action.type === "updatePokemonHolidayStatus") {
		const pokemonId = action.payload.id;
		const currentStatus =
			state.pokemonHolidayStatus.get(pokemonId) ??
			defaultPokemonHolidayStatus();
		const updatedStatus = normalizePokemonHolidayStatus({
			...currentStatus,
			...action.payload.status,
		});
		const newStatus = new Map(state.pokemonHolidayStatus);
		newStatus.set(pokemonId, updatedStatus);
		const newState = { ...state, pokemonHolidayStatus: newStatus };
		saveHolidayStateCache(newState);
		return newState;
	}

	if (action.type === "togglePokemonHolidayInclude") {
		const pokemonId = action.payload.id;
		const currentStatus =
			state.pokemonHolidayStatus.get(pokemonId) ??
			defaultPokemonHolidayStatus();
		const updatedStatus = normalizePokemonHolidayStatus({
			...currentStatus,
			included: !currentStatus.included,
		});
		const newStatus = new Map(state.pokemonHolidayStatus);
		newStatus.set(pokemonId, updatedStatus);
		const newState = { ...state, pokemonHolidayStatus: newStatus };
		saveHolidayStateCache(newState);
		return newState;
	}

	return state;
}
