import { Box, Card } from "@mui/material";
import React from "react";
import { DynamicLayoutFlow } from "./components/dynamic-layout/dynamic-layout-flow";
import { useCurrentPage } from "./components/navigation/hooks/use-current-page";
import { Sidebar } from "./components/navigation/sidebar";
import { useDevicesFullQuery } from './data/query/use-devices-full-query';
import { useListenUptimeSubscribe } from "./data/query/use-listen-uptime";

export const App: React.FC = () => {
  const currentPage = useCurrentPage((page) => addCurrentPage(page));
  const [ pageList, addCurrentPage ] = React.useReducer((state, page: string) => {
    if (page && !state.includes(page)) {
      return Array.from(new Set([ ...state, page ]));
    }

    return state;
  }, [ currentPage ].filter(Boolean));

  useListenUptimeSubscribe();

  const devicesFullQuery = useDevicesFullQuery();

  return (
    <Box display="flex" height="100%">
      <Sidebar pageList={pageList} />

      <Box flexGrow={1}>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            position: 'relative',
            display: currentPage ? "none" : undefined,
          }}
        >
          <DynamicLayoutFlow />

          {devicesFullQuery.data?.publicSafeMode && <Card sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            // transform: 'translateX(-50%)',
            fontSize: '90%',
          }}>
            Public safe mode enabled.
            <br />Accessible urls are faked.
            <br />Edits are denied too.
          </Card>}
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
    </Box>
  );
};
