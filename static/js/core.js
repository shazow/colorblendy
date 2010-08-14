function hex_to_rgb(hex) {
    /* "FFFFFF" -> [255,255,255] */
    if(hex[0] == '#') {
        hex = hex.substring(1,7);
    }
    return [parseInt(hex.substring (0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)]
}

function rgb_to_hex(rgb) {
    /* [255,255,255] -> "FFFFFF" */
    var r = (rgb[2] | (rgb[1] << 8) | (rgb[0] << 16)).toString(16);

    // Pad 0's
    for(var i=0, stop=6-r.length; i<stop; i++) r += "0";

    return r;
}

function css_to_rgb(s) {
    /* "rgb(255, 255, 255)" -> [255,255,255] */
    return $.map(s.substring(4,s.length-1).split(','), function(o) { return parseInt(o.trim()) });
}

function rgb_to_css(rgb) {
    /* [255,255,255] -> "rgb(255, 255, 255)" */
    return 'rgb(' + rgb[0] + ',' + rgb[1] +',' + rgb[2] + ')';
}

function color_opacity(c1, opacity) {
    return [
        Math.round((c1[0] * opacity)),
        Math.round((c1[1] * opacity)),
        Math.round((c1[2] * opacity)),
    ]
}

function apply_filter(c1, c2, fn) {
    return [fn(c1[0], c2[0]),
            fn(c1[1], c2[1]),
            fn(c1[2], c2[2])]
}

var blend_filters = {
    multiply: function(c1, c2) {
        return (c1*c2)/255;
    },
    divide: function(c1, c2) {
        return (256*c2)/(c1+1);
    },
    screen: function(c1, c2) {
        return 255 - ((255-c1)*(255-c2))/255;
    },
    overlay: function(c1, c2) {
        return (c2/255)*(c2+(2*c1)/255)*(255-c2);
    },
    dodge: function(c1, c2) {
        return (c2*256)/(256-c1);
    },
    burn: function(c1, c2) {
        return 255 - (((255-c2)*256)/(c1+1));
    }
}

function blend(filter, c1, c2) {
    var c = apply_filter(c1, c2, blend_filters[filter])

    // Normalize colors
    var max = Math.max(c[0], c[1], c[2]);

    return $.map(c, function(o) { return Math.round((o/max)*255)})
}


function render_blend() {
    var c1e = $("#color-1");
    var c2e = $("#color-2");
    var t = $("#color-blended");
    var blend_mode = $("#blend-mode").val();

    var c1 = css_to_rgb(c1e.css('background-color'));
    var c2 = css_to_rgb(c2e.css('background-color'));
    var blended = blend(blend_mode, c1, c2);

    $("#current-color-1").val("#" + rgb_to_hex(c1));
    $("#current-color-2").val("#" + rgb_to_hex(c2));
    $("#current-blend").val("#" + rgb_to_hex(blended));

    t.css('background-color', rgb_to_css(blended));
}

function add_color(form) {
    var color = $("input.color-input", form).val();
    var unit = $('<div class="color-unit color-draggable"></div>').css('background-color', color).draggable({helper: 'clone'});
    $("#palette").append(unit);
}
