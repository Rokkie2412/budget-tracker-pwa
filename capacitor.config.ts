import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.dompettracker.app',
	appName: 'Dompet Tracker',
        webDir: 'build',
        plugins: {
                Keyboard: {
                        resizeOnFullScreen: true
                }
        }
};

export default config;
