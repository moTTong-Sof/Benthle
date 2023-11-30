// loadingLogic.js

var scaleIn = "scale-in-center";
var bgLoading = "bg-loading"

function resetLoading() {
    $('.loading-tile').removeClass(bgLoading).removeClass(scaleIn);

    setTimeout(function() {
        // Add a small delay to make the 1st tile disappear
        loadingScreenLogic();
    }, 100);
}

function loadingScreenLogic() {
    var totalTiles = $(".loading-tile").length;
    console.log(totalTiles);

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function animateTiles() {
        for (let currentTile = 1; currentTile <= totalTiles; currentTile++) {
            $("#tile-" + currentTile).addClass(scaleIn).addClass(bgLoading);
            await delay(500);
        }

        await delay(400);
        resetLoading();
    }

    animateTiles();
}