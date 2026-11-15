export const THEME_KEY = "theme";

// Runs in <head> before first paint: the server HTML is dark; a stored "light" switches it before anything shows.
export const themeScript = `(function(){try{if(localStorage.getItem("${THEME_KEY}")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`;
