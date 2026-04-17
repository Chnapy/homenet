import { Box, Card } from "@mui/material";
import React from "react";
import { DynamicLayoutFlow } from "./components/dynamic-layout/dynamic-layout-flow";
import { useCurrentPage } from "./components/navigation/hooks/use-current-page";
import { Sidebar } from "./components/navigation/sidebar";
import { useListenUptimeSubscribe } from "./data/query/use-listen-uptime";
import { env } from './env';

export const App: React.FC = () => {
  const currentPage = useCurrentPage((page) => addCurrentPage(page));
  const [ pageList, addCurrentPage ] = React.useReducer((state, page: string) => {
    if (page && !state.includes(page)) {
      return Array.from(new Set([ ...state, page ]));
    }

    return state;
  }, [ currentPage ].filter(Boolean));

  useListenUptimeSubscribe();

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

          {env.VITE_SAFE_MODE && <Card sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            // transform: 'translateX(-50%)',
            fontSize: '90%',
          }}>
            Safe mode enabled.
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
