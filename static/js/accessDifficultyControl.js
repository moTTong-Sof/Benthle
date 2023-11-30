// accessDifficultyControl.js

let accessGranted = false;

const accessControl = {
    3: [''],
    2: ['hadal'],
    1: ['abyssal'],
    0: ['bathyal']
};

async function checkAccessAndProceed(difficulty) {
    try {
        const response = await fetchTablesGet('highest_exercise', 'Tempdata');
        console.log('Response from fetchTablesGet:', response);
        
        const highestExercise = parseInt(response) || 0;
        console.log('highest is ' + highestExercise);

        if (!getAllowedDifficulties(highestExercise).includes(difficulty)) {
            alert('You do not have access to this difficulty level.');
            window.location.href = '/homepage';
            accessGranted = false;
            return false;
        }

        accessGranted = true;
        return true;

    } catch (error) {
        accessGranted = false;
        console.error('Error checking access:', error);
        return false;
    }

    function getAllowedDifficulties(highestExercise) {
        return accessControl[highestExercise] || [];
    }
}