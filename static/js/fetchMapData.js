// fetchMapData.js

var mapZones, maxDepthZones, minDepthZones, gridWidth, randomZones, eligibleZones;
var $maxDepthTiles, $minDepthTiles, $eligibleContainers;


function fetchMapData() {
    const url = `/game/data?difficulty=${difficulty}`;
    console.log(url)

    return fetch(url)
    .then(response => response.json())
    .then(data => {
        // Store our data dict
        mapZones = data.map_zones;
        maxDepthZones = data.deepest_zones;
        console.log(mapZones);
        minDepthZones = data.shallowest_zones;
        gridWidth = data.grid_width;
        randomZones = data.random_zones;
        eligibleZones = data.eligible_zones;

        // Create the grid
        var gridContainer = document.getElementById('grid-container');
        for (var row = 0; row < gridWidth; row++) {
            var gridRow = document.createElement('div');
            gridRow.className = 'grid-row';
            for (var col = 0; col < gridWidth; col++) {
                var index = row * gridWidth + col;
                var dataZone = mapZones[index];

                console.log("Index:", index, "Data Zone:", dataZone['index'], "URL:", dataZone['url']);

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

        showStartingTiles();
        initializeSelectors();

    });


    function showStartingTiles() {
        randomZones.forEach(function (zone) {
            setTimeout(function () {
                $('.image-container[data-zone="' + zone + '"]').find('.tiles').show();
            }, 1500);
        });
      
    
    }


    function initializeSelectors() {
        var minDepthZonesSelector = minDepthZones.map(zone => '.image-container[data-zone="' + zone + '"] .tiles').join(', ');
        var maxDepthZonesSelector = maxDepthZones.map(zone => '.image-container[data-zone="' + zone + '"] .tiles').join(', ');
        var eligibleZonesSelector = eligibleZones.map(zone => '.image-container[data-zone="' + zone + '"]').join(', ');
    
        $minDepthTiles = $(minDepthZonesSelector);
        $maxDepthTiles = $(maxDepthZonesSelector);
        $eligibleContainers = $(eligibleZonesSelector);
    
        // console.log('minDepthTiles:', $minDepthTiles);
        // console.log('maxDepthTiles elements:', $maxDepthTiles.get());
        // console.log('minDepthTiles elements:', $minDepthTiles.get());
        // console.log('eligibleContainers elements:', $eligibleContainers.get());
    
    }   

}
