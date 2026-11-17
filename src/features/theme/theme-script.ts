// TODO(theme): theme switching is disabled for now, flip to true to bring the light theme back.
// Before enabling: keep the home hero image dark in light theme (overlays in app/page.module.css use fixed dark colors), re-check every page in light theme.
export const THEME_SWITCH_ENABLED = false;

export const THEME_STORAGE_KEY = "swipy.theme";

export const THEME_INIT_SCRIPT = `(function(){try{var t=${THEME_SWITCH_ENABLED}?localStorage.getItem("${THEME_STORAGE_KEY}"):null;document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})()`;
