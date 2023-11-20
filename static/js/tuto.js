
// tuto.js

var progressAudio = new Audio('/static/sounds/successfulTile.mp3');
var winAudio = new Audio('/static/sounds/win.mp3');
var currentConcept = 1;
var totalConcepts = $(".concept").length;
var progressBar = $(".progress-bar");


$(document).ready(function () {

    loadingScreenLogic(); // from loadingLogic.js

    setTimeout(function() {
        $('#loading-overlay').fadeOut();
    }, 5000);
    setTimeout(function() {
        $('.nav-learn').fadeIn();
        $('.main-content').fadeIn();
        $('.next-concept').fadeIn();
    }, 5500);

    updateProgressBar();

    $(".next-concept").click(function () {
        if (currentConcept < totalConcepts) {
            $("#concept-" + currentConcept).hide();
            currentConcept++;
            $("#concept-" + currentConcept).show();
            updateProgressBar();

            // Hide the next-concept button when arriving at concept-3          
            if (currentConcept > 2) {
                $(".next-concept").hide();
            }

        }
    });

    // Concept 4
    $(".color4").click(function () {
        $('.color4').addClass('green-flash')
        $(".next-concept").fadeIn();
    });

    // Concept 5
    var shallowTileClicked = false;

    $(".tiles-training").click(function () {
        winAudio.pause();
        
        var tile = $(this);
        var data = tile.attr("data");

        if (data === "answer-shallow" && !shallowTileClicked) {
            tile.addClass("green-flash");
            winAudio.play();
            tile.attr("data", null);
            shallowTileClicked = true;
            $(".explanation.change1").hide();
            $(".explanation.change2").show();
            
        } else if (data === "answer-deep" && shallowTileClicked) {
            tile.addClass("green-flash");
            winAudio.play();
            tile.attr("data", null);

            // Check if both shallow and deep tiles are clicked
            if ($(".tiles-training[data]").length === 0) {
                setTimeout(function() {
                    progressBar.css("width", "100%");
                    progressBar.attr("aria-valuenow", "100");
                    progressAudio.play();
                }, 1500);
                setTimeout(function () {
                    localStorage.setItem('cameFromTutorial', 'true');
                    window.location.href = "/";
                }, 2500);
            }
        }
    });

});

// Concept 3 : Drag & Drop logic
var successfulDrops = 0;

function allowDrop(ev) {
ev.preventDefault();
}

function drag(ev) {
ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
ev.preventDefault();
var data = ev.dataTransfer.getData("text");
var draggedElement = document.getElementById(data);

var dropTarget = ev.target;

if (ev.target.classList.contains("drop")) {
    if (dropTarget.getAttribute("data-answer") === data) {
        ev.target.appendChild(draggedElement.cloneNode(true));
        dropTarget.classList.add("green-flash");
        successfulDrops++;
        console.log(successfulDrops)

        // Check if all drag objects are dropped successfully
        if (successfulDrops === 3) {
            // Show the "next-concept" element
            $(".next-concept").fadeIn();
        }
    }
}
}

function updateProgressBar() {
    // Calculate the progress percentage
    var progress = ((currentConcept-1) / (totalConcepts)) * 100;

    progressBar.css("width", progress + "%");
    progressBar.attr("aria-valuenow", progress);
    if (currentConcept > 1) {
        progressAudio.play();
    }

}

