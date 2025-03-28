import React from 'react';
import { DeviceCardMap } from './components/device/device-card-map';
import { ModeToggle } from './components/theme/mode-toggle';

export const App: React.FC = () => {
  return (
    <>

      <ModeToggle />

      <DeviceCardMap />

    </>
  );
}
