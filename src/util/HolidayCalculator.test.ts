import { describe, expect, test } from "vitest";
import { defaultPokemonHolidayStatus } from "../ui/IvCalc/Holiday/HolidayState";
import { calcExp } from "./Exp";
import {
	calculatePokemonHolidayCost,
	calculateTotalDreamShards,
	getClusterShardValue,
	sumIncludedHolidayCosts,
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

	test("should honor partial EXP remaining at the current level", () => {
		const statusBase = {
			...defaultPokemonHolidayStatus(),
			levelFrom: 30,
			levelTo: 35,
			candyCount: 0,
			extraCandies: 0,
			candyBoost: "unlimited" as const,
			boostPolicy: "level" as const,
			boostLevel: 32,
		};
		const fullLevelExp = calcExp(30, 31, iv);
		const nearlyDone = calculatePokemonHolidayCost(
			iv,
			{
				...statusBase,
				expToGo: 100,
			},
			30,
		);
		const startOfLevel = calculatePokemonHolidayCost(
			iv,
			{
				...statusBase,
				expToGo: fullLevelExp,
			},
			30,
		);
		expect(fullLevelExp).toBeGreaterThan(100);
		expect(nearlyDone.neededCandy).toBeLessThan(startOfLevel.neededCandy);
	});

	test("should report candy required to reach the specified boost level", () => {
		const status = {
			...defaultPokemonHolidayStatus(),
			levelTo: 35,
			candyBoost: "unlimited" as const,
			boostPolicy: "level" as const,
			boostLevel: 30,
		};
		const cost = calculatePokemonHolidayCost(iv, status, 25);
		expect(cost.boostedCandy).toBeGreaterThan(0);
		expect(cost.boostedCandy).toBeLessThan(cost.neededCandy);
	});

	test("should reach the target with fully funded candies at every EXP slider position", () => {
		const status = {
			...defaultPokemonHolidayStatus(),
			levelFrom: 30,
			levelTo: 35,
			candyCount: 0,
			candyBoost: "unlimited" as const,
			boostPolicy: "level" as const,
			boostLevel: 32,
		};
		const maxExpToNextLevel = calcExp(30, 31, iv);

		for (let expToGo = 1; expToGo <= maxExpToNextLevel; expToGo++) {
			const estimated = calculatePokemonHolidayCost(
				iv,
				{ ...status, expToGo, extraCandies: 0 },
				30,
			);
			const funded = calculatePokemonHolidayCost(
				iv,
				{ ...status, expToGo, extraCandies: estimated.neededExtra },
				30,
			);
			expect(funded.achievedLevel).toBe(status.levelTo);
		}
	});

	test("should report remaining EXP to go when the target is missed", () => {
		const status = {
			...defaultPokemonHolidayStatus(),
			levelFrom: 30,
			levelTo: 35,
			candyCount: 0,
			extraCandies: 0,
			candyBoost: "none" as const,
			boostPolicy: "all" as const,
			expToGo: 100,
		};
		const cost = calculatePokemonHolidayCost(iv, status, 30);
		expect(cost.achievedLevel).toBeLessThan(status.levelTo);
		expect(cost.remainingExpToGo).toBeGreaterThan(0);
	});

	test("should sum each included Pokémon's extra-candy contribution for the grand total", () => {
		const iv1 = new PokemonIv({ pokemonName: "Bulbasaur", level: 25 });
		const iv2 = new PokemonIv({ pokemonName: "Charmander", level: 25 });
		const statuses = new Map<
			number,
			ReturnType<typeof defaultPokemonHolidayStatus>
		>([
			[
				1,
				{
					...defaultPokemonHolidayStatus(),
					included: true,
					levelTo: 30,
					candyCount: 0,
					extraCandies: 4,
					candyBoost: "none",
				},
			],
			[
				2,
				{
					...defaultPokemonHolidayStatus(),
					included: true,
					levelTo: 30,
					candyCount: 0,
					extraCandies: 3,
					candyBoost: "none",
				},
			],
		]);

		const totals = sumIncludedHolidayCosts(
			[
				{ id: 1, iv: iv1 },
				{ id: 2, iv: iv2 },
			],
			statuses,
		);

		expect(totals.extraCandiesNeeded).toBe(7);
		expect(totals.extraCandiesNeeded).toBeLessThanOrEqual(
			totals.achievedCandy + 7,
		);
	});
});
