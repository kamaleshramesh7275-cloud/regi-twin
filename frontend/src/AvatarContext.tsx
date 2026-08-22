import { createContext, useContext, useState } from "react";

interface AvatarContextType {
  highlightMode: string | null;
  setHighlightMode: (mode: string | null) => void;
}

export const AvatarContext = createContext<AvatarContextType>({
  highlightMode: null,
  setHighlightMode: () => {},
});

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [highlightMode, setHighlightMode] = useState<string | null>(null);
  return (
    <AvatarContext.Provider value={{ highlightMode, setHighlightMode }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  return useContext(AvatarContext);
}
