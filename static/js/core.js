/* IE patch. :( */
if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}
/***/

function assure_hash_prefix(s) {
    if(s[0] == '#' || !(/^[\dabcdef]{3,6}$/).test(s)) return s;
    return '#' + s;
}
function hex_to_rgb(hex) {
    /* "FFFFFF" -> [255,255,255] */
    if(hex[0] == '#') hex = hex.substring(1,7);
    if(hex.length < 6) hex += "000000".substr(0,6-hex.length);
    return [parseInt(hex.substring (0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)]
}

function rgb_to_hex(rgb) {
    /* [255,255,255] -> "FFFFFF" */
    var r = (rgb[2] | (rgb[1] << 8) | (rgb[0] << 16)).toString(16);
    return "000000".substr(0,6-r.length) + r;
}

function css_to_rgb(s) {
    /* "rgb(255, 255, 255)" or "#ffffff" -> [255,255,255] */
    if(s[0] == '#') return hex_to_rgb(s); // NOTE: IE8 does not always return rgb
    return $.map(s.substring(4,s.length-1).split(','), function(o) { return parseInt(o.trim()) });
}

function rgb_to_css(rgb) {
    /* [255,255,255] -> "rgb(255,255,255)" */
    return 'rgb(' + rgb[0] + ',' + rgb[1] +',' + rgb[2] + ')';
}

function rgb_a_to_css(rgb, a) {
    /* [255,255,255,0.5] -> "rgba(255,255,255,0.5)" */
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}

function rgb_to_hsv(rgb){
    /* [50,50,100] -> [170, 127.5, 100] */
    var r = rgb[0]/255, g = rgb[1]/255, b = rgb[2]/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    if(max==min) return [0,0,max*255];

    var v = max, s = (max-min) / max;
    var rc = (max-r) / (max-min),
        gc = (max-g) / (max-min),
        bc = (max-b) / (max-min);

    if(r==max) h = bc-gc;
    else if(g==max) h = 2+rc-bc;
    else h = 4.0+gc-rc;

    h = (h/6.0) % 1.0;
    if(h<0) h += 1.0

    return [h*255,s*255,v*255];
}

function invert_rgb(rgb) {
    return [0xff - rgb[0], 0xff - rgb[1], 0xff - rgb[2]];
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
    return [Math.min(Math.round(c[0]), 255), Math.min(Math.round(c[1]), 255), Math.min(Math.round(c[2]), 255)];
}

function render_blend() {
    var blend_mode = $("#blend-mode li.active").text().toLowerCase();
    try {
        $("#color-bottom-preview").css('background-color', assure_hash_prefix($("#color-bottom").val()));
        $("#color-top-preview").css('background-color', assure_hash_prefix($("#color-top").val()));

        var c1 = css_to_rgb($("#color-bottom-preview").css('background-color'));
        var c2 = css_to_rgb($("#color-top-preview").css('background-color'));
        var blended = blend(blend_mode, c1, c2);

        $("#color-blended-preview").css('background-color', rgb_to_css(blended));
        $("#color-blended").val("#" + rgb_to_hex(blended));
    } catch(err) {
        alert("Unsupported color format.");
    }
}

$(document).ready(function() {
    var active = $("#blend-mode li.active");
    $("#blend-mode li").click(function(e) {
        if(active) $(active).removeClass('active');
        active = $(this).addClass('active');
        render_blend();
    });
    $(document).keydown(function(e) {
        if(e.which == 38 || e.which == 75) { // Down
            $(active).prev().click();
        } else if(e.which == 40 || e.which == 74) { // Up
            $(active).next().click();
        }
    });

    $("body").disableTextSelect();

    var p1 = new ColorPicker($("#color-bottom"));
    var p2 = new ColorPicker($("#color-top"));

    var p1_preview = $("#color-bottom-preview");
    p1.add_listener('change', function(e, rgb) {
        e.stopPropagation();

        p1_preview.css('background-color', rgb_to_css(rgb));
        p1.target.val("#" + rgb_to_hex(rgb));
        render_blend();
    });

    var p2_preview = $("#color-top-preview");
    p2.add_listener('change', function(e, rgb) {
        e.stopPropagation();

        p2_preview.css('background-color', rgb_to_css(rgb));
        p2.target.val("#" + rgb_to_hex(rgb));
        render_blend();
    });
});
