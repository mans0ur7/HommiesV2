import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

// Håndterer Androids hardware-tilbage-knap. Uden dette gør Capacitors default
// ingenting på rod-ruter (knappen "sluges"), og åbne modals lukkes ikke.
// Adfærd: luk åbent overlay → ellers gå tilbage i historikken → ellers luk appen
// på rod-ruterne (forside / hovedfaner).
const ROOT_PATHS = new Set(["/", "/explore", "/matches", "/inbox", "/focus"]);

export const useAndroidBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;
    CapApp.addListener("backButton", ({ canGoBack }) => {
      // 1) Luk et åbent overlay først — Radix (Dialog/Sheet/AlertDialog/Popover) eller
      // et custom overlay markeret med data-overlay (fx notifikations-popover).
      const overlay = document.querySelector(
        '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-radix-popper-content-wrapper], [data-overlay]'
      );
      if (overlay) {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true })
        );
        return;
      }

      // 2) På rod-ruter lukker tilbage appen (standard Android-adfærd).
      if (ROOT_PATHS.has(location.pathname)) {
        CapApp.exitApp();
        return;
      }

      // 3) Ellers naviger tilbage.
      if (canGoBack || window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    }).then((handle) => {
      remove = () => handle.remove();
    });

    return () => {
      remove?.();
    };
  }, [navigate, location.pathname]);
};
