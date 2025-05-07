import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { Team, GameView, TeamSelectionContextType } from '../types';

const TEAM_STORAGE_KEY = 'battleship-infinity-team';

interface TeamSelectionContextExtendedType extends TeamSelectionContextType {
  hasSelectedTeam: boolean;
  resetTeamSelection: () => void;
}

const TeamSelectionContext = createContext<TeamSelectionContextExtendedType | undefined>(undefined);

export const TeamSelectionProvider = ({ children }: { children: ReactNode }) => {
  // Load team from localStorage if available
  const [selectedTeam, setSelectedTeam] = useState<Team>(() => {
    const savedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
    return (savedTeam === 'red' || savedTeam === 'blue') ? savedTeam : 'blue';
  });

  const [activeView, setActiveView] = useState<GameView>('attack');

  // Track if a team has been explicitly selected by the user
  const [hasSelectedTeam, setHasSelectedTeam] = useState<boolean>(() => {
    return localStorage.getItem(TEAM_STORAGE_KEY) !== null;
  });

  // Persist team selection to localStorage
  useEffect(() => {
    if (hasSelectedTeam) {
      localStorage.setItem(TEAM_STORAGE_KEY, selectedTeam);
    }
  }, [selectedTeam, hasSelectedTeam]);

  // Wrapper for setSelectedTeam that also updates hasSelectedTeam
  const handleTeamSelection = (team: Team) => {
    setSelectedTeam(team);
    setHasSelectedTeam(true);
  };

  // Reset team selection (for debugging or logout)
  const resetTeamSelection = () => {
    localStorage.removeItem(TEAM_STORAGE_KEY);
    setHasSelectedTeam(false);
  };

  return (
    <TeamSelectionContext.Provider
      value={{
        selectedTeam,
        setSelectedTeam: handleTeamSelection,
        activeView,
        setActiveView,
        hasSelectedTeam,
        resetTeamSelection
      }}
    >
      {children}
    </TeamSelectionContext.Provider>
  );
};

export const useTeamSelection = (): TeamSelectionContextExtendedType => {
  const context = useContext(TeamSelectionContext);
  if (context === undefined) {
    throw new Error('useTeamSelection must be used within a TeamSelectionProvider');
  }
  return context;
};
