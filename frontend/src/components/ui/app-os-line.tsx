import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import {
  Box,
  CardActionArea,
  Collapse,
  Divider,
  List,
  Paper,
  Typography,
} from "@mui/material";
import React from "react";
import { useListenUptime } from "../../data/query/use-listen-uptime";
import {
  DeviceAppSlug,
  DeviceOSSlug,
  NetAccess,
} from "../../data/types/get-devices";
import { AccessLine } from "./access-line";
import { AppOSIcon } from "./app-os-icon/app-icon";
import { getPageOrigin } from "../navigation/utils/get-page-origin";

type AppOSLineProps = {
  slug: DeviceAppSlug | DeviceOSSlug;
  metaIcon?: string;
  name: string;
  description: string;
  mainAccess?: NetAccess;
  accessList?: NetAccess[];
};

export const AppOSLine: React.FC<React.PropsWithChildren<AppOSLineProps>> = ({
  slug,
  metaIcon,
  name,
  description,
  mainAccess,
  accessList = [],
  children,
}) => {
  const uptimeMap = useListenUptime().data ?? {};

  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const origin = getPageOrigin();

  const mainAccessHref = mainAccess?.href;
  const sameOrigin = mainAccessHref === origin;

  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <AppOSIcon
          slug={slug}
          metaIcon={metaIcon}
          sx={{
            width: 32,
            height: "fit-content",
          }}
        />

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body1" fontWeight={500}>
            {name}
          </Typography>
          <Typography variant="body2">{description}</Typography>
        </Box>
      </Box>

      {mainAccess && (
        <>
          <Divider variant="fullWidth" />

          <AccessLine
            {...mainAccess}
            disablePadding
            uptime={uptimeMap[mainAccess.href]}
          />
        </>
      )}
    </Box>
  );

  return (
    <Paper
      data-slug={slug}
      elevation={mainAccess && !sameOrigin ? 2 : 1}
      sx={{
        position: "relative",
        ...(mainAccess && !sameOrigin
          ? {}
          : {
              boxShadow: "none",
            }),
      }}
    >
      {mainAccess ? (
        <Box
          sx={{
            display: "flex",
          }}
        >
          <CardActionArea
            onClick={() => {
              if (mainAccess.type === "web") {
                window.open(mainAccess.href, "_blank");
              }
            }}
            disabled={sameOrigin}
          >
            {content}
          </CardActionArea>

          {accessList.length > 0 && (
            <>
              <Divider orientation="vertical" flexItem />

              <Box sx={{ display: "flex" }}>
                <CardActionArea
                  onClick={handleExpandClick}
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                  }}
                >
                  <Box sx={{ px: 1, py: 2 }}>
                    {expanded ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                  </Box>
                </CardActionArea>
              </Box>
            </>
          )}
        </Box>
      ) : (
        content
      )}

      {accessList.length > 0 && (
        <Collapse in={expanded} timeout="auto">
          <List disablePadding>
            {accessList.map((access, i) => (
              <AccessLine
                key={i}
                {...access}
                link={access.href !== origin}
                uptime={uptimeMap[access.href]}
              />
            ))}
          </List>
        </Collapse>
      )}

      {children}
    </Paper>
  );
};
