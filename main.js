import '../scss/main.scss';
import $ from 'jquery';
import * as Helpers from './components/helpers';
// import './components/scene';
import './components/rain';
// import './components/bobsite';
// import './components/birds';
// import './components/final';
// import './components/ssr';
// import './components/bloom';
// import './components/test';
// import './components/configurator';

//========================================================================

var width = Helpers.viewport().width,
    height = Helpers.viewport().height,
    device = Helpers.which_device(width),
    timeoutResize;

window.addEventListener("resize", function () {
    clearTimeout(timeoutResize);
    timeoutResize = setTimeout(function () {
        device = Helpers.onresize(device);
        // Resize uniquement en largeur et non au scroll
        if (Helpers.viewport().width !== width && Helpers.viewport().height !== height) {
        }
    }, 100);
});

//========================================================================

$(window).on('load', function () {
    $("#bdc_submit_button").on("click", (e) => {
        e.preventDefault();

        const email = $("#email_form_email")[0].value;
        if (!!email) {
            const boxMessage = $("#bdc_message")[0];
            $.ajax({
                method: 'GET',
                url: "/action/" + email,
                success: function (response) {
                    boxMessage.innerHTML = response.message;
                },
                error: function (response) {
                    boxMessage.innerHTML = "Error";
                }
            });
        }
    });

    //========================================================================

    //     const video1 = $("#video-1")[0], video2 = $("#video-2")[0];
    //     if (!!video1 && !!video2) {
    //         $(".bdc-header").fadeOut(1);
    //         $("#otl-home").fadeOut(1);
    //         setTimeout(function () {
    //             video2.play();
    //             video1.style.zIndex = "-2";
    //             video2.style.zIndex = "-1";
    //             $(".bdc-header").fadeIn(1000);
    //             $("#otl-home").fadeIn(1000);
    //         }, 8000);
    //     }
});

//========================================================================