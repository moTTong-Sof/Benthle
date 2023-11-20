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

    function getPlayerStats() {
        fetchTablesGet('all')
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