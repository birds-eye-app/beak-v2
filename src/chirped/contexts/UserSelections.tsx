import React, { createContext, useState, ReactNode } from "react";
import { QualitativeQuestionData } from "../components/slides/QualitativeInput";

export type UserSelections = {
  hotspotRanking: "checklists" | "timeSpent";
  qualitativeQuestions: QualitativeQuestionData[];
  setHotspotRanking: (ranking: "checklists" | "timeSpent") => void;
  setQualitativeQuestions: (questions: QualitativeQuestionData[]) => void;
};

export const UserSelectionsContext = createContext<UserSelections>({
  hotspotRanking: "checklists",
  qualitativeQuestions: [],
  setHotspotRanking: () => {},
  setQualitativeQuestions: () => {},
});

const defaultQuestions = process.env.NODE_ENV === "development"
  ? [
      { question: "What was your favorite hotspot?", answer: "My backyard" },
      { question: "What was your favorite bird?", answer: "Eastern Phoebe" },
    ]
  : [];

export const UserSelections = ({ children }: { children: ReactNode }) => {
  const [userSelections, setUserSelections] = useState<UserSelections>({
    hotspotRanking: "checklists",
    qualitativeQuestions: defaultQuestions,
    setHotspotRanking: (ranking: "checklists" | "timeSpent") => {
      setUserSelections((prevState) => ({
        ...prevState,
        hotspotRanking: ranking,
      }));
    },
    setQualitativeQuestions: (questions: QualitativeQuestionData[]) => {
      setUserSelections((prevState) => ({
        ...prevState,
        qualitativeQuestions: questions,
      }));
    },
  });

  return (
    <UserSelectionsContext.Provider value={userSelections}>
      {children}
    </UserSelectionsContext.Provider>
  );
};
