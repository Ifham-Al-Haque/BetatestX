import type { CapacitorConfig } from '@capacitor/cli';

// Edition-aware native config. The same web build is wrapped into two apps:
//   * full      → MAIN APP: Uhub         (ae.udrive.uhub)
//   * operation → SUB-APP:  Udrive Fleet (ae.udrive.fleet)
// Selected via REACT_APP_EDITION at `npx cap sync` time.
const isOperation = (process.env.REACT_APP_EDITION || 'full').toLowerCase().trim() === 'operation';

const config: CapacitorConfig = {
  appId: isOperation ? 'ae.udrive.fleet' : 'ae.udrive.uhub',
  appName: isOperation ? 'Udrive Fleet' : 'Uhub',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
};

export default config;
