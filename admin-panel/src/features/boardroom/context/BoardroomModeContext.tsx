import React, { createContext, useContext, useState, ReactNode } from "react";

export type BoardroomMode = "LIVE" | "HISTORICAL";

interface BoardroomModeContextType {
  mode: BoardroomMode;
  setMode: (mode: BoardroomMode) => void;
}

const BoardroomModeContext = createContext<BoardroomModeContextType | undefined>(
  undefined
);

export const BoardroomModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<BoardroomMode>("LIVE");

  return (
    <BoardroomModeContext.Provider value={{ mode, setMode }}>
      {children}
    </BoardroomModeContext.Provider>
  );
};

export const useBoardroomMode = () => {
  const context = useContext(BoardroomModeContext);
  if (!context) {
    throw new Error("useBoardroomMode must be used within a BoardroomModeProvider");
  }
  return context;
};
