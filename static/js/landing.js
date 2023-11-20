
$(document).ready(function () {

    function setFontSize() {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        var introDivFontSize = 4 * vh;

        $("#introDiv").css('font-size', introDivFontSize + 'px');
        $(".slogan").css('font-size', (introDivFontSize/1.5) + 'px');
      }

      setTimeout(function() {
        $("body").fadeOut();
        //if (route === 'tutorial') {
          //  window.location.href = '/tutorial';
        //} else {
            window.location.href = '/homepage';
        //}
    }, 5500);



    var titleAnimation = "slide-in-blurred-top"
    var titleLetter = $(".title")

    function titleSlide(index){
        if (index < titleLetter.length) {
        setTimeout(function(){
            titleLetter.eq(index).show().addClass(titleAnimation);
            titleSlide(index + 1);
        }, 100);

    } 
    }

    setFontSize();
    window.addEventListener('resize', setFontSize);
    titleSlide(0);

});