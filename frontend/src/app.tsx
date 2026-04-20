import { Box, Button, Card } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { DynamicLayoutFlow } from "./components/dynamic-layout/dynamic-layout-flow";
import { useCurrentPage } from "./components/navigation/hooks/use-current-page";
import { Sidebar } from "./components/navigation/sidebar";
import {
  Sizing,
  SizingContext,
} from "./components/sizing/provider/sizing-provider";
import { ThemeProvider } from "./components/theme/theme-provider";
import { useDevicesFullQuery } from "./data/query/use-devices-full-query";
import { useListenUptimeSubscribe } from "./data/query/use-listen-uptime";

export const App: React.FC = () => {
  const currentPage = useCurrentPage((page) => addCurrentPage(page));
  const [pageList, addCurrentPage] = React.useReducer((state, page: string) => {
    if (page && !state.includes(page)) {
      return Array.from(new Set([...state, page]));
    }

    return state;
  }, [currentPage].filter(Boolean));

  const [sizing, setSizing] = React.useState<Sizing>("small");

  useListenUptimeSubscribe();

  const queryClient = useQueryClient();

  const { data } = useDevicesFullQuery();

  return (
    <Box display="flex" height="100%">
      <Sidebar pageList={pageList} />

      <SizingContext.Provider value={sizing}>
        <Box flexGrow={1}>
          <Box
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              display: currentPage ? "none" : undefined,
            }}
          >
            <DynamicLayoutFlow key={sizing} />

            {data?.safeMode && (
              <Card
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  // transform: 'translateX(-50%)',
                  fontSize: "90%",
                  p: 1,
                }}
              >
                Safe mode enabled.
                <br />
                Private links are disabled.
                <br />
                Edits are denied too.
              </Card>
            )}

            <ThemeProvider themeName="yellow">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setSizing((size) => (size === "full" ? "small" : "full"));
                  queryClient.clear();
                }}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  // transform: 'translateX(-50%)',
                  // fontSize: "90%",
                  // p: 1,
                }}
              >
                {sizing === "full" ? "Full size" : "Compact size"}
              </Button>
            </ThemeProvider>
          </Box>

          {pageList.map((page) => (
            <iframe
              key={page}
              src={page}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: currentPage === page ? undefined : "none",
              }}
            />
          ))}
        </Box>
      </SizingContext.Provider>
    </Box>
  );
};
