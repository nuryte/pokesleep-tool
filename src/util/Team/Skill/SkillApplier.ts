import { IngredientNames } from "../../../data/pokemons";
import { getSkillRandomRange } from "../../MainSkill";
import { addPendingEnergy, getEnergyByState } from "../TeamEnergy";
import type {
	IterationState,
	MemberProfile,
	MemberProgress,
	TeamMember,
} from "../Types";

/**
 * Apply skill effects for a triggered skill.
 *
 * Each member's energy is first advanced to tapSec so that the skill effect
 * is applied to the correct energy value at the moment of activation.
 */
export function applySkillEffect(
	member: TeamMember,
	tapSec: number,
	sim: IterationState,
): void {
	const { profile, progress } = member;
	const skillName = profile.skillName;

	switch (skillName) {
		case "Ingredient Magnet S":
		case "Ingredient Magnet S (Plus)":
		case "Ingredient Magnet S (Present)":
			addIngredientMagnet(profile.skillValue, progress);
			if (profile.skillValue2 !== 0) {
				addPlusIngredient(profile.skillValue2, member);
			}
			return;

		case "Charge Energy S":
			addEnergyTo(member.profile.index, profile.skillValue, sim);
			return;

		case "Charge Energy S (Moonlight)":
			addEnergyTo(member.profile.index, profile.skillValue, sim);
			if (Math.random() < 0.5) {
				addEnergizingCheer(tapSec, profile.skillValue, sim);
			}
			return;

		case "Charge Strength S (Random)":
			progress.skillStrength += calcChargeStrengthRandom(profile);
			break;

		case "Charge Strength S":
		case "Charge Strength S (Stockpile)":
		case "Charge Strength M":
			progress.skillStrength += profile.skillValue;
			return;

		case "Charge Strength M (Bad Dreams)":
			progress.skillStrength += profile.skillValue;
			addBadDreamsEnergy(sim);
			return;

		case "Dream Shard Magnet S":
			progress.skillDreamShards += calcDreamShardMagnetRandom(profile);
			return;

		case "Dream Shard Magnet S (Random)":
			progress.skillDreamShards += profile.skillValue;
			return;

		case "Dream Shard Magnet S (Aura Sphere)":
			progress.skillDreamShards += profile.skillValue;
			progress.skillStrength += profile.skillValue2;
			return;

		case "Energizing Cheer S":
			addEnergizingCheer(tapSec, profile.skillValue, sim);
			return;

		case "Energizing Cheer S (Nuzzle)": {
			const index = addEnergizingCheer(tapSec, profile.skillValue, sim);
			addSkillActivationBonus(profile.iv.skillLevel, index, sim);
			return;
		}

		case "Energizing Cheer S (Heal Pulse)":
			addHealPulse(tapSec, profile, sim);
			return;

		case "Energy for Everyone S":
		case "Energy for Everyone S (Berry Juice)":
			addEnergyToAll(profile.skillValue, sim);
			return;

		case "Energy for Everyone S (Lunar Blessing)":
			addEnergyToAll(profile.skillValue, sim);
			progress.skillStrength += profile.skillValue2;
			return;

		case "Extra Helpful S":
			addExtraHelpful(profile.skillValue, sim);
			break;

		default:
			break;
	}
}

function addIngredientMagnet(count: number, progress: MemberProgress): void {
	for (const ing of IngredientNames) {
		const current = progress.ingCounts.get(ing) ?? 0;
		progress.ingCounts.set(ing, current + count / IngredientNames.length);
	}
}

function addPlusIngredient(count: number, member: TeamMember): void {
	const { profile, progress } = member;
	const ing = profile.iv.ingredient1.name;
	const current = progress.ingCounts.get(ing) ?? 0;
	progress.ingCounts.set(ing, current + count);
}

function addBadDreamsEnergy(sim: IterationState): void {
	for (let i = 0; i < sim.members.length; i++) {
		const member = sim.members[i];
		if (member.profile.iv.pokemon.type === "dark") {
			continue;
		}
		addPendingEnergy(sim, i, -12);
	}
}

function addEnergyToAll(diff: number, sim: IterationState): void {
	for (let i = 0; i < sim.members.length; i++) {
		addEnergyTo(i, diff * sim.members[i].profile.energyRecoveryFactor, sim);
	}
}

function addEnergyTo(i: number, diff: number, sim: IterationState): void {
	addPendingEnergy(sim, i, diff * sim.members[i].profile.energyRecoveryFactor);
}

function addEnergizingCheer(
	tapSec: number,
	diff: number,
	sim: IterationState,
	rand?: number,
): number {
	const energies = sim.members.map(({ progress }, index) => ({
		energy: getEnergyByState(progress, tapSec),
		progress: progress,
		index,
	}));

	const _rand = rand ?? Math.random();
	const border = 0.65;
	if (_rand < border) {
		// 65% chance to target min energy member
		const minEnergy = Math.min(...energies.map((e) => e.energy));
		const candidates = energies.filter((e) => e.energy === minEnergy);
		const index =
			candidates[Math.floor((_rand / border) * candidates.length)].index;
		addEnergyTo(
			index,
			diff * sim.members[index].profile.energyRecoveryFactor,
			sim,
		);
		return index;
	} else {
		// 35% chance to select target from all members
		const index = Math.floor((_rand - border) * energies.length);
		addEnergyTo(
			index,
			diff * sim.members[index].profile.energyRecoveryFactor,
			sim,
		);
		return index;
	}
}

function addHealPulse(
	tapSec: number,
	profile: Readonly<MemberProfile>,
	sim: IterationState,
): void {
	// find first target
	const index1 = addEnergizingCheer(tapSec, profile.skillValue, sim);

	//create temporary sim object excluding index member
	const sim2 = { ...sim };
	sim2.members = [...sim.members];
	sim2.members.splice(index1, 1);

	// find second target
	const index2 = addEnergizingCheer(tapSec, profile.skillValue, sim2);

	// add help count
	const helpCount = profile.skillValue2;
	sim.members[index1].progress.pendingExtraHelp += helpCount;
	sim.members[index2].progress.pendingExtraHelp += helpCount;
}

function addExtraHelpful(count: number, sim: IterationState): void {
	const index = Math.floor(Math.random() * sim.members.length);
	sim.members[index].progress.pendingExtraHelp += count;
}

function calcChargeStrengthRandom(profile: MemberProfile): number {
	const [min, max] = getSkillRandomRange(profile.skillName, profile.skillLevel);
	const rand = Math.floor(Math.random() * 151);
	const value = min + ((max - min) * rand) / 150;
	return Math.ceil(value * profile.bonus.dreamShard);
}

function calcDreamShardMagnetRandom(profile: MemberProfile): number {
	const [min, max] = getSkillRandomRange(profile.skillName, profile.skillLevel);
	const rand = Math.floor(Math.random() * 151);
	const value = min + ((max - min) * rand) / 150;
	return Math.ceil(value * profile.bonus.dreamShard);
}

function addSkillActivationBonus(
	index: number,
	skillLevel: number,
	sim: IterationState,
): void {
	const target = sim.members[index].profile.iv;
	const count = skillLevel + 1;
	const p = 1 - (1 - target.skillRate) ** count;
	const rand = Math.random();
	if (rand > p) {
		return;
	}

	// add activation bonus
	sim.members[index].progress.hasMainSkillActivationBonus = true;
}

/**
 * Apply pre-computed skill strength values to progresses after each iteration,
 * using the final skillCount per member.
 */
export function applySkillValue(
	profiles: MemberProfile[],
	progresses: MemberProgress[],
): void {
	for (let i = 0; i < profiles.length; i++) {
		const profile = profiles[i];
		const skillCount = progresses[i].skillCount;
		if (skillCount === 0) continue;

		if (profile.skillValue !== 0) {
			progresses[i].skillStrength += profile.skillValue * skillCount;
		}
		if (profile.skillValue2 !== 0) {
			for (let j = 0; j < profiles.length; j++) {
				progresses[j].skillStrength += profile.skillValue2 * skillCount;
			}
		}
	}
}
