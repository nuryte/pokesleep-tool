import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	defaultPokemonHolidayStatus,
	getInitialHolidayState,
	type HolidayState,
	holidayStateReducer,
} from "./HolidayState";

function createBaseHolidayState(): HolidayState {
	return {
		holidaySettings: {
			shards: 0,
			clustersS: 0,
			clustersM: 0,
			clustersL: 0,
			researchRank: 65,
			candiesS: 0,
			candiesM: 0,
			candiesL: 0,
		},
		pokemonHolidayStatus: new Map(),
	};
}

describe("defaultPokemonHolidayStatus", () => {
	test("should follow the box's level by default", () => {
		const status = defaultPokemonHolidayStatus();
		expect(status.levelFrom).toBe(-1);
		expect(status.included).toBe(true);
		expect(status.extraCandies).toBe(-1);
	});
});

describe("holidayStateReducer", () => {
	let baseState: HolidayState;

	beforeEach(() => {
		baseState = createBaseHolidayState();
	});

	describe("updateHolidaySettings action", () => {
		test("should merge partial settings into the existing settings", () => {
			const newState = holidayStateReducer(baseState, {
				type: "updateHolidaySettings",
				payload: { settings: { shards: 500, researchRank: 40 } },
			});
			expect(newState.holidaySettings.shards).toBe(500);
			expect(newState.holidaySettings.researchRank).toBe(40);
			expect(newState.holidaySettings.candiesS).toBe(0);
		});

		test("should not mutate the original state", () => {
			holidayStateReducer(baseState, {
				type: "updateHolidaySettings",
				payload: { settings: { shards: 999 } },
			});
			expect(baseState.holidaySettings.shards).toBe(0);
		});
	});

	describe("updatePokemonHolidayStatus action", () => {
		test("should create a default status when none exists yet", () => {
			const newState = holidayStateReducer(baseState, {
				type: "updatePokemonHolidayStatus",
				payload: { id: 1, status: { candyCount: 200 } },
			});
			const status = newState.pokemonHolidayStatus.get(1);
			expect(status).toBeDefined();
			expect(status?.candyCount).toBe(200);
			expect(status?.included).toBe(true);
		});

		test("should merge into an existing status", () => {
			baseState.pokemonHolidayStatus.set(1, {
				...defaultPokemonHolidayStatus(),
				candyCount: 100,
				levelTo: 70,
			});
			const newState = holidayStateReducer(baseState, {
				type: "updatePokemonHolidayStatus",
				payload: { id: 1, status: { candyCount: 300 } },
			});
			const status = newState.pokemonHolidayStatus.get(1);
			expect(status?.candyCount).toBe(300);
			expect(status?.levelTo).toBe(70);
		});

		test("should not mutate the original map", () => {
			holidayStateReducer(baseState, {
				type: "updatePokemonHolidayStatus",
				payload: { id: 1, status: { candyCount: 300 } },
			});
			expect(baseState.pokemonHolidayStatus.has(1)).toBe(false);
		});
	});

	describe("togglePokemonHolidayInclude action", () => {
		test("should default to included and then toggle to excluded", () => {
			const newState = holidayStateReducer(baseState, {
				type: "togglePokemonHolidayInclude",
				payload: { id: 5 },
			});
			expect(newState.pokemonHolidayStatus.get(5)?.included).toBe(false);
		});

		test("should toggle back to included", () => {
			baseState.pokemonHolidayStatus.set(5, {
				...defaultPokemonHolidayStatus(),
				included: false,
			});
			const newState = holidayStateReducer(baseState, {
				type: "togglePokemonHolidayInclude",
				payload: { id: 5 },
			});
			expect(newState.pokemonHolidayStatus.get(5)?.included).toBe(true);
		});
	});
});

describe("getInitialHolidayState", () => {
	beforeEach(() => {
		localStorage.clear();
	});
	afterEach(() => {
		localStorage.clear();
	});

	test("should return defaults when nothing is saved", () => {
		const state = getInitialHolidayState();
		expect(state.holidaySettings.researchRank).toBe(65);
		expect(state.pokemonHolidayStatus.size).toBe(0);
	});

	test("should restore settings and per-pokemon status saved by the reducer", () => {
		const baseState = createBaseHolidayState();
		holidayStateReducer(baseState, {
			type: "updateHolidaySettings",
			payload: { settings: { shards: 1234 } },
		});
		const afterStatus = holidayStateReducer(baseState, {
			type: "updatePokemonHolidayStatus",
			payload: { id: 7, status: { candyCount: 42 } },
		});
		// simulate the two dispatches being applied to the persisted state in sequence
		holidayStateReducer(afterStatus, {
			type: "updateHolidaySettings",
			payload: { settings: { shards: 1234 } },
		});

		const restored = getInitialHolidayState();
		expect(restored.holidaySettings.shards).toBe(1234);
		expect(restored.pokemonHolidayStatus.get(7)?.candyCount).toBe(42);
	});
});
