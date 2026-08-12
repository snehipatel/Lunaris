import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { RANKED } from "@/lib/craters";

interface MissionState {
  selectedId: string;
  setSelectedId: (id: string) => void;
  landingId: string;
  setLandingId: (id: string) => void;
}

const defaultId = RANKED[0]?.crater_id ?? "C-001";
const Ctx = createContext<MissionState>({
  selectedId: defaultId,
  setSelectedId: () => {},
  landingId: defaultId,
  setLandingId: () => {},
});

export function MissionProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState(defaultId);
  const [landingId, setLandingId] = useState(defaultId);

  useEffect(() => {
    const s = localStorage.getItem("ch2.selected");
    const l = localStorage.getItem("ch2.landing");
    if (s) setSelectedId(s);
    if (l) setLandingId(l);
  }, []);

  useEffect(() => {
    localStorage.setItem("ch2.selected", selectedId);
  }, [selectedId]);
  useEffect(() => {
    localStorage.setItem("ch2.landing", landingId);
  }, [landingId]);

  return (
    <Ctx.Provider value={{ selectedId, setSelectedId, landingId, setLandingId }}>
      {children}
    </Ctx.Provider>
  );
}

export const useMission = () => useContext(Ctx);
