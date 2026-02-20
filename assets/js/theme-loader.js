/**

 * SANTIS LIGHT ENGINE (PREPARING...)

 * Previous Color System has been decommissioned.

 * This file now serves as a placeholder for the upcoming Animation System.

 */



// 1. Purge Old Color Data

(function () {

    try {

        const oldTheme = localStorage.getItem('santis_cached_theme');

        if (oldTheme) {

            console.log("🧹 [Santis] Purging legacy theme data...");

            localStorage.removeItem('santis_cached_theme');



            // Remove potentially stuck variables

            const varsToRemove = [

                '--bg-main', '--bg-section', '--gold', '--nav-bg', '--text-main',

                '--text-muted', '--border-light', '--font-heading', '--font-body', '--radius-card'

            ];



            varsToRemove.forEach(v => {

                document.documentElement.style.removeProperty(v);

            });

            console.log("✅ Cleanup Complete.");

        }

    } catch (e) {

        console.warn("Purge error:", e);

    }



    console.log("🌑 [Santis] Light Engine Ready for Initialization.");

})();

