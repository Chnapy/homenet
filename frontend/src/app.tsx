import { Box } from "@mui/material";
import React from "react";
import { DynamicLayoutFlow } from "./components/dynamic-layout/dynamic-layout-flow";
import { Sidebar } from "./components/navigation/sidebar";
import { useCurrentPage } from "./components/navigation/hooks/use-current-page";

export const App: React.FC = () => {
  const currentPage = useCurrentPage((page) => addCurrentPage(page));
  const [pageList, addCurrentPage] = React.useReducer((state, page: string) => {
    if (page && !state.includes(page)) {
      return Array.from(new Set([...state, page]));
    }

    return state;
  }, [currentPage].filter(Boolean));

  return (
    <Box display="flex" height="100%">
      <Sidebar pageList={pageList} />

      <Box flexGrow={1}>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: currentPage ? "none" : undefined,
          }}
        >
          <DynamicLayoutFlow />
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
