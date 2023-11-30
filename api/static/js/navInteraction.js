// navInteraction.js

$(document).ready(function () {

    finished = localStorage.getItem('finish') || false;
    if (finished) {
        showPopup('#my-stats');
        getPlayerStats();
        localStorage.removeItem('finish');
    }

    $('#rules').on('click', function () {
    showPopup('#rules-text');
    });

    $('#my-maps-btn').on('click', function () {
        showPopup('#my-maps');
        getPlayerHistoric();
    });

    $('#my-stats-btn').on('click', function () {
        showPopup('#my-stats');
        getPlayerStats();
    });

    $('.exit-game').on('click', function () {
        hidePopup('#rules-text');
        hidePopup('#my-maps');
        hidePopup('#my-stats');
    });

    function showPopup(popupId) {
        $('.chose, .play-title').hide();
        $(popupId).fadeIn();
        $('nav').addClass('nav-deactivated');
    }

    function hidePopup(popupId) {
        $(popupId).hide();
        $('.chose, .play-title').fadeIn();
        $('nav').removeClass('nav-deactivated');
    }

    function getPlayerHistoric() {
        fetchTablesGet('all', 'Historic')
            .then(function (response) {
                const groupedByDate = groupByDate(response);
                displayGroupedMaps(groupedByDate);
            })
            .catch(function (error) {
                console.error('Error fetching historic data:', error);
            });
    }
    
    function groupByDate(maps) {
        const groupedByDate = new Map();
        maps.forEach((map) => {
            const date = map.day;
    
            if (!groupedByDate.has(date)) {
                groupedByDate.set(date, []);
            }
            groupedByDate.get(date).push(map);
        });
        return groupedByDate;
    }
    
    function displayGroupedMaps(groupedByDate) {
        const container = document.getElementById('maps-container');
        container.innerHTML = '';
    
        groupedByDate.forEach((maps, date) => {
            const dateContainer = document.createElement('div');
            dateContainer.classList.add('date-container');
    
            const datetimeHeader = document.createElement('h4');
            datetimeHeader.textContent = date;
            dateContainer.appendChild(datetimeHeader);
    
            maps.forEach((map, index) => {
                const mapContainer = document.createElement('div');
                mapContainer.classList.add('map-container');
    
                // if (map.difficulty) {
                //     const difficultyTitle = document.createElement('h3');
                //     difficultyTitle.textContent = `Difficulty: ${map.difficulty}`;
                //     mapContainer.appendChild(difficultyTitle);
                // }
    
                const mapImage = document.createElement('img');
                mapImage.src = map.url;
                mapImage.alt = `Map ${index + 1}`;
                mapContainer.appendChild(mapImage);
    
                dateContainer.appendChild(mapContainer);
            });
    
            container.appendChild(dateContainer);
        });
    }    

    function getPlayerStats() {
        fetchTablesGet('all', 'Userdata')
        .then(function (response) {
            console.log(response);
            if (Array.isArray(response) && response.length > 0) {
                const statsObject = response[0];
        
                const hadalValue = statsObject.hadal;
                const abyssalValue = statsObject.abyssal;
                const bathyalValue = statsObject.bathyal;
                const currentStreakValue = statsObject.current_streak;
                const maxStreakValue = statsObject.max_streak;
                const todayAttemptsValue = statsObject.today_attempts;
                const lastWinValue = statsObject.last_win;
        
                console.log('Hadal:', hadalValue);
                console.log('Abyssal:', abyssalValue);
                console.log('Bathyal:', bathyalValue);
                console.log('Current Streak:', currentStreakValue);
                console.log('Max Streak:', maxStreakValue);
                console.log('Today Attempts:', todayAttemptsValue);
                console.log('Last Win:', lastWinValue);

                const lastWin = document.getElementById("last-win-data");
                const todaysAttempts = document.getElementById("attempts-data");
                const currentStreak = document.getElementById("current-streak-data");
                const maxStreak = document.getElementById("max-streak-data");
                const bathyal = document.getElementById("bathyal-data");
                const abyssal = document.getElementById("abyssal-data");
                const hadal = document.getElementById("hadal-data");

                lastWin.innerHTML = lastWinValue || '--';
                todaysAttempts.innerHTML = todayAttemptsValue || '--';
                currentStreak.innerHTML = currentStreakValue || '--';
                maxStreak.innerHTML = maxStreakValue || '--';
                bathyal.innerHTML = bathyalValue || '--';
                abyssal.innerHTML = abyssalValue || '--';
                hadal.innerHTML = hadalValue || '--';
        
            } else {
                console.error('Invalid getPlayerStats response:', response);
            }
        })
    }
});