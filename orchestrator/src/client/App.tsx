/**
 * Main App component.
 */

import React, { useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { CSSTransition, SwitchTransition } from "react-transition-group";

import { Toaster } from "@/components/ui/sonner";
import { OrchestratorPage } from "./pages/OrchestratorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UkVisaJobsPage } from "./pages/UkVisaJobsPage";
import { VisaSponsorsPage } from "./pages/VisaSponsorsPage";

export const App: React.FC = () => {
  const location = useLocation();
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <SwitchTransition mode="out-in">
        <CSSTransition
          key={location.pathname}
          nodeRef={nodeRef}
          timeout={100}
          classNames="page"
          unmountOnExit
        >
          <div ref={nodeRef}>
            <Routes location={location}>
              <Route path="/" element={<OrchestratorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/ukvisajobs" element={<UkVisaJobsPage />} />
              <Route path="/visa-sponsors" element={<VisaSponsorsPage />} />
            </Routes>
          </div>
        </CSSTransition>
      </SwitchTransition>

      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
};
