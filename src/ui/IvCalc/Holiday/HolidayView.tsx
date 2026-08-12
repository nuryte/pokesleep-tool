import { Box, Typography } from "@mui/material";
import { styled } from "@mui/system";
import React from "react";
import { useTranslation } from "react-i18next";
import type IvState from "../IvState";
import type { IvAction } from "../IvState";
import HolidaySettingsPanel from "./HolidaySettingsPanel";
import type { HolidayAction, HolidayState } from "./HolidayState";
import PokemonHolidayList from "./PokemonHolidayList";

const HolidayContainer = styled(Box)({
	display: "flex",
	flexDirection: "column",
	gap: "16px",
	padding: "16px",
});

const HolidayView = React.memo(
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

		return (
			<HolidayContainer>
				<Typography variant="h5" sx={{ fontWeight: 600 }}>
					{t("holiday")} Event Planner
				</Typography>

				<HolidaySettingsPanel
					ivState={ivState}
					holidayState={holidayState}
					holidayDispatch={holidayDispatch}
				/>

				<PokemonHolidayList
					ivState={ivState}
					ivDispatch={ivDispatch}
					holidayState={holidayState}
					holidayDispatch={holidayDispatch}
				/>
			</HolidayContainer>
		);
	},
);

HolidayView.displayName = "HolidayView";

export default HolidayView;
