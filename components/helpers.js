/**
* Récupère les dimensions de la fenêtre du navigateur et donc la résolution
* @returns {{width: *, height: *}}
*/
export function viewport() {
    var e = window, a = 'inner';
    if (!('innerWidth' in window)) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return { width: e[a + 'Width'], height: e[a + 'Height'] };
};

/**
* Permet de savoir sur quel type d'appareil on est
* @returns {number}
*/
export function which_device(width) {
    if (width > 767) {
        if (width > 1366) {
            return 5; // desktop large
        } else if (width > 1199) {
            return 4; // desktop
        } else if (width > 1023) {
            return 3; // tablet landscape
        } else if (width > 991) {
            return 2; // tablet md
        }
        else {
            return 1; //tablet sm
        }
    }
    return 0; // mobile
};

/**
* Resize
*/
export function onresize(device) {
    let width = viewport().width;
    let height = viewport().height;


    if (device !== which_device(width)) {
        return device = which_device(width);
    }
}

// Restricts input for the given textbox to the given inputFilter function.
export function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            } else {
                this.value = "";
            }
        });
    });
}

export function validateEmail(mail) {
    var mailFormatRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (mail.match(mailFormatRegex)) {
        return true;
    }
    else {
        return false;
    }
}

/**
 * Cookies
 */
export function bake_cookie(name, value) {
    var cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
    document.cookie = cookie;
}

export function read_cookie(name) {
    var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
    result && (result = JSON.parse(result[1]));
    return result;
}

export function delete_cookie(name) {
    document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
}

export var Opacity = {
    opacityDefaultDuration: 250,  // default duration
    fadeIn: function (target, duration, display = 'block') {
        if (typeof target !== "undefined" && target !== null) {
            target.style.opacity = 0;
            target.style.display = display;
            if (typeof duration !== "number" || duration == 0) {
                duration = Opacity.opacityDefaultDuration;
            }
            var step = 10 / duration;
            Opacity._setOpacity(target, step, 'fadeIn');
        }
    },

    fadeOut: function (target, duration) {
        if (typeof target !== "undefined" && target !== null) {
            target.style.opacity = 1;

            if (typeof duration !== "number" || duration == 0) {
                duration = Opacity.opacityDefaultDuration;
            }
            var step = 10 / duration;
            Opacity._setOpacity(target, step, 'fadeOut');
        }
    },

    _setOpacity: function (target, step, type) {
        switch (type) {
            case 'fadeOut': {
                var op = parseFloat(target.style.opacity) - step;
                if (op > 0) {
                    target.style.opacity = op;
                    setTimeout(function () {
                        Opacity._setOpacity(target, step, 'fadeOut');
                    }, 10);
                } else {
                    target.style.display = 'none';
                }
                break;
            }
            case 'fadeIn': {
                var op = step + parseFloat(target.style.opacity);
                if (op < 1) {
                    target.style.opacity = op;
                    setTimeout(function () {
                        Opacity._setOpacity(target, step, 'fadeIn');
                    }, 10);
                } else {
                    target.style.opacity = 1;
                }
                break;
            }
        }
    }
}

/**
 * Fonction de dépliement d'un bloc
 * @param target
 * @param duration
 */
export function slideUp(target, duration = 500) {
    target.style.height = target.offsetHeight + 'px';
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = duration + 'ms';
    target.offsetHeight; // redraw
    target.style.overflow = 'hidden';
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;

    window.setTimeout(function () {
        target.style.display = 'none';
        target.style.removeProperty('height');
        target.style.removeProperty('padding-top');
        target.style.removeProperty('padding-bottom');
        target.style.removeProperty('margin-top');
        target.style.removeProperty('margin-bottom');
        target.style.removeProperty('overflow');
        target.style.removeProperty('transition-duration');
        target.style.removeProperty('transition-property');
    }, duration);
};

/**
 * Fonction de repliement d'un bloc
 * @param target
 * @param duration
 */
export function slideDown(target, duration = 500, newDisplay = 'block') {
    target.style.removeProperty('display');

    var display = window.getComputedStyle(target).display;

    target.style.display = (display === 'none') ? newDisplay : display;

    var height = target.offsetHeight;

    target.style.overflow = 'hidden';
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight; // redraw
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + 'ms';
    target.style.height = height + 'px';
    target.style.removeProperty('padding-top');
    target.style.removeProperty('padding-bottom');
    target.style.removeProperty('margin-top');
    target.style.removeProperty('margin-bottom');

    window.setTimeout(function () {
        target.style.removeProperty('height');
        target.style.removeProperty('overflow');
        target.style.removeProperty('transition-duration');
        target.style.removeProperty('transition-property');
    }, duration);
};

/**
 * Fonction permettant d'alterner entre dépliement et repliement d'un bloc
 * @param source
 * @param target
 * @param duration
 */
export function slideToggle(target, source = null, duration = 500) {
    if (window.getComputedStyle(target).display === 'none') {
        /*if (source.classList.contains('oct_link__publications')) {
            source.querySelector('i').classList.remove('fa-chevron-down');
            source.querySelector('i').classList.add('fa-chevron-up');
        }
        else {
            source.querySelector('i').classList.remove('fa-chevron-right');
            source.querySelector('i').classList.add('fa-chevron-down');
        }*/

        return slideDown(target, duration);
    } else {
        /*if (source.classList.contains('oct_link__publications')) {
            source.querySelector('i').classList.remove('fa-chevron-up');
            source.querySelector('i').classList.add('fa-chevron-down');
        }
        else {
            source.querySelector('i').classList.remove('fa-chevron-down');
            source.querySelector('i').classList.add('fa-chevron-right');
        }*/

        return slideUp(target, duration);
    }
};