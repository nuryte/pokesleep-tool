import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import EastIcon from "@mui/icons-material/East";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import IosShareIcon from "@mui/icons-material/IosShare";
import MoreIcon from "@mui/icons-material/MoreVert";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import {
	Box,
	Card,
	CardContent,
	Checkbox,
	IconButton,
	InputAdornment,
	ListItemIcon,
	Menu,
	MenuItem,
	MenuList,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
} from "@mui/material";
import { styled } from "@mui/system";
import React from "react";
import { useTranslation } from "react-i18next";
import { getCandyName } from "../../../data/pokemons";
import { calcExp } from "../../../util/Exp";
import { calculatePokemonHolidayCost } from "../../../util/HolidayCalculator";
import { clamp } from "../../../util/NumberUtil";
import type { PokemonBoxItem } from "../../../util/PokemonBox";
import NumericSliderInput from "../../common/NumericSliderInput";
import SelectEx from "../../common/SelectEx";
import SliderEx from "../../common/SliderEx";
import CandyIcon from "../../Resources/CandyIcon";
import DreamShardIcon from "../../Resources/DreamShardIcon";
import CandyDialog from "../CandyDialog";
import { LevelInput } from "../IvForm/LevelControl";
import type { IvAction } from "../IvState";
import PokemonIcon from "../PokemonIcon";
import { shareIv } from "../ShareUtil";
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

const StyledExpSlider = styled(SliderEx)({
	color: "#79d073",
	height: 8,
	"@media (pointer: coarse)": {
		padding: 0,
	},
	padding: 0,
	"& .MuiSlider-thumb": {
		width: "14px",
		height: "13px",
		"&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
			boxShadow: "inherit",
		},
		"&::before": {
			display: "none",
		},
	},
	"& .MuiSlider-rail": {
		backgroundColor: "#ccc",
	},
});

const StyledExpFormSection = styled(Box)({
	width: "50%",
	alignSelf: "flex-start",
	"& > div.expLeft": {
		width: "100%",
		display: "flex",
		flexDirection: "column",
		gap: "0.15rem",
		paddingTop: "0.2rem",
		"& > div.numeric": {
			width: "100%",
		},
		"& > div.numeric > div.MuiInput-root": {
			"& > div.MuiInputAdornment-root > p": {
				color: "#79d073",
				fontSize: "0.6rem",
				fontWeight: "bold",
				transform: "scale(1, 0.9)",
			},
			"& > input": {
				padding: 0,
				minWidth: "5ch",
				textAlign: "right",
				fontSize: "0.8rem",
				fontWeight: "bold",
				transform: "scale(1, 0.9)",
			},
		},
	},
	"& > span.lbl": {
		fontSize: "0.7rem",
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
	"& > div.boostLevel": {
		alignItems: "flex-start",
		flexDirection: "column",
		gap: "0.1rem",
	},
	"& div.boostLevelTarget": {
		display: "flex",
		alignItems: "center",
	},
	"& div.boostedCandies": {
		color: "#666",
		fontSize: "0.65rem",
		fontWeight: "bold",
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
		ivDispatch,
		holidayState,
		holidayDispatch,
	}: {
		pokemon: PokemonBoxItem;
		ivDispatch: React.Dispatch<IvAction>;
		holidayState: HolidayState;
		holidayDispatch: React.Dispatch<HolidayAction>;
	}) => {
		const { t } = useTranslation();
		const [moreMenuAnchor, setMoreMenuAnchor] =
			React.useState<HTMLElement | null>(null);
		const [candyOpen, setCandyOpen] = React.useState(false);
		const isMoreMenuOpen = Boolean(moreMenuAnchor);

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

		const onMoreIconClick = React.useCallback(
			(event: React.MouseEvent<HTMLElement>) => {
				setMoreMenuAnchor(event.currentTarget);
			},
			[],
		);
		const onMoreMenuClose = React.useCallback(() => {
			setMoreMenuAnchor(null);
		}, []);
		const onBoxActionClick = React.useCallback(
			(type: "dup" | "remove") => {
				ivDispatch({ type, payload: { id: pokemon.id } });
				setMoreMenuAnchor(null);
			},
			[ivDispatch, pokemon.id],
		);
		const onEditClick = React.useCallback(() => {
			ivDispatch({ type: "select", payload: { id: pokemon.id } });
			ivDispatch({ type: "edit", payload: { id: pokemon.id } });
			setMoreMenuAnchor(null);
		}, [ivDispatch, pokemon.id]);
		const onShareClick = React.useCallback(() => {
			setMoreMenuAnchor(null);
			shareIv(pokemon.iv, ivDispatch, t);
		}, [ivDispatch, pokemon.iv, t]);
		const onCandyClick = React.useCallback(() => {
			setMoreMenuAnchor(null);
			setCandyOpen(true);
		}, []);
		const onCandyDialogClose = React.useCallback(() => {
			setCandyOpen(false);
		}, []);
		const onCandyIvChange = React.useCallback(
			(iv) => {
				ivDispatch({ type: "updateIv", payload: { iv } });
			},
			[ivDispatch],
		);

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

		const maxExpToNextLevel = React.useMemo(
			() => calcExp(levelFrom, levelFrom + 1, pokemon.iv),
			[levelFrom, pokemon.iv],
		);
		const expToGo = status.expToGo < 0 ? maxExpToNextLevel : status.expToGo;

		const onExpGotChange = React.useCallback(
			(value: number) => {
				const expGot = clamp(0, value, maxExpToNextLevel - 1);
				handleStatusChange({ expToGo: maxExpToNextLevel - expGot });
			},
			[handleStatusChange, maxExpToNextLevel],
		);

		const onExpToGoChange = React.useCallback(
			(value: number) => {
				const clamped = clamp(1, value, maxExpToNextLevel);
				handleStatusChange({ expToGo: clamped });
			},
			[handleStatusChange, maxExpToNextLevel],
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
		const safeNeededExtra = Number.isFinite(cost.neededExtra)
			? Math.max(0, cost.neededExtra)
			: 0;
		const safeExtraCandies = Number.isFinite(cost.extraCandies)
			? cost.extraCandies
			: 0;

		const onExtraCandiesChange = React.useCallback(
			(value: number) => {
				handleStatusChange({
					extraCandies: Math.min(
						Number.isFinite(value) ? value : 0,
						safeNeededExtra,
					),
				});
			},
			[handleStatusChange, safeNeededExtra],
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
						<IconButton
							onClick={onMoreIconClick}
							size="small"
							aria-label={t("more")}
						>
							<MoreIcon />
						</IconButton>
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

						<StyledExpFormSection>
							<div className="expLeft">
								<StyledExpSlider
									value={maxExpToNextLevel - expToGo}
									min={0}
									max={Math.max(0, maxExpToNextLevel - 1)}
									onChange2={onExpGotChange}
								/>
								<NumericSliderInput
									sx={{ width: "100%" }}
									value={expToGo}
									size="small"
									startAdornment={
										<InputAdornment position="start">
											{t("exp to go1")}
										</InputAdornment>
									}
									endAdornment={
										<InputAdornment position="end">
											{t("exp to go2")}
										</InputAdornment>
									}
									min={1}
									max={maxExpToNextLevel}
									onChange={onExpToGoChange}
								/>
							</div>
						</StyledExpFormSection>

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
									value={safeExtraCandies}
									min={0}
									max={Math.max(1, safeNeededExtra)}
									disabled={safeNeededExtra === 0}
									onChange={onExtraCandiesChange}
									size="small"
								/>
							</StyledFormSection>
							<StyledMaxRatio>
								/ {safeNeededExtra.toLocaleString()}
							</StyledMaxRatio>
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
								<div className="boostLevel">
									<div className="boostLevelTarget">
										<span style={{ padding: "0.1rem 0.2rem 0 0" }}>Lv.</span>
										<LevelInput
											showSlider
											sx={{ width: "2rem", fontSize: "0.9rem" }}
											value={status.boostLevel}
											onChange={onBoostLevelChange}
										/>
									</div>
									<div className="boostedCandies">
										{t("boosted candies")}: {cost.boostedCandy.toLocaleString()}
									</div>
								</div>
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
				<Menu
					anchorEl={moreMenuAnchor}
					open={isMoreMenuOpen}
					onClose={onMoreMenuClose}
					anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				>
					<MenuList>
						<MenuItem onClick={onEditClick}>
							<ListItemIcon>
								<EditNoteOutlinedIcon />
							</ListItemIcon>
							{t("edit")}
						</MenuItem>
						<MenuItem onClick={onCandyClick}>
							<ListItemIcon sx={{ minWidth: "24px" }}>
								<CandyIcon sx={{ color: "#888" }} />
							</ListItemIcon>
							{t("candy")}
						</MenuItem>
						<MenuItem onClick={onShareClick}>
							<ListItemIcon>
								<IosShareIcon />
							</ListItemIcon>
							{t("share")}
						</MenuItem>
						<MenuItem onClick={() => onBoxActionClick("dup")}>
							<ListItemIcon>
								<ContentCopyOutlinedIcon />
							</ListItemIcon>
							{t("duplicate")}
						</MenuItem>
						<MenuItem onClick={() => onBoxActionClick("remove")}>
							<ListItemIcon sx={{ minWidth: "24px" }}>
								<RemoveCircleOutlineOutlinedIcon />
							</ListItemIcon>
							{t("delete")}
						</MenuItem>
					</MenuList>
				</Menu>
				<CandyDialog
					iv={pokemon.iv}
					open={candyOpen}
					onChange={onCandyIvChange}
					onClose={onCandyDialogClose}
				/>
			</StyledCard>
		);
	},
);

PokemonHolidayCard.displayName = "PokemonHolidayCard";

export default PokemonHolidayCard;
