import { CssBaseline } from "@mui/material";
import { ReactFlowProvider } from "@xyflow/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import { ThemeProvider } from "./components/theme/theme-provider";
import { DataProvider } from "./data/data-provider.tsx";

console.table(import.meta.env);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DataProvider>
      <ThemeProvider>
        <ReactFlowProvider>
          <CssBaseline enableColorScheme />

          <style
            dangerouslySetInnerHTML={{
              __html: `#root {
                height: 100vh;
              }`,
            }}
          />

          <App />
        </ReactFlowProvider>
      </ThemeProvider>
    </DataProvider>
  </StrictMode>
);
