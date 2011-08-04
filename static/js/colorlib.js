/* colorlib.js 1.0
 *
 * Collection of color manipulation functions.
 *
 * Copyright 2010, Andrey Petrov <andrey.petrov@shazow.net>
 *
 * Released under the MIT license.
 */


/* IE patch. :( */
if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}
/***/

function assure_hash_prefix(s) {
    /* Helper for normalizing CSS color inputs. */
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
    /* [255,255,255], 0.5 -> "rgba(255,255,255,0.5)" */
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
}

function rgb_to_hsv(rgb) {
    /*
     * (Based on Python's colorsys.rgb_to_hsv)
     */
    var r = rgb[0]/255, g = rgb[1]/255, b = rgb[2]/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    if(max==min) return [0,0,max];

    var v = max, s = (max-min) / max;
    var rc = (max-r) / (max-min),
        gc = (max-g) / (max-min),
        bc = (max-b) / (max-min);

    if(r==max) h = bc-gc;
    else if(g==max) h = 2+rc-bc;
    else h = 4.0+gc-rc;

    h = (h/6.0) % 1.0;
    if(h<0) h += 1.0

    return [h, s, v];
}

function hsv_to_rgb(hsv) {
    /*
     * (Based on Python's colorsys.hsv_to_rgb)
     */
    var h = hsv[0], s = hsv[1], v = hsv[2] * 255;

    if(s==0) return [v,v,v];

    var i = Math.floor(h * 6);
    var f = (h * 6) - i;

    var p = v * (1 - s);
    var q = v * (1 - s*f);
    var t = v * (1 - s*(1 - f));

    var i = i % 6;
    if(i==0) return [v, t, p];
    if(i==1) return [q, v, p];
    if(i==2) return [p, v, t];
    if(i==3) return [p, q, v];
    if(i==4) return [t, p, v];
    if(i==5) return [v, p, q];
}

function rgb_to_hsl(rgb) {
    var r = rgb[0]/255, g = rgb[1]/255, b = rgb[2]/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var h, s, l = (min+max)/2;

    if(min == max) return [0, 0, l];

    if(l <= 0.5) s = (max-min) / (max+min);
    else s = (max-min) / (2-max-min);

    var rc = (max-r) / (max-min);
    var gc = (max-g) / (max-min);
    var bc = (max-b) / (max-min);

    if(r == max) h = bc - gc;
    else if(g == max) h = 2 + rc - bc;
    else h = 4 + gc - rc;

    h = (h/6.0) % 1.0;
    if(h<0) h += 1.0

    return [h, s, l];
}

function hsl_to_rgb(hsl) {
    var h = hsl[0], s = hsl[1], l = hsl[2];
    var m1, m2;

    if(s == 0) return [l*255, l*255, l*255];

    if(l <= 0.5) m2 = l * (1+s);
    else m2 = l+s-(l*s);

    m1 = 2*l - m2;
    var r = hue_to_rgb(m1, m2, h+(1/3)),
        g = hue_to_rgb(m1, m2, h),
        b = hue_to_rgb(m1, m2, h-(1/3));

    return [255*r, 255*g, 255*b];
}

function hue_to_rgb(v1, v2, hue) {
   if(hue < 0) hue += 1;
   if(hue > 1) hue -= 1;
   if((6 * hue) < 1) return v1 + (v2 - v1) * 6 * hue;
   if((2 * hue) < 1) return v2;
   if((3 * hue) < 2) return v1 + (v2 - v1) * ((2 / 3) - hue) * 6;
   return v1;
}

function invert_rgb(rgb) {
    /* [255, 0, 255] -> [0, 255, 0] */
    return [0xff - rgb[0], 0xff - rgb[1], 0xff - rgb[2]];
}

function apply_filter(c1, c2, fn) {
    /* Given two colors and a filter function, apply the filter to each channel and return a new color. */
    return [fn(c1[0], c2[0]),
            fn(c1[1], c2[1]),
            fn(c1[2], c2[2])];
}


/* Collection of blend filters.
 *
 * Note: Finding the math for these and porting them took quite a bit of effort. Hopefully your
 * time will be saved by my efforts. Corrections and more additions are welcome.
 */
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
