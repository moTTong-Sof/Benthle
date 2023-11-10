
document.addEventListener('DOMContentLoaded', function () {

    var score = 0;
    var $maxDepthTiles, $minDepthTiles, $eligibleContainers;
    var flipTile = 'fade-in';
    var closeTile = 'close-tile';
    var gotcha = 'gotcha';
    var flipSound = new Audio('/static/sounds/flipTile.mp3');
    var goodTileSound = new Audio('/static/sounds/successfulTile.mp3');
    var winSound = new Audio('/static/sounds/win.mp3');

    // LOADING SCREEN
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

    loadingScreenLogic();
    
    const url = `/game/data?difficulty=${difficulty}`;
    console.log(url)

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Store our data dict
            var mapZones = data.map_zones;
            var maxDepthZones = data.deepest_zones;
            var minDepthZones = data.shallowest_zones;
            var gridWidth = data.grid_width;
            console.log(gridWidth);
            var randomZones = data.random_zones;
            var eligibleZones = data.eligible_zones;

            // Create the grid
            var gridContainer = document.getElementById('grid-container');
            for (var row = 0; row < gridWidth; row++) {
                var gridRow = document.createElement('div');
                gridRow.className = 'grid-row';
                for (var col = 0; col < gridWidth; col++) {
                    var index = row * gridWidth + col;
                    var imageContainer = document.createElement('div');
                    imageContainer.className = 'image-container';
                    imageContainer.setAttribute('data-zone', mapZones[index]['index']);
                    var img = document.createElement('img');
                    img.src = mapZones[index]['url'];
                    img.alt = 'Data visualization';
                    img.className = 'tiles';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.display = 'none';
                    imageContainer.appendChild(img);
                    gridRow.appendChild(imageContainer);
                }
                gridContainer.appendChild(gridRow);
                
            }

            // Generate the colorscale image
            var colorscaleImg = document.getElementById('colorbar');
            colorscaleImg.src = data.colorscale;
            colorscaleImg.alt = 'colorscale';

            // Set initial image size and update on window resize
            const setInitialImageSize = () => {
                const windowWidth = window.innerWidth;
                console.log("Physical window width:", windowWidth);

                let imageSize;

                if (windowWidth < 380) {
                    imageSize = 360 / gridWidth;
                } else if (380 < windowWidth && windowWidth < 600) {
                    imageSize = (windowWidth * 0.95) / gridWidth;
                    console.log("Calculated imageSize:", imageSize);
                } else if (windowWidth > 610) {
                    imageSize = 600 / gridWidth;
                }

                $('.image-container').css('width', imageSize);
                $('.image-container').css('height', imageSize);
            };

            setInitialImageSize();
            window.addEventListener("resize", setInitialImageSize);


            $(document).ready(function () {

                setTimeout(function() {
                    $('#loading-overlay').fadeOut();
                }, 5000);
                setTimeout(function() {
                    $('.exit-game').fadeIn();
                    $('#combined-map').fadeIn();
                }, 5500);
                
                initializeSelectors();
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
                        $('.pop-up.max-depth').show().addClass('slide-out-top');
                        goodTileSound.play();
                        // Add all values from maxDepthZones to eligibleContainers except clickedZone
                        $eligibleContainers = $eligibleContainers.add('[data-zone="' + maxDepthZones.filter(zone => zone !== clickedZone).join('"], [data-zone="') + '"]');
                        // Delete all other zones so it won't be triggered twice
                        maxDepthZones = [clickedZone]
            
                    } else if (minDepthZones.includes(clickedZone)) {
                        console.log('Min Depth Zone');
                        winningTile($imageContainer);
                        $('.pop-up.min-depth').show().addClass('slide-out-top');
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
                            $('.exit-game').hide()
                            $('.next-game').show()
                        }, 1500);
                    }
                });

            });

            function initializeSelectors() {
                $maxDepthTiles = $('.image-container[data-zone="' + maxDepthZones.join('"], .image-container[data-zone="') + '"] .tiles');
                $minDepthTiles = $('.image-container[data-zone="' + minDepthZones.join('"], .image-container[data-zone="') + '"] .tiles');
                $eligibleContainers = $('.image-container[data-zone="' + eligibleZones.join('"], .image-container[data-zone="') + '"]');
            }

            function showStartingTiles() {
                randomZones.forEach(function (zone) {
                    setTimeout(function () {
                        $('.image-container[data-zone="' + zone + '"]').find('.tiles').show().addClass(flipTile);
                    }, 1500);
                });
            }

            function showAllTiles() {
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
                $('h1.score').text('SCORE : ' + score);
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


});
