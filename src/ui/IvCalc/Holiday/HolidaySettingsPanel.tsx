import { Box, InputAdornment, Paper, Typography } from "@mui/material";
import { styled } from "@mui/system";
import React from "react";
import { useTranslation } from "react-i18next";
import {
	calculatePokemonHolidayCost,
	calculateTotalDreamShards,
} from "../../../util/HolidayCalculator";
import NumericSliderInput from "../../common/NumericSliderInput";
import DreamShardIcon from "../../Resources/DreamShardIcon";
import type IvState from "../IvState";
import {
	defaultPokemonHolidayStatus,
	type HolidayAction,
	type HolidayState,
} from "./HolidayState";

const SettingsPaper = styled(Paper)({
	padding: "1rem",
	borderRadius: "0.6rem",
	backgroundColor: "#fafafa",
});

const PanelHeader = styled(Box)({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	marginBottom: "0.6rem",
});

const ColumnGrid = styled(Box)({
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
	alignItems: "stretch",
	gap: "0.8rem",
});

const Column = styled(Box)({
	display: "flex",
	flexDirection: "column",
	padding: "0.7rem",
	backgroundColor: "#fff",
	border: "1px solid #e0e0e0",
	borderRadius: "0.5rem",
	boxSizing: "border-box",
});

const ColumnTitle = styled(Typography)({
	fontSize: "0.85rem",
	fontWeight: 600,
	color: "#333",
	marginBottom: "0.5rem",
});

const StyledSection = styled(Box)({
	marginTop: "0.8rem",
	"&:first-of-type": {
		marginTop: 0,
	},
	"& > span.lbl": {
		display: "block",
		fontSize: "0.85rem",
		fontWeight: 600,
		color: "#333",
		marginBottom: "0.5rem",
	},
});

const StyledClusterRow = styled(Box)({
	display: "grid",
	gridTemplateColumns: "repeat(3, 1fr)",
	gap: "0.6rem",
	"& .numeric": {
		"& .MuiInputAdornment-root > p": {
			fontSize: "0.8rem",
			fontWeight: "bold",
			color: "#79d073",
		},
	},
	"& > footer": {
		fontSize: "0.7rem",
		textAlign: "center",
		color: "#79d073",
		fontWeight: "bold",
		opacity: 0.8,
	},
});

const ClusterRankRow = styled(Box)({
	display: "grid",
	gridTemplateColumns: "2fr 1fr",
	gap: "0.8rem",
	alignItems: "start",
});

const TotalRow = styled(Box)({
	marginTop: "auto",
	paddingTop: "0.8rem",
	display: "grid",
	gridTemplateColumns: "1fr auto 1fr auto 1fr",
	alignItems: "center",
	gap: "0.3rem",
});

const TotalOperator = styled(Box)({
	fontSize: "1rem",
	fontWeight: 600,
	color: "#999",
	textAlign: "center",
});

const TotalItem = styled(Box)({
	padding: "0.5rem",
	backgroundColor: "#e8f5e9",
	border: "1px solid #79d073",
	borderRadius: "0.4rem",
	textAlign: "center",
});

const HolidaySettingsPanel = React.memo(
	({
		ivState,
		holidayState,
		holidayDispatch,
	}: {
		ivState: IvState;
		holidayState: HolidayState;
		holidayDispatch: React.Dispatch<HolidayAction>;
	}) => {
		const { t } = useTranslation();
		const settings = holidayState.holidaySettings;

		const handleShardsChange = (value: number) => {
			holidayDispatch({
				type: "updateHolidaySettings",
				payload: { settings: { shards: value } },
			});
		};

		const handleClustersChange = (
			type: "clustersS" | "clustersM" | "clustersL",
			value: number,
		) => {
			holidayDispatch({
				type: "updateHolidaySettings",
				payload: { settings: { [type]: value } },
			});
		};

		const handleResearchRankChange = (value: number) => {
			const rank = Math.min(70, Math.max(1, value));
			holidayDispatch({
				type: "updateHolidaySettings",
				payload: { settings: { researchRank: rank } },
			});
		};

		const handleCandiesChange = (
			type: "candiesS" | "candiesM" | "candiesL",
			value: number,
		) => {
			holidayDispatch({
				type: "updateHolidaySettings",
				payload: { settings: { [type]: value } },
			});
		};

		// Calculate totals for display
		const totalCandies =
			settings.candiesS * 3 + settings.candiesM * 20 + settings.candiesL * 100;
		const totalShards = calculateTotalDreamShards(settings);

		// Sum the actual cost (achieved candy/shards) of every included Pokémon
		const { neededShards, neededCandies } = React.useMemo(() => {
			let shards = 0;
			let candies = 0;
			for (const item of ivState.box.items) {
				const status =
					holidayState.pokemonHolidayStatus.get(item.id) ??
					defaultPokemonHolidayStatus();
				if (!status.included) {
					continue;
				}
				const levelFrom =
					status.levelFrom < 0 ? item.iv.level : status.levelFrom;
				const cost = calculatePokemonHolidayCost(item.iv, status, levelFrom);
				shards += cost.achievedShards;
				candies += cost.achievedCandy;
			}
			return { neededShards: shards, neededCandies: candies };
		}, [ivState.box.items, holidayState.pokemonHolidayStatus]);

		const availableShards = totalShards - neededShards;
		const availableCandies = totalCandies - neededCandies;

		return (
			<SettingsPaper>
				<PanelHeader>
					<Typography variant="h6" sx={{ fontSize: "1.1rem" }}>
						{t("global resources")}
					</Typography>
				</PanelHeader>

				<ColumnGrid>
					<Column>
						<ColumnTitle>{t("dream shard")}</ColumnTitle>

						<StyledSection>
							<NumericSliderInput
								value={settings.shards}
								min={0}
								max={9999999}
								onChange={handleShardsChange}
								startAdornment={
									<InputAdornment position="start">
										<DreamShardIcon sx={{ color: "#79d073" }} />
									</InputAdornment>
								}
							/>
						</StyledSection>

						<StyledSection>
							<ClusterRankRow>
								<Box>
									<span className="lbl">{t("shard cluster")}</span>
									<StyledClusterRow>
										<NumericSliderInput
											value={settings.clustersS}
											min={0}
											sliderMax={999}
											onChange={(v) => handleClustersChange("clustersS", v)}
											startAdornment={
												<InputAdornment position="start">S</InputAdornment>
											}
										/>
										<NumericSliderInput
											value={settings.clustersM}
											min={0}
											sliderMax={500}
											onChange={(v) => handleClustersChange("clustersM", v)}
											startAdornment={
												<InputAdornment position="start">M</InputAdornment>
											}
										/>
										<NumericSliderInput
											value={settings.clustersL}
											min={0}
											sliderMax={100}
											onChange={(v) => handleClustersChange("clustersL", v)}
											startAdornment={
												<InputAdornment position="start">L</InputAdornment>
											}
										/>
									</StyledClusterRow>
								</Box>

								<Box>
									<span className="lbl">{t("research rank")}</span>
									<NumericSliderInput
										value={settings.researchRank}
										min={1}
										max={70}
										onChange={handleResearchRankChange}
									/>
								</Box>
							</ClusterRankRow>
						</StyledSection>

						<TotalRow>
							<TotalItem>
								<Typography variant="caption" color="textSecondary">
									{t("total dream shards")}
								</Typography>
								<Typography
									variant="h6"
									sx={{ color: "#2e7d32", fontWeight: 600 }}
								>
									{totalShards.toLocaleString()}
								</Typography>
							</TotalItem>
							<TotalOperator>−</TotalOperator>
							<TotalItem>
								<Typography variant="caption" color="textSecondary">
									{t("dream shards needed")}
								</Typography>
								<Typography
									variant="h6"
									sx={{ color: "#79d073", fontWeight: 600 }}
								>
									{neededShards.toLocaleString()}
								</Typography>
							</TotalItem>
							<TotalOperator>=</TotalOperator>
							<TotalItem>
								<Typography variant="caption" color="textSecondary">
									{t("dream shards available")}
								</Typography>
								<Typography
									variant="h6"
									sx={{
										color: availableShards >= 0 ? "#2e7d32" : "#d32f2f",
										fontWeight: 600,
									}}
								>
									{availableShards.toLocaleString()}
								</Typography>
							</TotalItem>
						</TotalRow>
					</Column>

					<Column>
						<ColumnTitle>{t("handy candy")}</ColumnTitle>

						<StyledSection>
							<StyledClusterRow>
								<NumericSliderInput
									value={settings.candiesS}
									min={0}
									sliderMax={999}
									onChange={(v) => handleCandiesChange("candiesS", v)}
									startAdornment={
										<InputAdornment position="start">S</InputAdornment>
									}
								/>
								<NumericSliderInput
									value={settings.candiesM}
									min={0}
									sliderMax={500}
									onChange={(v) => handleCandiesChange("candiesM", v)}
									startAdornment={
										<InputAdornment position="start">M</InputAdornment>
									}
								/>
								<NumericSliderInput
									value={settings.candiesL}
									min={0}
									sliderMax={100}
									onChange={(v) => handleCandiesChange("candiesL", v)}
									startAdornment={
										<InputAdornment position="start">L</InputAdornment>
									}
								/>
								<footer>×3</footer>
								<footer>×20</footer>
								<footer>×100</footer>
							</StyledClusterRow>
						</StyledSection>

						<TotalRow>
							<TotalItem>
								<Typography variant="caption" color="textSecondary">
									{t("total extra candies")}
								</Typography>
								<Typography
									variant="h6"
									sx={{ color: "#2e7d32", fontWeight: 600 }}
								>
									{totalCandies.toLocaleString()}
								</Typography>
							</TotalItem>
							<TotalOperator>−</TotalOperator>
							<TotalItem>
								<Typography variant="caption" color="textSecondary">
									{t("extra candies needed")}
								</Typography>
								<Typography
									variant="h6"
									sx={{ color: "#f57c00", fontWeight: 600 }}
								>
									{neededCandies.toLocaleString()}
								</Typography>
							</TotalItem>
							<TotalOperator>=</TotalOperator>
							<TotalItem>
								<Typography variant="caption" color="textSecondary">
									{t("extra candies available")}
								</Typography>
								<Typography
									variant="h6"
									sx={{
										color: availableCandies >= 0 ? "#2e7d32" : "#d32f2f",
										fontWeight: 600,
									}}
								>
									{availableCandies.toLocaleString()}
								</Typography>
							</TotalItem>
						</TotalRow>
					</Column>
				</ColumnGrid>
			</SettingsPaper>
		);
	},
);

HolidaySettingsPanel.displayName = "HolidaySettingsPanel";

export default HolidaySettingsPanel;
