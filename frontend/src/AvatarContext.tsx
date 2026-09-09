import { createContext, useContext, useState } from "react";

interface AvatarContextType {
  highlightMode: string | null;
  setHighlightMode: (mode: string | null) => void;
  userHeight: number | null;
  setUserHeight: (h: number | null) => void;
  userWeight: number | null;
  setUserWeight: (w: number | null) => void;
  userSex: string | null;
  setUserSex: (s: string | null) => void;
}

export const AvatarContext = createContext<AvatarContextType>({
  highlightMode: null,
  setHighlightMode: () => {},
  userHeight: null,
  setUserHeight: () => {},
  userWeight: null,
  setUserWeight: () => {},
  userSex: null,
  setUserSex: () => {},
});

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [highlightMode, setHighlightMode] = useState<string | null>(null);
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const [userWeight, setUserWeight] = useState<number | null>(null);
  const [userSex, setUserSex] = useState<string | null>(null);
  
  return (
    <AvatarContext.Provider value={{ 
      highlightMode, setHighlightMode, 
      userHeight, setUserHeight, 
      userWeight, setUserWeight, 
      userSex, setUserSex 
    }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  return useContext(AvatarContext);
}
