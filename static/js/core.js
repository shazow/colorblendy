function assure_hash_prefix(s) {
    if(s[0] == '#') return s;
    return '#' + s;
}
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
    multiply: function(bg, fg) {
        return (fg*bg)/255;
    },
    screen: function(bg, fg) {
        return 255 - (((255-fg)*(255-bg)) >> 8);
    },
    overlay: function(bg, fg) {
        return (bg < 128) ? (2 * fg * bg / 255) : (255 - 2 * (255 - bg) * (255 - fg) / 255);
    },
    dodge: function(bg, fg) {
        return bg == 255 ? bg : Math.min(255, (fg << 8) / (255 - bg));
    },
    burn: function(bg, fg) {
        return bg == 0 ? bg : Math.max(0, (255 - ((255-fg) << 8) / bg));
    },
    negate: function(bg, fg) {
        return 255 - Math.abs(255 - bg - fg);
    }
}

function blend(filter, c1, c2) {
    var c = apply_filter(c1, c2, blend_filters[filter])
    return $.map(c, function(o) { return Math.min(Math.round(o), 255); })
}


function render_blend() {
    var blend_mode = $("#blend-mode li.active").text().toLowerCase();

    $("#color-bottom-preview").css('background-color', assure_hash_prefix($("#color-bottom").val()));
    $("#color-top-preview").css('background-color', assure_hash_prefix($("#color-top").val()));

    var c1 = css_to_rgb($("#color-bottom-preview").css('background-color'));
    var c2 = css_to_rgb($("#color-top-preview").css('background-color'));
    var blended = blend(blend_mode, c1, c2);

    $("#color-blended-preview").css('background-color', rgb_to_css(blended));
    $("#color-blended").val("#" + rgb_to_hex(blended));
}
