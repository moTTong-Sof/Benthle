$(document).ready(function () {

    var score = 0;

    var $maxDepthTiles = $('.image-container[data-zone="' + maxDepthZones.join('"], .image-container[data-zone="') + '"] .tiles');
    var $minDepthTiles = $('.image-container[data-zone="' + minDepthZones.join('"], .image-container[data-zone="') + '"] .tiles');

    var $eligibleContainers = $('.image-container[data-zone="' + eligibleZones.join('"], .image-container[data-zone="') + '"]');

    // Style classes
    var flipTile = 'fade-in';
    var closeTile = 'close-tile';
    var gotcha = 'gotcha';

    // Sound from Zapsplat.com
    var flipSound = new Audio('/static/sounds/flipTile.mp3');
    var goodTileSound = new Audio('/static/sounds/sucessfullTile.mp3');
    var winSound = new Audio('/static/sounds/win.mp3');

    showStartingTiles();

    $('.image-container').on('click', function () {
        var $imageContainer = $(this);
        var clickedZone = $imageContainer.data('zone');

        // Check if the tiles are already visible
        if ($imageContainer.find('.tiles').is(':visible')) {
            return;
        }

        // Toggle the visibility of the tiles
        $imageContainer.find('.tiles').show().addClass(flipTile);

        if (maxDepthZones.includes(clickedZone)) {
            console.log('Max Depth Zone');
            winningTile($imageContainer);
            goodTileSound.play();
            // Add all values from maxDepthZones to eligibleContainers except clickedZone
            $eligibleContainers = $eligibleContainers.add('[data-zone="' + maxDepthZones.filter(zone => zone !== clickedZone).join('"], [data-zone="') + '"]');
            // Delete all other zones so it won't be triggered twice
            maxDepthZones = [clickedZone]

        } else if (minDepthZones.includes(clickedZone)) {
            console.log('Min Depth Zone');
            winningTile($imageContainer);
            goodTileSound.play();
            // Add all values from maxDepthZones to eligibleContainers except clickedZone
            $eligibleContainers = $eligibleContainers.add('[data-zone="' + minDepthZones.filter(zone => zone !== clickedZone).join('"], [data-zone="') + '"]');
            // Delete all other zones so it won't be triggered twice
            minDepthZones = [clickedZone]

        } else if ($eligibleContainers.filter('[data-zone="' + clickedZone + '"]').length > 0) {
            $eligibleContainers = $eligibleContainers.not('[data-zone="' + clickedZone + '"]');

            if (
                (isInRange(clickedZone, maxDepthZones) && !$maxDepthTiles.is(':visible')) ||
                (isInRange(clickedZone, minDepthZones) && !$minDepthTiles.is(':visible'))
            ) {
                $imageContainer.addClass(closeTile);
                setTimeout(function () {
                    $imageContainer.removeClass(closeTile);
                }, 500);
            }

            console.log('Other Zone : +1');
            score += 1;
            updateScore();
            flipSound.play();
        }

        // Check if both max depth and min depth are visible
        if ($maxDepthTiles.is(':visible') && $minDepthTiles.is(':visible')) {
            setTimeout(function () {
                winSound.play();
            }, 500);
            setTimeout(function () {
                showAllTiles();
            }, 1500);
        }
    });

    function showStartingTiles() {
        randomZones.forEach(function (zone) {
            setTimeout(function () {
                $('.image-container[data-zone="' + zone + '"]').find('.tiles').show().addClass(flipTile);
            }, 1500);
        });
    }

    function showAllTiles() {
        // Toggle the visibility of all tiles
        $('.image-container').find('.tiles').show().addClass(flipTile);
        $('.image-container').css('border', 'none');
    }

    function isInRange(clickedZone, depthZones) {
        var rowClicked = Math.floor(clickedZone / gridWidth);
        var colClicked = clickedZone % gridWidth;

        // Check if the clicked tile is within a 1-tile range of any tile in the depth zone list
        return depthZones.some(function(depthZone) {
            var rowDepth = Math.floor(depthZone / gridWidth);
            var colDepth = depthZone % gridWidth;
            return Math.abs(rowClicked - rowDepth) <= 1 && Math.abs(colClicked - colDepth) <= 1;
        });
    }

    function updateScore() {
        if (score < 0 && isNaN(score)) {
            score = 0; // Ensure the score doesn't go below 0
        }
        $('h1.score').text('Score: ' + score);
    }

    function winningTile($imageContainer) {
        $imageContainer.addClass(gotcha);
        setTimeout(function () {
            $imageContainer.removeClass(gotcha);
        }, 500);
        if (score <= 1) {
            score = 0;
        } else {
            score -= 2;
        }
        console.log('Winning tile: -2');
        updateScore();
    }
});
