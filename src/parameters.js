const AUTOSAVE_INTERVAL = 5*60*1000; // 5 minutes

/* DEBUG */
const isDevelopementEnvironement = process.env.NODE_ENV === "development";
const STARTUP_INSPECTOR = true && isDevelopementEnvironement;

module.exports = { AUTOSAVE_INTERVAL, STARTUP_INSPECTOR, isDevelopementEnvironement };