// Progress persistence: Capacitor Preferences on native, localStorage on web.

const KEY = "navkar.progress.v1";

function getPrefsPlugin() {
  return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
}

const defaultProgress = () => ({
  currentLevel: 0,        // index into LEVELS
  completed: [],          // array of level indices completed
  masteredOnce: false,    // true after first completion of level 8
  tourSeen: false,        // true once the onboarding tour has been dismissed
});

export async function getProgress() {
  try {
    const plugin = getPrefsPlugin();
    if (plugin) {
      const { value } = await plugin.get({ key: KEY });
      if (value) return { ...defaultProgress(), ...JSON.parse(value) };
    } else {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...defaultProgress(), ...JSON.parse(raw) };
    }
  } catch {}
  return defaultProgress();
}

export async function setProgress(progress) {
  const value = JSON.stringify(progress);
  try {
    const plugin = getPrefsPlugin();
    if (plugin) {
      await plugin.set({ key: KEY, value });
    } else {
      localStorage.setItem(KEY, value);
    }
  } catch {}
}

export async function resetProgress() {
  return setProgress(defaultProgress());
}
