import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Index } from "./routes/index";
import { startSharedSync } from "./lib/sharedSync";
import "./styles.css";

startSharedSync();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Index />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  </React.StrictMode>,
);
