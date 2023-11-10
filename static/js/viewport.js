
document.addEventListener('DOMContentLoaded', function() {
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

});


 