import type {
	HolidaySettings,
	PokemonHolidayStatus,
} from "../ui/IvCalc/Holiday/HolidayState";
import calcExpAndCandy, { calcLevelByCandy } from "./Exp";
import { clamp } from "./NumberUtil";
import type PokemonIv from "./PokemonIv";

/**
 * Dream shards obtained from a single S/M/L shard cluster, indexed by
 * Research Rank (1-70). Index 0 is unused (rank is 1-based).
 */
const clusterShardTable: { s: number; m: number; l: number }[] = [
	{ s: 0, m: 0, l: 0 }, // unused (rank is 1-based)
	{ s: 578, m: 3468, l: 14450 },
	{ s: 594, m: 3564, l: 14850 },
	{ s: 611, m: 3666, l: 15275 },
	{ s: 629, m: 3774, l: 15725 },
	{ s: 648, m: 3888, l: 16200 },
	{ s: 668, m: 4008, l: 16700 },
	{ s: 689, m: 4134, l: 17225 },
	{ s: 711, m: 4266, l: 17775 },
	{ s: 734, m: 4404, l: 18350 },
	{ s: 758, m: 4548, l: 18950 },
	{ s: 782, m: 4692, l: 19550 },
	{ s: 807, m: 4842, l: 20175 },
	{ s: 832, m: 4992, l: 20800 },
	{ s: 858, m: 5148, l: 21450 },
	{ s: 884, m: 5304, l: 22100 },
	{ s: 912, m: 5472, l: 22800 },
	{ s: 940, m: 5640, l: 23500 },
	{ s: 970, m: 5820, l: 24250 },
	{ s: 1000, m: 6000, l: 25000 },
	{ s: 1032, m: 6192, l: 25800 },
	{ s: 1064, m: 6384, l: 26600 },
	{ s: 1098, m: 6588, l: 27450 },
	{ s: 1132, m: 6792, l: 28300 },
	{ s: 1168, m: 7008, l: 29200 },
	{ s: 1204, m: 7224, l: 30100 },
	{ s: 1242, m: 7452, l: 31050 },
	{ s: 1280, m: 7680, l: 32000 },
	{ s: 1320, m: 7920, l: 33000 },
	{ s: 1360, m: 8160, l: 34000 },
	{ s: 1402, m: 8412, l: 35050 },
	{ s: 1444, m: 8664, l: 36100 },
	{ s: 1488, m: 8928, l: 37200 },
	{ s: 1532, m: 9192, l: 38300 },
	{ s: 1578, m: 9468, l: 39450 },
	{ s: 1624, m: 9744, l: 40600 },
	{ s: 1671, m: 10026, l: 41775 },
	{ s: 1718, m: 10308, l: 42950 },
	{ s: 1766, m: 10596, l: 44150 },
	{ s: 1814, m: 10884, l: 45350 },
	{ s: 1863, m: 11178, l: 46575 },
	{ s: 1913, m: 11478, l: 47825 },
	{ s: 1963, m: 11778, l: 49075 },
	{ s: 2013, m: 12078, l: 50325 },
	{ s: 2063, m: 12378, l: 51575 },
	{ s: 2113, m: 12678, l: 52825 },
	{ s: 2169, m: 13014, l: 54225 },
	{ s: 2225, m: 13350, l: 55625 },
	{ s: 2281, m: 13686, l: 57025 },
	{ s: 2337, m: 14022, l: 58425 },
	{ s: 2393, m: 14358, l: 59825 },
	{ s: 2454, m: 14724, l: 61350 },
	{ s: 2515, m: 15090, l: 62875 },
	{ s: 2576, m: 15456, l: 64400 },
	{ s: 2637, m: 15822, l: 65925 },
	{ s: 2698, m: 16188, l: 67450 },
	{ s: 2763, m: 16578, l: 69075 },
	{ s: 2832, m: 16992, l: 70800 },
	{ s: 2905, m: 17430, l: 72625 },
	{ s: 2982, m: 17892, l: 74550 },
	{ s: 3062, m: 18372, l: 76550 },
	{ s: 3145, m: 18870, l: 78625 },
	{ s: 3231, m: 19386, l: 80775 },
	{ s: 3320, m: 19920, l: 83000 },
	{ s: 3412, m: 20472, l: 85300 },
	{ s: 3506, m: 21036, l: 87650 },
	{ s: 3602, m: 21612, l: 90050 },
	{ s: 3700, m: 22200, l: 92500 },
	{ s: 3801, m: 22806, l: 95025 },
	{ s: 3906, m: 23436, l: 97650 },
	{ s: 4018, m: 24108, l: 100450 },
];

/**
 * Get the number of dream shards a single shard cluster of the given size
 * yields at the given Research Rank.
 * @param rank Research Rank (1-70).
 * @param size Cluster size.
 * @returns Dream shards per cluster.
 */
export function getClusterShardValue(
	rank: number,
	size: "s" | "m" | "l",
): number {
	const index = clamp(1, Math.round(rank), clusterShardTable.length - 1);
	return clusterShardTable[index][size];
}

/**
 * Calculate the total dream shards available, converting shard clusters
 * to dream shards using the current Research Rank.
 * @param settings Holiday settings.
 * @returns Total dream shards available.
 */
export function calculateTotalDreamShards(settings: HolidaySettings): number {
	const rank = settings.researchRank;
	return (
		settings.shards +
		settings.clustersS * getClusterShardValue(rank, "s") +
		settings.clustersM * getClusterShardValue(rank, "m") +
		settings.clustersL * getClusterShardValue(rank, "l")
	);
}

/** Result of calculatePokemonHolidayCost. */
export type PokemonHolidayCost = {
	/** Total candy required to reach levelTo, assuming unlimited candy supply. */
	neededCandy: number;
	/** Total dream shards required to reach levelTo, assuming unlimited candy supply. */
	neededShards: number;
	/** Extra candies needed beyond candyCount to fully reach levelTo. */
	neededExtra: number;
	/** Extra candies actually contributed (clamped to neededExtra). */
	extraCandies: number;
	/** Level actually reached using candyCount + extraCandies. */
	achievedLevel: number;
	/** Candy actually spent to reach achievedLevel. */
	achievedCandy: number;
	/** Dream shards actually spent to reach achievedLevel. */
	achievedShards: number;
};

/**
 * Calculate the candy/dream shard cost for a single Pok\u00e9mon under the
 * Holiday event planner, backed by the same logic as the Candy dialog's
 * details tab (see CandyDialog.tsx -> calculateDetailCandy / calcLevelByCandy).
 *
 * Candy is spent boosted-first (per boostPolicy), then any remaining
 * distance to levelTo is leveled unboosted ("all" boosts the whole climb).
 * @param iv The Pok\u00e9mon's IV (only idForm/nature/level are used as a base).
 * @param status Holiday status for this Pok\u00e9mon.
 * @param levelFrom Effective starting level (may differ from status.levelFrom
 *                  when following the box's current level).
 * @returns Needed and achieved cost figures.
 */
export function calculatePokemonHolidayCost(
	iv: PokemonIv,
	status: PokemonHolidayStatus,
	levelFrom: number,
): PokemonHolidayCost {
	if (status.levelTo <= levelFrom) {
		return {
			neededCandy: 0,
			neededShards: 0,
			neededExtra: 0,
			extraCandies: 0,
			achievedLevel: levelFrom,
			achievedCandy: 0,
			achievedShards: 0,
		};
	}

	const ivFrom = iv.clone({ level: levelFrom });

	// Needed: candy required to fully reach levelTo, assuming unlimited candy.
	let neededCandy = 0;
	let neededShards = 0;
	if (status.candyBoost === "none") {
		const r = calcExpAndCandy(ivFrom, 0, status.levelTo, "none");
		neededCandy = r.candy;
		neededShards = r.shards;
	} else if (status.boostPolicy === "all") {
		const r = calcExpAndCandy(ivFrom, 0, status.levelTo, status.candyBoost);
		neededCandy = r.candy;
		neededShards = r.shards;
	} else {
		let phase1Level: number;
		if (status.boostPolicy === "candy") {
			const r1 = calcLevelByCandy(
				ivFrom,
				0,
				status.levelTo,
				status.boostCandyCount,
				status.candyBoost,
			);
			phase1Level = r1.level;
			neededCandy += r1.candyUsed;
			neededShards += r1.shards;
		} else {
			const boostLevel = clamp(levelFrom, status.boostLevel, status.levelTo);
			const r1 = calcExpAndCandy(ivFrom, 0, boostLevel, status.candyBoost);
			phase1Level = boostLevel;
			neededCandy += r1.candy;
			neededShards += r1.shards;
		}
		if (phase1Level < status.levelTo) {
			const ivPhase1 = iv.clone({ level: phase1Level });
			const r2 = calcExpAndCandy(ivPhase1, 0, status.levelTo, "none");
			neededCandy += r2.candy;
			neededShards += r2.shards;
		}
	}

	const neededExtra = Math.max(0, neededCandy - status.candyCount);
	const extraCandies =
		status.extraCandies < 0
			? neededExtra
			: Math.min(status.extraCandies, neededExtra);

	// Achieved: actual outcome using only candyCount + extraCandies, which may
	// fall short of levelTo if that total isn't enough.
	const totalAvailable = status.candyCount + extraCandies;
	let achievedLevel: number;
	let achievedCandy: number;
	let achievedShards: number;
	if (status.candyBoost === "none" || status.boostPolicy === "all") {
		const r = calcLevelByCandy(
			ivFrom,
			0,
			status.levelTo,
			totalAvailable,
			status.candyBoost,
		);
		achievedLevel = r.level;
		achievedCandy = r.candyUsed;
		achievedShards = r.shards;
	} else {
		let r1: ReturnType<typeof calcLevelByCandy>;
		if (status.boostPolicy === "candy") {
			r1 = calcLevelByCandy(
				ivFrom,
				0,
				status.levelTo,
				Math.min(status.boostCandyCount, totalAvailable),
				status.candyBoost,
			);
		} else {
			const boostLevel = clamp(levelFrom, status.boostLevel, status.levelTo);
			r1 = calcLevelByCandy(
				ivFrom,
				0,
				boostLevel,
				totalAvailable,
				status.candyBoost,
			);
		}
		const remaining = totalAvailable - r1.candyUsed;
		if (r1.level >= status.levelTo || remaining <= 0) {
			achievedLevel = r1.level;
			achievedCandy = r1.candyUsed;
			achievedShards = r1.shards;
		} else {
			const ivPhase1 = iv.clone({ level: r1.level });
			const r2 = calcLevelByCandy(
				ivPhase1,
				0,
				status.levelTo,
				remaining,
				"none",
			);
			achievedLevel = r2.level;
			achievedCandy = r1.candyUsed + r2.candyUsed;
			achievedShards = r1.shards + r2.shards;
		}
	}

	return {
		neededCandy,
		neededShards,
		neededExtra,
		extraCandies,
		achievedLevel,
		achievedCandy,
		achievedShards,
	};
}
