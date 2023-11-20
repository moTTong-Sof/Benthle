// btnInteraction.js

document.addEventListener('DOMContentLoaded', function () {

    var checkLocalStorage = Object.keys(localStorage).length > 0;
    console.log('localStorage has data: ' + checkLocalStorage);

    if (checkLocalStorage) {
        $('#linktuto').hide()
    }

    // var checkHighestExercise = localStorage.getItem('highestExercise');
    // console.log('highestExercise is ' + checkHighestExercise);

    var highestExercise;
    fetchTablesGet('highest_exercise', 'Tempdata')
        .then(function (response) {
            console.log('Response from fetchTablesGet:', response);
            highestExercise = parseInt(response) || 0;
            console.log('highest is ' + highestExercise)
            return highestExercise
        })
        .then(function(highestExercise){
            $('i.locker1, i.locker2, i.locker3').hide();
            $('i.locker1').show();
    
            if (highestExercise >= 1) {
                $('button.locker0').addClass('disabled').prop('disabled', true);
                $('button.locker1').removeClass('disabled').prop('disabled', false);
                $('i.locker1').hide();
                $('i.locker2').show();
            }
            if (highestExercise >= 2) {
                $('button.locker0').addClass('disabled').prop('disabled', true);
                $('button.locker1').addClass('disabled').prop('disabled', true);
                $('button.locker2').removeClass('disabled').prop('disabled', false);
                $('i.locker2').hide();
                $('i.locker3').show();
            }

            fetchTablesGet('all_game_done', 'Tempdata')
                .then(function (response) {
                    console.log('Response from fetchTablesGet:', response);
                    highestExercise = parseInt(response) || 0;
                    console.log('highest is ' + highestExercise)
                    return highestExercise
                })

            if (highestExercise >= 3) { // OR ALL GAME DONE
                $('i.locker1, i.locker2, i.locker3').hide();
                $('button.locker0').addClass('disabled').prop('disabled', true);
                $('button.locker1').addClass('disabled').prop('disabled', true);
                $('button.locker2').addClass('disabled').prop('disabled', true);
            }
        })
        .catch(function (error) {
            console.error('Error fetching highest_exercise:', error);
        });


    });
