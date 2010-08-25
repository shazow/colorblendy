// Original author: John Zila
// Modified by: Andrey Petrov

//
// Set the color of the pixel in img at coordinates x and y to the color
// provided
//
function setPixel(img, x, y, r, g, b) {
    var i = (x + y * img.width) * 4;
    img.data[i+0] = r;
    img.data[i+1] = g;
    img.data[i+2] = b;
    img.data[i+3] = 0xff;
}

function ctx_xy_to_rgb(ctx, xy) {
    var img=ctx.getImageData(xy[0],xy[1],1,1);
    return [img.data[0], img.data[1], img.data[2]];
}

//
// Accepts a "base" color and builds a square gradient with that color, black,
// and white.
//
function generatePickerSquare(ctx, rgb) {
    var w=ctx.canvas.width, h=ctx.canvas.height;

    var gradients = [
        ["#ffffff","#ffffff"],
        [rgb_a_to_css(rgb, 0),rgb_a_to_css(rgb, 0xff)],
        [rgb_a_to_css([0,0,0], 1),rgb_a_to_css([0,0,0], 0)]
    ];
    var locs = [
        [0,0,w,0],
        [0,0,0,h],
        [0,0,w,0]
    ];
    for (i=0; i<3; i++) {
        var gradient = ctx.createLinearGradient(locs[i][0],locs[i][1],locs[i][2],locs[i][3]);
        gradient.addColorStop(0,gradients[i][0]);
        gradient.addColorStop(1,gradients[i][1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0,0,w,h);
    }
}

//
// Given a canvas context ctx and an active location x in the
// range [0,1), draw the spectrum bar on the canvas and put a black line at
// location x.
//
function drawSpectrumBar(ctx,x) {
    var w=ctx.canvas.width, h=ctx.canvas.height, xw=Math.floor(x*w);
    var gradient=ctx.createLinearGradient(0,0,w,0),sw=1.0/6;
    var colors=[
        "#FF0000",
        "#FFFF00",
        "#00FF00",
        "#00FFFF",
        "#0000FF",
        "#FF00FF"
    ];
    var locs=[0,sw,2*sw,3*sw,4*sw,5*sw,6*sw];
    for (i=0; i<7; i++) {
        gradient.addColorStop(locs[i], colors[i%6]);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,w,h);

    // Draw the line.
    ctx.beginPath();
    ctx.moveTo(xw,0);
    ctx.lineTo(xw,h);
    ctx.closePath();
    ctx.strokeStyle = rgb_to_css(invert_rgb(ctx_xy_to_rgb(ctx, [xw,0])));
    ctx.lineWidth = 4;
    ctx.stroke();
}

//
// Draw a circle on the provided context with radius r, centered at (x,y), and
// styled with the color string represented by color.
//
function drawFocusCircle(ctx,r,x,y,color) {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function fillFocusCircle(ctx,r,x,y,color) {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function clip(x,y,w,h) {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= w) x = w-1;
    if (y >= h) y = h-1;
    return [x,y];
}

/***/

var active_picker = false;

function attach_colorpicker(t, preview, callback) {
    var picker = $('<canvas class="picker" width="208px" height="208px"></canvas>');
    var spectrum = $('<canvas class="spectrum" width="208px" height="25px"></canvas>');
    var box = $('<div class="color-picker"></div').append(picker).append(spectrum);
    $(t).after(box);
    var controller = render_colorpicker(spectrum, picker, callback);

    var focusfn = function(e) {
        e.stopPropagation();
        $(t).select();
        if(active_picker) $(active_picker).hide();
        active_picker = $(box).show();

        console.log(preview);
        controller(css_to_rgb($(preview).css('background-color')));
    };
    $(t).click(focusfn).focus(focusfn).keydown(function(e) {
        if(e.which == 13) {
            $(active_picker).hide();
            active_picker = false;
        }
    });
    return controller;
}

$(document).ready(function() {
    $("body").click(function() {
        if(!active_picker) return;
        $(active_picker).hide();
        active_picker = false;
    });
});


function render_colorpicker(spectrumbar, pickersquare, callback) {
    var e,s,loc=[0,0],col=0,os;

    // Generate the spectrum bar.
    var ctxb = spectrumbar[0].getContext("2d");
    var w=spectrumbar.width(), h=spectrumbar.height();

    drawSpectrumBar(ctxb, col);

    // Generate the picker square.
    var ctx = pickersquare[0].getContext("2d");

    var drawPickerSquare = function(coeff) {
        var xy=[parseInt(coeff*(ctxb.canvas.width-1)), 0];
        var rgb=invert_rgb(ctx_xy_to_rgb(ctxb, xy));
        generatePickerSquare(ctx,rgb);
    }

    var drawPickerCircle = function(ctx, loc) {
        var rgb = ctx_xy_to_rgb(ctx, loc);
        callback(rgb);

        fillFocusCircle(ctx, 7, loc[0], loc[1], "#" + rgb_to_hex(rgb));
        drawFocusCircle(ctx, 7.5, loc[0], loc[1], "#000000");
        drawFocusCircle(ctx, 6, loc[0], loc[1], "#ffffff");
    };

    var redrawPicker = function(ctx,loc,col) {
        drawPickerSquare(col);
        drawPickerCircle(ctx,loc);
    };

    var cfun = function(ev) {
        ev.stopPropagation();
        os = $(pickersquare).offset();
        loc = clip(ev.pageX-os.left,ev.pageY-os.top,ctx.canvas.width,ctx.canvas.height);
        drawPickerSquare(col);
        drawPickerCircle(ctx,loc);
    };

    var calcSpectrumOffset = function(ev) {
        ev.stopPropagation();
        var w=ctxb.canvas.width, h=ctxb.canvas.height;
        os=$(spectrumbar).offset();
        var xy=clip(ev.pageX-os.left,ev.pageY-os.top,w,h);
        col=(xy[0])/ctxb.canvas.width;
        drawSpectrumBar(ctxb,col);
        redrawPicker(ctx,loc,col);
    };

    redrawPicker(ctx,loc,col);

    var sqDrag=false;
    var pDrag=false;

    $(pickersquare).click(cfun);
    $(pickersquare).mousedown(function(e) {
        sqDrag = true;
    });
    $(spectrumbar).click(calcSpectrumOffset);
    $(spectrumbar).mousedown(function(e) {
        pDrag = true;
    });
    $(document).mousemove(function(e) {
        if (sqDrag) {cfun(e);}
        if (pDrag) {calcSpectrumOffset(e);}
    });
    $(document).mouseup(function(e) {
        sqDrag = false;
        pDrag = false;
    });

    return function(rgb) {
        var hsv=rgb_to_hsv(rgb);
        col = (hsv[0]/0xff);
        loc[0] = (hsv[2]/0xff)*ctx.canvas.width;
        loc[1] = (hsv[1]/0xff)*ctx.canvas.height;
        drawSpectrumBar(ctxb,col);
        drawPickerSquare(col);
        drawPickerCircle(ctx,loc);
    }
}
