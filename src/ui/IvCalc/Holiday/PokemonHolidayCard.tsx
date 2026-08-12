import EastIcon from "@mui/icons-material/East";
import {
	Box,
	Card,
	CardContent,
	Checkbox,
	MenuItem,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import { styled } from "@mui/system";
import React from "react";
import { useTranslation } from "react-i18next";
import { getCandyName } from "../../../data/pokemons";
import { calculatePokemonHolidayCost } from "../../../util/HolidayCalculator";
import { clamp } from "../../../util/NumberUtil";
import type { PokemonBoxItem } from "../../../util/PokemonBox";
import NumericSliderInput from "../../common/NumericSliderInput";
import SelectEx from "../../common/SelectEx";
import CandyIcon from "../../Resources/CandyIcon";
import DreamShardIcon from "../../Resources/DreamShardIcon";
import { LevelInput } from "../IvForm/LevelControl";
import PokemonIcon from "../PokemonIcon";
import {
	defaultPokemonHolidayStatus,
	type HolidayAction,
	type HolidayState,
	type PokemonHolidayStatus,
} from "./HolidayState";

const StyledCard = styled(Card)({
	borderRadius: "0.6rem",
	transition: "box-shadow 0.2s ease",
	"&:hover": {
		boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
	},
});

const CardHeader = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: "0.5rem",
	paddingBottom: "0.6rem",
	marginBottom: "0.6rem",
	borderBottom: "1px solid #e0e0e0",

	"& > div.info": {
		flex: 1,
		minWidth: 0,
		fontFamily: `"M PLUS 1p"`,
		"& > div.name": {
			fontSize: "0.9rem",
			fontWeight: "bold",
			color: "#333",
			overflow: "hidden",
			textOverflow: "ellipsis",
			whiteSpace: "nowrap",
		},
		"& > div.level": {
			fontSize: "0.75rem",
			fontWeight: "bold",
			color: "#62d540",
			display: "flex",
			alignItems: "center",
			gap: "0.2rem",
			"& > span.lv": {
				fontSize: "0.65rem",
				paddingRight: "0.1rem",
			},
			"& > svg": {
				fontSize: "0.8rem",
				color: "#999",
			},
		},
	},
});

const StyledRangeRow = styled(Box)({
	display: "flex",
	flexWrap: "wrap",
	alignItems: "center",
	justifyContent: "center",
	gap: "0.6rem",
	overflow: "hidden",
	"& > div.level": {
		minWidth: 0,
		"& > div.levelInput": {
			color: "#79d073",
			fontSize: "1rem",
			fontWeight: "bold",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			gap: "0.2rem",
			"& > span": {
				transform: "scale(1, 0.9)",
				paddingTop: "0.2rem",
			},
			"& > div.numeric": {
				width: "1.6rem",
				"& > div.MuiInput-root": {
					color: "#79d073",
					fontWeight: "bold",
					fontSize: "1.1rem !important",
					transform: "scale(1, 0.9)",
					"& > input": {
						padding: "2px 0",
						textAlign: "center",
					},
				},
			},
		},
	},
	"& > svg": {
		paddingTop: "0.3rem",
		color: "#888",
	},
});

const StyledFormSection = styled(Box)({
	display: "flex",
	alignItems: "center",
	fontSize: "0.9rem",
	"& > span.lbl": {
		marginRight: "auto",
	},
	"& > div.numeric input": {
		padding: "2px 0",
	},
});

const StyledBoostRow = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: "0.5rem",
	flexWrap: "wrap",
	"& .MuiToggleButton-root": {
		fontSize: "0.7rem",
		padding: "0.15rem 0.5rem",
		textTransform: "none",
	},
});

const StyledMaxRatio = styled(Box)({
	fontSize: "0.75rem",
	color: "#666",
	textAlign: "right",
});

const StyledBoostPolicyRow = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: "0.4rem",
	transition: "opacity 0.2s ease",
	"& > span.lbl": {
		fontSize: "0.8rem",
		display: "flex",
		alignItems: "center",
		gap: "0.2rem",
	},
	"& svg": {
		fontSize: "1rem",
		color: "#e7ba67",
	},
	"& > div": {
		display: "flex",
		alignItems: "center",
		gap: "0.2rem",
		fontSize: "0.9rem",
	},
});

const CostDisplay = styled(Box)({
	display: "flex",
	justifyContent: "space-around",
	padding: "0.5rem",
	backgroundColor: "#f5f5f5",
	borderRadius: "0.4rem",
	border: "1px solid #e0e0e0",
	"& > section": {
		display: "flex",
		alignItems: "center",
		gap: "0.3rem",
		fontSize: "0.85rem",
		fontWeight: "bold",
		"& > svg": {
			fontSize: "1rem",
		},
	},
});

const StyledFinalLevel = styled(Box)({
	textAlign: "center",
	fontSize: "0.8rem",
	fontWeight: "bold",
	color: "#d32f2f",
});

const PokemonHolidayCard = React.memo(
	({
		pokemon,
		holidayState,
		holidayDispatch,
	}: {
		pokemon: PokemonBoxItem;
		holidayState: HolidayState;
		holidayDispatch: React.Dispatch<HolidayAction>;
	}) => {
		const { t } = useTranslation();

		const status: PokemonHolidayStatus =
			holidayState.pokemonHolidayStatus.get(pokemon.id) ??
			defaultPokemonHolidayStatus();
		// -1 means the level hasn't been overridden yet, so it follows the box's level
		const levelFrom =
			status.levelFrom < 0 ? pokemon.iv.level : status.levelFrom;

		const handleToggleInclude = React.useCallback(() => {
			holidayDispatch({
				type: "togglePokemonHolidayInclude",
				payload: { id: pokemon.id },
			});
		}, [holidayDispatch, pokemon.id]);

		const handleStatusChange = React.useCallback(
			(updates: Partial<PokemonHolidayStatus>) => {
				holidayDispatch({
					type: "updatePokemonHolidayStatus",
					payload: {
						id: pokemon.id,
						status: updates,
					},
				});
			},
			[holidayDispatch, pokemon.id],
		);

		const onCandyCountChange = React.useCallback(
			(candyCount: number) => {
				handleStatusChange({ candyCount });
			},
			[handleStatusChange],
		);

		const onCandyBoostChange = React.useCallback(
			(
				_: React.MouseEvent,
				value: PokemonHolidayStatus["candyBoost"] | null,
			) => {
				if (value === null) {
					return;
				}
				handleStatusChange({ candyBoost: value });
			},
			[handleStatusChange],
		);

		const onBoostPolicyChange = React.useCallback(
			(value: string) => {
				handleStatusChange({
					boostPolicy: value as PokemonHolidayStatus["boostPolicy"],
				});
			},
			[handleStatusChange],
		);

		const onBoostCandyCountChange = React.useCallback(
			(boostCandyCount: number) => {
				handleStatusChange({ boostCandyCount });
			},
			[handleStatusChange],
		);

		const onBoostLevelChange = React.useCallback(
			(boostLevel: number) => {
				boostLevel = clamp(levelFrom, boostLevel, status.levelTo);
				handleStatusChange({ boostLevel });
			},
			[handleStatusChange, levelFrom, status.levelTo],
		);

		// Candy/shard cost calculation shared with the Grand Totals aggregation
		// (see util/HolidayCalculator.ts for the boosted-then-unboosted logic).
		const cost = React.useMemo(
			() => calculatePokemonHolidayCost(pokemon.iv, status, levelFrom),
			[pokemon.iv, status, levelFrom],
		);
		const { neededExtra, extraCandies } = cost;

		const onExtraCandiesChange = React.useCallback(
			(value: number) => {
				handleStatusChange({ extraCandies: Math.min(value, neededExtra) });
			},
			[handleStatusChange, neededExtra],
		);

		const candyName = t(
			`pokemons.${getCandyName(pokemon.iv.pokemon.id)}`,
		).replace(/ \(.+/, "");

		return (
			<StyledCard
				sx={{
					opacity: status.included ? 1 : 0.5,
				}}
			>
				<CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
					<CardHeader>
						<Checkbox
							checked={status.included}
							onChange={handleToggleInclude}
							size="small"
							sx={{
								p: 0.25,
								color: "#ccc",
								"&.Mui-checked": { color: "#79d073" },
							}}
						/>
						<PokemonIcon
							idForm={pokemon.iv.idForm}
							shiny={pokemon.iv.shiny}
							size={40}
							radius={6}
						/>
						<div className="info">
							<div className="name">{pokemon.filledNickname(t)}</div>
							<div className="level">
								<span className="lv">Lv.</span>
								{levelFrom}
								{status.levelTo !== levelFrom && (
									<>
										<EastIcon />
										{status.levelTo}
									</>
								)}
							</div>
						</div>
					</CardHeader>

					<Stack spacing={1.2}>
						<StyledRangeRow>
							<div className="level">
								<div className="levelInput">
									<span className="lbl">Lv.</span>
									<LevelInput
										showSlider
										value={levelFrom}
										onChange={(level) =>
											handleStatusChange({ levelFrom: level })
										}
									/>
								</div>
							</div>
							<EastIcon />
							<div className="level">
								<div className="levelInput">
									<span className="lbl">Lv.</span>
									<LevelInput
										showSlider
										value={status.levelTo}
										onChange={(level) => handleStatusChange({ levelTo: level })}
									/>
								</div>
							</div>
						</StyledRangeRow>

						<StyledFormSection>
							<span className="lbl">
								{t("pokemon candy", { name: candyName })}:
							</span>
							<NumericSliderInput
								sx={{ width: "3.5rem" }}
								value={status.candyCount}
								min={0}
								max={4000}
								onChange={onCandyCountChange}
								size="small"
							/>
						</StyledFormSection>

						<Box>
							<StyledFormSection>
								<span className="lbl">{t("extra candies")}:</span>
								<NumericSliderInput
									sx={{ width: "3.5rem" }}
									value={extraCandies}
									min={0}
									max={Math.max(1, neededExtra)}
									disabled={neededExtra === 0}
									onChange={onExtraCandiesChange}
									size="small"
								/>
							</StyledFormSection>
							<StyledMaxRatio>/ {neededExtra.toLocaleString()}</StyledMaxRatio>
						</Box>

						<StyledBoostRow>
							<ToggleButtonGroup
								size="small"
								exclusive
								value={status.candyBoost}
								onChange={onCandyBoostChange}
							>
								<ToggleButton value="none">{t("none")}</ToggleButton>
								<ToggleButton value="mini">
									{t("mini candy boost")}
								</ToggleButton>
								<ToggleButton value="unlimited">
									{t("normal candy boost")}
								</ToggleButton>
							</ToggleButtonGroup>
						</StyledBoostRow>

						<StyledBoostPolicyRow
							sx={{
								opacity: status.candyBoost === "none" ? 0.4 : 1,
								pointerEvents: status.candyBoost === "none" ? "none" : "auto",
							}}
						>
							<span className="lbl">
								<SelectEx
									onChange={onBoostPolicyChange}
									value={status.boostPolicy}
									disabled={status.candyBoost === "none"}
								>
									<MenuItem value="all">{t("all")} </MenuItem>
									<MenuItem value="candy">{t("number of uses")} </MenuItem>
									<MenuItem value="level">
										{t("up to specified level")}
									</MenuItem>
								</SelectEx>
								:
							</span>
							{status.boostPolicy === "all" && (
								<div>
									<CandyIcon />∞
								</div>
							)}
							{status.boostPolicy === "candy" && (
								<div>
									<CandyIcon />
									<NumericSliderInput
										sx={{ width: "3rem", fontSize: "0.9rem" }}
										min={0}
										max={4000}
										value={status.boostCandyCount}
										onChange={onBoostCandyCountChange}
									/>
								</div>
							)}
							{status.boostPolicy === "level" && (
								<>
									<span style={{ padding: "0.1rem 0.2rem 0 0" }}>Lv.</span>
									<LevelInput
										showSlider
										sx={{ width: "2rem", fontSize: "0.9rem" }}
										value={status.boostLevel}
										onChange={onBoostLevelChange}
									/>
								</>
							)}
						</StyledBoostPolicyRow>

						<CostDisplay>
							<section>
								<DreamShardIcon />
								<span>{cost.achievedShards.toLocaleString()}</span>
							</section>
							<section>
								<CandyIcon />
								<span>{cost.achievedCandy.toLocaleString()}</span>
							</section>
						</CostDisplay>

						{cost.achievedLevel < status.levelTo && (
							<StyledFinalLevel>
								{t("reaches level", { level: cost.achievedLevel })}
							</StyledFinalLevel>
						)}
					</Stack>
				</CardContent>
			</StyledCard>
		);
	},
);

PokemonHolidayCard.displayName = "PokemonHolidayCard";

export default PokemonHolidayCard;
