const AUTOSAVE_INTERVAL = 5*60*1000; // 5 minutes

/* DEBUG */
const STARTUP_INSPECTOR = true;
const isDevelopementEnvironement = process.env.NODE_ENV === "development";

module.exports = { AUTOSAVE_INTERVAL, STARTUP_INSPECTOR, isDevelopementEnvironement };