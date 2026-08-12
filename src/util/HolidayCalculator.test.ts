import { describe, expect, test } from "vitest";
import { defaultPokemonHolidayStatus } from "../ui/IvCalc/Holiday/HolidayState";
import {
	calculatePokemonHolidayCost,
	calculateTotalDreamShards,
	getClusterShardValue,
} from "./HolidayCalculator";
import PokemonIv from "./PokemonIv";

describe("getClusterShardValue", () => {
	test("should return the table value for rank 1", () => {
		expect(getClusterShardValue(1, "s")).toBe(578);
		expect(getClusterShardValue(1, "m")).toBe(3468);
		expect(getClusterShardValue(1, "l")).toBe(14450);
	});

	test("should return the table value for rank 70", () => {
		expect(getClusterShardValue(70, "s")).toBe(4018);
		expect(getClusterShardValue(70, "m")).toBe(24108);
		expect(getClusterShardValue(70, "l")).toBe(100450);
	});

	test("should clamp ranks below 1 up to rank 1", () => {
		expect(getClusterShardValue(0, "s")).toBe(578);
		expect(getClusterShardValue(-5, "s")).toBe(578);
	});

	test("should clamp ranks above 70 down to rank 70", () => {
		expect(getClusterShardValue(100, "l")).toBe(100450);
	});
});

describe("calculateTotalDreamShards", () => {
	test("should return raw shards when there are no clusters", () => {
		const total = calculateTotalDreamShards({
			shards: 1000,
			clustersS: 0,
			clustersM: 0,
			clustersL: 0,
			researchRank: 1,
			candiesS: 0,
			candiesM: 0,
			candiesL: 0,
		});
		expect(total).toBe(1000);
	});

	test("should convert clusters using the research rank table", () => {
		const total = calculateTotalDreamShards({
			shards: 100,
			clustersS: 2,
			clustersM: 1,
			clustersL: 0,
			researchRank: 1,
			candiesS: 0,
			candiesM: 0,
			candiesL: 0,
		});
		// 100 + 2*578 (S at rank 1) + 1*3468 (M at rank 1)
		expect(total).toBe(100 + 2 * 578 + 1 * 3468);
	});
});

describe("calculatePokemonHolidayCost", () => {
	const iv = new PokemonIv({ pokemonName: "Bulbasaur", level: 25 });

	test("should return zero cost when levelTo is not above levelFrom", () => {
		const status = {
			...defaultPokemonHolidayStatus(),
			levelTo: 25,
		};
		const cost = calculatePokemonHolidayCost(iv, status, 25);
		expect(cost.neededCandy).toBe(0);
		expect(cost.neededShards).toBe(0);
		expect(cost.achievedLevel).toBe(25);
	});

	test("should require candy to reach a higher level and need extra when candyCount is 0", () => {
		const status = {
			...defaultPokemonHolidayStatus(),
			levelTo: 30,
			candyCount: 0,
			candyBoost: "none" as const,
		};
		const cost = calculatePokemonHolidayCost(iv, status, 25);
		expect(cost.neededCandy).toBeGreaterThan(0);
		expect(cost.neededExtra).toBe(cost.neededCandy);
	});

	test("should reach levelTo when enough candy is supplied via extraCandies", () => {
		const status = {
			...defaultPokemonHolidayStatus(),
			levelTo: 30,
			candyCount: 0,
			candyBoost: "none" as const,
		};
		const needed = calculatePokemonHolidayCost(iv, status, 25);
		const funded = calculatePokemonHolidayCost(
			iv,
			{ ...status, extraCandies: needed.neededExtra },
			25,
		);
		expect(funded.achievedLevel).toBe(30);
		expect(funded.achievedCandy).toBe(needed.neededCandy);
	});

	test("should fall short of levelTo when no candy is available", () => {
		const status = {
			...defaultPokemonHolidayStatus(),
			levelTo: 30,
			candyCount: 0,
			extraCandies: 0,
			candyBoost: "none" as const,
		};
		const cost = calculatePokemonHolidayCost(iv, status, 25);
		expect(cost.achievedLevel).toBe(25);
		expect(cost.achievedCandy).toBe(0);
	});

	test("'all' boost policy should use the candy boost for the whole climb", () => {
		const statusBoosted = {
			...defaultPokemonHolidayStatus(),
			levelTo: 30,
			candyBoost: "unlimited" as const,
			boostPolicy: "all" as const,
		};
		const statusNone = {
			...statusBoosted,
			candyBoost: "none" as const,
		};
		const boosted = calculatePokemonHolidayCost(iv, statusBoosted, 25);
		const none = calculatePokemonHolidayCost(iv, statusNone, 25);
		// Boosted candy training should require no more candy than unboosted
		expect(boosted.neededCandy).toBeLessThanOrEqual(none.neededCandy);
	});
});
