import React, { createContext, useContext, useState } from 'react';

type ProfileDrawerContextType = {
  isOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
};

const ProfileDrawerContext = createContext<ProfileDrawerContextType>({} as any);

export function ProfileDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => setIsOpen((prev) => !prev);
  const closeDrawer = () => setIsOpen(false);

  return (
    <ProfileDrawerContext.Provider value={{ isOpen, toggleDrawer, closeDrawer }}>
      {children}
    </ProfileDrawerContext.Provider>
  );
}

export const useProfileDrawer = () => useContext(ProfileDrawerContext);