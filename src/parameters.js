const AUTOSAVE_INTERVAL = 5*60*1000; // 5 minutes

/* DEBUG */
const USE_STARTUP_WINDOW = true;
const STARTUP_INSPECTOR = false;
const isDevelopementEnvironement = process.env.NODE_ENV === "development";

module.exports = { AUTOSAVE_INTERVAL, USE_STARTUP_WINDOW, STARTUP_INSPECTOR, isDevelopementEnvironement };