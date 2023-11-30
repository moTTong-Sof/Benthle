// game.js

document.addEventListener('DOMContentLoaded', function () {

    loadingScreenLogic(); // from loadingLogic.js
    fetchMapData(); // from fetchMapData.js // also show the starting tiles
    checkAccessAndProceed(difficulty)  // from accessDifficultyControl.js
        .then((accessGranted) => {
            console.log('Access status: ', accessGranted)
            if (accessGranted) {
                initializeGameLogic();
            }
        })
        .catch((error) => {
            console.error('Error checking access:', error);
        });
});
        
function initializeGameLogic() {
    console.log('Initializing game logic...');
    var currentExercise;
    var highestExercise;
    fetchTablesGet('highest_exercise', 'Tempdata')
        .then(function (response) {
            highestExercise = response || 0;
            trackExercises();   
        })
        .catch(function (error) {
            console.error('Error fetching highest_exercise:', error);
        });

    var maxAttempts = 5;
    fetchTablesGet('attempts', 'Tempdata')
        .then(function (response) {
            storedAttempts = parseInt(response);
            console.log('Stored Attempts:', storedAttempts);

            fetchTablesGet('left_mid_game', 'Tempdata')
                .then(function (leftMidGame) {

                    if (leftMidGame == 'true') {
                        console.log('Left mid game: ' + leftMidGame);
                        maxAttempts = storedAttempts;
                    }
                    else {
                        maxAttempts = storedAttempts > 0 ? maxAttempts + storedAttempts : maxAttempts;
                    }
                    $('h1.score').text('TOTAL ATTEMPS : ' + maxAttempts);
                    console.log('Max Attempts:', maxAttempts);
                    fetchTablesPost('attempts', maxAttempts, 'Tempdata')
        })
        .catch(function (error) {
            console.error('Error fetching attempts:', error);
        });
    });

    let gameEnd = false;

    var flipTile = 'fade-in';
    var closeTile = 'close-tile';
    var gotcha = 'gotcha';

    var flipSound = new Audio('/static/sounds/flipTile.mp3');
    var goodTileSound = new Audio('/static/sounds/successfulTile.mp3');
    var winSound = new Audio('/static/sounds/win.mp3');
    var lostSound = new Audio('/static/sounds/lost.mp3');
    
    $(document).ready(function () {
        loadingTransition();

        $(document).on('click', '.exit-game', function () { 
            leftMid();
        });

        
        if (!gameEnd) {
            $(window).on('beforeunload', function (e) {
                var state = e.originalEvent.state;
                console.log('gameEnd is', gameEnd);
                if (state !== null && !gameEnd) {
                    console.log('LeftMID call');
                    leftMid();
                }
            });
        }


        $(document).on('click', '.next-game', function () { 
            fetchTablesPost('left_mid_game', false, 'Tempdata')
                .then(function (response) {
                    console.log('Updated left_mid_name value:', response);
                })
                .catch(function (error) {
                    console.error('Error updating highest_exercise:', error);
                }); 
        });


        $(document).on('click', '.image-container', function () {
            // console.log('Click event triggered!');
            // console.log('minDepthTiles visibility on game start:', $minDepthTiles.is(':visible'));
            var $imageContainer = $(this);
            var clickedZone = $imageContainer.data('zone');
    
            if ($imageContainer.find('.tiles').is(':visible') || (gameEnd)) {
                return;
            }
    
            $imageContainer.find('.tiles').show().addClass(flipTile);
    
            if (maxDepthZones.includes(clickedZone)) {
                winningTile($imageContainer, 'max-depth');
                // Add all values from maxDepthZones to eligibleContainers except clickedZone
                $eligibleContainers = $eligibleContainers.add('[data-zone="' + maxDepthZones.filter(zone => zone !== clickedZone).join('"], [data-zone="') + '"]');
                maxDepthZones = [clickedZone] // Delete all other zones so it won't be triggered twice
    
            } else if (minDepthZones.includes(clickedZone)) {
                winningTile($imageContainer, 'min-depth');
                $eligibleContainers = $eligibleContainers.add('[data-zone="' + minDepthZones.filter(zone => zone !== clickedZone).join('"], [data-zone="') + '"]');
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
                updateAttempts(false);
                flipSound.play();
            }

            // console.log('$maxDepthTiles:', $maxDepthTiles.is(':visible'));
            // console.log('$minDepthTiles:', $minDepthTiles.is(':visible'));
            if ($maxDepthTiles.is(':visible') && $minDepthTiles.is(':visible')) {
                gameEnd = true;
                setTimeout(function () {
                    winSound.play();
                }, 500);
                endWinGame(highestExercise);
                updateAttempts(true);
                updatePlayerStats(currentExercise);
            }
        });

    });


    function loadingTransition() {
        setTimeout(function() {
            $('#loading-overlay').fadeOut();
        }, 5000);
        setTimeout(function() {
            $('.exit-game').fadeIn();
            $('#combined-map').fadeIn();
        }, 5500);  
    }


    function trackExercises(){
        console.log('highestExercise is ' + highestExercise);
        console.log('difficulty is ' + difficulty)
        if (difficulty === 'bathyal') {
            currentExercise = 1
        } else if (difficulty === 'abyssal') {
            currentExercise = 2
        } else if (difficulty === 'hadal') {
            currentExercise = 3
        }
        localStorage.setItem('currentExercise', currentExercise);
        console.log('currentExercise is ' + currentExercise);
    }


    function endWinGame(highestExercise) {
        console.log('endWinGame() called');
        setTimeout(function () {
            $('.image-container').find('.tiles').show().addClass(flipTile);
            $('.image-container').css('border', 'none');
            $('.exit-game').hide()
            $('.next-game').show()
        }, 1500);

        highestExercise = currentExercise > highestExercise ? highestExercise = currentExercise : highestExercise;

        fetchTablesPost('highest_exercise', highestExercise, 'Tempdata')
            .then(function (response) {
                console.log('Updated highest_exercise value:', highestExercise);
            })
            .catch(function (error) {
                console.error('Error updating highest_exercise:', error);
            }); 

        fetchTablesPost('left_mid_game', true, 'Tempdata')
        
    }


    function endLooseGame(maxStreak) {
        fetchTablesGet('max_streak', 'Userdata')
            .then (function(response) {
                fetchTablesGet('current_streak', 'Userdata')
                    .then (function(response2) {
                        currentStreak = parseInt(response2) || 0;
                        maxStreak = parseInt(response) || 0;
                        maxStreak = maxStreak < currentStreak ? currentStreak : maxStreak;

                        fetchTablesPost('current_streak', 0, 'Userdata')
                        fetchTablesPost('max_streak', maxStreak, 'Userdata')
                            .then(function (response) {
                                console.log('Updated max_streak value:', response.value);
                            })
                            .catch(function (error) {
                                console.error('Error updating max_streak:', error);
                            });
                    })
            })

        fetchTablesPost('highest_exercise', 3, 'Tempdata')
            .then(function (response) {
                console.log('Updated highest_exercise value:', response.value);
                localStorage.setItem('endGame', true)
            })
            .catch(function (error) {
                console.error('Error updating highest_exercise:', error);
            });

        fetchTablesGet('total_att_used', 'Tempdata')
            .then(function (response) {
                totalAttemptsUsed = parseInt(response);
                totalAttemptsUsed++;
                console.log('posting todays attempts: ', totalAttemptsUsed)
                fetchTablesPost('today_attempts', totalAttemptsUsed, 'Userdata');
            })
            .catch(function (error) {
                console.error('Error updating today_attempts:', error);
            });

        setTimeout(function () {
            $('.image-container').find('.tiles').show().addClass(flipTile);
            $('.image-container').css('border', 'none');
            $('.exit-game').hide()
            $('.retry-game').show()
            // DEACTIVATE THE interaction from refresh
        }, 1500);
    }


    function isInRange(clickedZone, depthZones) {
        // Check if the clicked tile is within a 1-tile range of any tile in the depth zone list
        var rowClicked = Math.floor(clickedZone / gridWidth);
        var colClicked = clickedZone % gridWidth;

        return depthZones.some(function(depthZone) {
            var rowDepth = Math.floor(depthZone / gridWidth);
            var colDepth = depthZone % gridWidth;
            return Math.abs(rowClicked - rowDepth) <= 1 && Math.abs(colClicked - colDepth) <= 1;
        });
    }


    function updateAttempts(lastTileWin) {
        maxAttempts--;
        console.log('decrementing maxAttempts')

        $('h1.score').text('ATTEMPTS LEFT : ' + maxAttempts);
        fetchTablesPost('attempts', maxAttempts, 'Tempdata')
            .then(function(response) {
                console.log('attempts from UpdateAttemps func: ', response)
            })
            .catch(function (error) {
                console.error('Error updating attempts:', error);
            });

        fetchTablesGet('total_att_used', 'Tempdata')
            .then(function (response) {
                totalAttemptsUsed = parseInt(response) || 0;
                totalAttemptsUsed++;
                return fetchTablesPost('total_att_used', totalAttemptsUsed, 'Tempdata');
            }) 

        if (maxAttempts === 0 && !lastTileWin) {
            gameEnd = true;
            localStorage.setItem('finish', true);
            setTimeout(function () {
                lostSound.play();
            }, 500);
            endLooseGame();
        }
    }


    function winningTile($imageContainer, popupClass) {
        console.log('Depth tile');
        $imageContainer.addClass(gotcha);
        setTimeout(function () {
            $imageContainer.removeClass(gotcha);
        }, 500);
        $(`.pop-up.${popupClass}`).show().addClass('slide-out-top');
        goodTileSound.play();
    }


    function leftMid() {
        fetchTablesPost('left_mid_game', true, 'Tempdata')
            .then(function (response) {
                console.log('Updated left_mid_game value:', response);
                fetchTablesPost('attempts', maxAttempts, 'Tempdata');
            })
            .catch(function (error) {
                console.error('Error updating left_mid_game:', error);
            });
    }


    function updatePlayerStats(currentExercise) {
        var currentDate = new Date();
        var formattedDate = currentDate.toISOString().split('T')[0];

        var key;
        if (currentExercise === 1){
            key = 'bathyal'
        } else if (currentExercise === 2){
            key = 'abyssal'
        } else if (currentExercise === 3){
            key = 'hadal'
        }

        fetchTablesGet(key, 'Userdata')
            .then(function (completExoValue) {
                completExoValue = parseInt(completExoValue) || 0;
                completExoValue++;
                console.log('Updated ' + key + ' value:', completExoValue);
                return fetchTablesPost(key, completExoValue, 'Userdata');
                // post bathyal map
            })
            .catch(function (error) {
                console.error('Error updating total_att_used:', error);
            });

        fetchTablesPost(key, formattedDate, 'Historic')
            .catch(function (error) {
                console.error('Error updating Historic:', error);
            });

        if (currentExercise === 3){
            localStorage.setItem('finish', true); // to display stats automatically when leaving

            fetchTablesGet('current_streak', 'Userdata')
                .then(function (response) {
                    streak = parseInt(response) || 0;
                    streak++;
                    console.log('Updated current_streak value:', response.value);
                    return fetchTablesPost('current_streak', streak, 'Userdata');
                })
                .catch(function (error) {
                    console.error('Error updating current_streak:', error);
                });

            fetchTablesPost('last_win', formattedDate, 'Userdata')
                .catch(function (error) {
                    console.error('Error updating last_win:', error);
                });

            fetchTablesGet('total_att_used', 'Tempdata')
                .then(function (response) {
                    totalAttemptsUsed = parseInt(response);
                    totalAttemptsUsed++;
                    console.log('posting todays attempts: ', totalAttemptsUsed)
                    fetchTablesPost('today_attempts', totalAttemptsUsed, 'Userdata');
                })
                .catch(function (error) {
                    console.error('Error updating today_attempts:', error);
                });
        }
    }
}