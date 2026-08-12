import AddIcon from "@mui/icons-material/Add";
import {
	Box,
	Button,
	ButtonGroup,
	Fab,
	Paper,
	Typography,
} from "@mui/material";
import { styled } from "@mui/system";
import React from "react";
import { useTranslation } from "react-i18next";
import BoxFilterConfig from "../../../util/PokemonBoxFilter";
import {
	type BoxSortConfig,
	type BoxSortType,
	loadBoxSortConfig,
	sortPokemonItems,
} from "../../../util/PokemonBoxSort";
import BoxFilterDialog from "../Box/BoxFilterDialog";
import type IvState from "../IvState";
import type { IvAction } from "../IvState";
import PokemonFilterFooter, {
	type PokemonFilterFooterConfig,
} from "../PokemonFilterFooter";
import type { HolidayAction, HolidayState } from "./HolidayState";
import PokemonHolidayCard from "./PokemonHolidayCard";

const ListContainer = styled(Box)({
	display: "flex",
	flexDirection: "column",
	gap: "16px",
});

const ListHeader = styled(Box)({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
});

const FooterBar = styled(Box)({
	position: "fixed",
	bottom: 0,
	left: 0,
	width: "100%",
	margin: ".5rem 0 0",
});

const FooterInner = styled(Box)({
	paddingLeft: "1rem",
	paddingBottom: "1.2rem",
	background: "#f76",
	width: "100%",
});

const FilterButtonGroup = styled(ButtonGroup)({
	marginBottom: "12px",
	"& .MuiButton-root": {
		textTransform: "none",
		fontWeight: 500,
	},
});

const PokemonGrid = styled(Box)({
	display: "grid",
	gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
	gap: "12px",
});

type ViewMode = "all" | "included" | "excluded";

const PokemonHolidayList = React.memo(
	({
		ivState,
		ivDispatch,
		holidayState,
		holidayDispatch,
	}: {
		ivState: IvState;
		ivDispatch: React.Dispatch<IvAction>;
		holidayState: HolidayState;
		holidayDispatch: React.Dispatch<HolidayAction>;
	}) => {
		const { t } = useTranslation();
		const [viewMode, setViewMode] = React.useState<ViewMode>("all");
		const [filterConfig, setFilterConfig] = React.useState(
			() => new BoxFilterConfig({}),
		);
		const [filterOpen, setFilterOpen] = React.useState(false);
		const [sortConfig, setSortConfig] = React.useState<BoxSortConfig>(() =>
			loadBoxSortConfig(),
		);

		const onAddClick = React.useCallback(() => {
			ivDispatch({ type: "add" });
		}, [ivDispatch]);
		const onFilterButtonClick = React.useCallback(() => {
			setFilterOpen(true);
		}, []);
		const onFilterDialogClose = React.useCallback(() => {
			setFilterOpen(false);
		}, []);
		const onFilterChange = React.useCallback((value: BoxFilterConfig) => {
			setFilterConfig(value);
		}, []);
		const onFilterFooterConfigChange = React.useCallback(
			(value: PokemonFilterFooterConfig) => {
				const newValue = {
					...sortConfig,
					sort: value.sort as BoxSortType,
					descending: value.descending,
				};
				setSortConfig(newValue);
				localStorage.setItem("PstPokemonBoxParam", JSON.stringify(newValue));
			},
			[sortConfig],
		);

		// Filter Pokémon using the same box filter settings as the Box tab
		const boxFiltered = React.useMemo(
			() =>
				filterConfig.filter(ivState.box.items, ivState.parameter.evolved, t),
			[filterConfig, ivState.box.items, ivState.parameter.evolved, t],
		);

		// Sort using the same box sort settings as the Box tab
		const [sortedPokemon] = React.useMemo(
			() =>
				sortPokemonItems(
					boxFiltered,
					sortConfig.sort,
					sortConfig.descending,
					sortConfig.ingredient,
					sortConfig.mainSkill,
					ivState.parameter,
					t,
				),
			[boxFiltered, sortConfig, ivState.parameter, t],
		);

		// Filter Pokémon based on view mode
		const filteredPokemon = sortedPokemon.filter((pokemon) => {
			const status = holidayState.pokemonHolidayStatus.get(pokemon.id);
			const included = status?.included ?? true;

			switch (viewMode) {
				case "all":
					return true;
				case "included":
					return included;
				case "excluded":
					return !included;
				default:
					return true;
			}
		});

		const footerValue = React.useMemo(
			() => ({
				isFiltered: !filterConfig.isEmpty,
				sort: sortConfig.sort,
				descending: sortConfig.descending,
			}),
			[filterConfig, sortConfig],
		);
		const footerSortTypes = React.useMemo(
			() => ["level", "name", "pokedexno", "rp", "total strength", "berry"],
			[],
		);

		return (
			<ListContainer>
				<ListHeader>
					<Typography variant="h6" sx={{ fontWeight: 600 }}>
						Pokémon ({filteredPokemon.length})
					</Typography>
				</ListHeader>

				<FilterButtonGroup
					size="small"
					aria-label="pokemon view mode"
					variant="outlined"
				>
					<Button
						variant={viewMode === "all" ? "contained" : "outlined"}
						onClick={() => setViewMode("all")}
						sx={{
							color: viewMode === "all" ? "#fff" : "inherit",
							backgroundColor: viewMode === "all" ? "#79d073" : "transparent",
							borderColor: "#79d073",
							"&:hover": {
								backgroundColor:
									viewMode === "all" ? "#66bb6a" : "rgba(121, 208, 115, 0.08)",
								borderColor: "#79d073",
							},
						}}
					>
						All ({ivState.box.items.length})
					</Button>
					<Button
						variant={viewMode === "included" ? "contained" : "outlined"}
						onClick={() => setViewMode("included")}
						sx={{
							color: viewMode === "included" ? "#fff" : "inherit",
							backgroundColor:
								viewMode === "included" ? "#79d073" : "transparent",
							borderColor: "#79d073",
							"&:hover": {
								backgroundColor:
									viewMode === "included"
										? "#66bb6a"
										: "rgba(121, 208, 115, 0.08)",
								borderColor: "#79d073",
							},
						}}
					>
						Included
					</Button>
					<Button
						variant={viewMode === "excluded" ? "contained" : "outlined"}
						onClick={() => setViewMode("excluded")}
						sx={{
							color: viewMode === "excluded" ? "#fff" : "inherit",
							backgroundColor:
								viewMode === "excluded" ? "#79d073" : "transparent",
							borderColor: "#79d073",
							"&:hover": {
								backgroundColor:
									viewMode === "excluded"
										? "#66bb6a"
										: "rgba(121, 208, 115, 0.08)",
								borderColor: "#79d073",
							},
						}}
					>
						Excluded
					</Button>
				</FilterButtonGroup>

				<PokemonGrid sx={{ marginBottom: "300px" }}>
					{filteredPokemon.map((pokemon) => (
						<PokemonHolidayCard
							key={pokemon.id}
							pokemon={pokemon}
							holidayState={holidayState}
							holidayDispatch={holidayDispatch}
						/>
					))}
				</PokemonGrid>

				{filteredPokemon.length === 0 && (
					<Paper
						sx={{
							p: 3,
							textAlign: "center",
							backgroundColor: "#f5f5f5",
						}}
					>
						<Typography color="textSecondary">
							No Pokémon in this category
						</Typography>
					</Paper>
				)}

				<FooterBar>
					<Fab
						onClick={onAddClick}
						color="primary"
						size="medium"
						sx={{ position: "absolute", top: "-55px", right: "10px" }}
					>
						<AddIcon />
					</Fab>
					<FooterInner>
						<PokemonFilterFooter
							value={footerValue}
							onChange={onFilterFooterConfigChange}
							onFilterButtonClick={onFilterButtonClick}
							sortTypes={footerSortTypes}
						/>
					</FooterInner>
				</FooterBar>

				<BoxFilterDialog
					open={filterOpen}
					onClose={onFilterDialogClose}
					value={filterConfig}
					onChange={onFilterChange}
				/>
			</ListContainer>
		);
	},
);

PokemonHolidayList.displayName = "PokemonHolidayList";

export default PokemonHolidayList;
