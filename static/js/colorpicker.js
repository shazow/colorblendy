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

//
// Accepts a "base" color and builds a square gradient with that color, black,
// and white.
//
function generatePickerSquare(img, rbase, gbase, bbase) {
    var i,j,r,g,b,size,coeff,x,y;
    size=img.width;
    coeff=0x100/size;

    for (i=0; i<size; i++) {
        for (j=0; j<size; j++) {
            var ij=i-j;
            r=parseInt(coeff*(ij+rbase*j < 0 ? 0 : ij+rbase*j));
            g=parseInt(coeff*(ij+gbase*j < 0 ? 0 : ij+gbase*j));
            b=parseInt(coeff*(ij+bbase*j < 0 ? 0 : ij+bbase*j));
            setPixel(img, i, j, r, g, b);
        }
    }
}

//
// Given a coefficient x in the range [0,1), calculate the color in the rainbow
// spectrum that should appear at that spot.
//
// The rule for the calculation is that at least 1 color must be at 100% at all
// times, but no more than 2 colors are active at any one time, and all
// permutations satisfying this requirement are in the spectrum
//
function getSpectrumColor(color, x) {
    var t,n;
    t = x*6.0;
    if (t<1) {
        t=t;
        n=[1,t,0];
    } else if (t<2) {
        t=t-1.0;
        n=[1-t,1,0];
    } else if (t<3) {
        t=t-2.0;
        n=[0,1,t];
    } else if (t<4) {
        t=t-3.0;
        n=[0,1-t,1];
    } else if (t<5) {
        t=t-4.0;
        n=[t,0,1];
    } else {
        t=t-5.0;
        n=[1,0,1-t];
    }
    color[0]=n[0];
    color[1]=n[1];
    color[2]=n[2];
}

//
// Given a canvas context ctx, a pixel array m, and an active location x in the
// range [0,1), draw the spectrum bar on the canvas and put a black line at
// location x.
//
function drawSpectrumBar(ctx,m,x) {
    var color=[0,0,0],factor=0x100,w=m.width,h=m.height;
    // Loop through the canvas
    for(i=0; i<w; i++) {
        // Get the color that should be at this location
        getSpectrumColor(color, i/w);
        for (j=0; j<h; j++) {
            setPixel(m, i, j, color[0]*factor, color[1]*factor, color[2]*factor);
        }
    }
    // Render the image array to the canvas.
    ctx.putImageData(m,0,0);

    // Draw the line.
    ctx.beginPath();
    ctx.moveTo(parseInt(x*w),0);
    ctx.lineTo(parseInt(x*w),h);
    ctx.closePath();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
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
    ctx.lineWidth = 2;
    ctx.stroke();
}

var img, color;

$(document).ready(function() {
    var e,s,loc=[0,0],col=0;

    // Generate the spectrum bar.
    e = $("#spectrumbar").get(0);
    ctxb = e.getContext("2d");

    w = parseInt(e.getAttribute("width"));
    h = parseInt(e.getAttribute("height"));

    m = ctxb.createImageData(w, h);
    drawSpectrumBar(ctxb,m,col);
    ctxb.putImageData(m, 0, 0);

    // Generate the picker square.
    e = $("#pickersquare").get(0);
    ctx = e.getContext("2d");

    s = parseInt(e.getAttribute("width"));

    img = ctx.createImageData(s, s);

    var regeneratePickerSquare = function(coeff) {
        var color=[];
        getSpectrumColor(color,coeff,1);
        generatePickerSquare(img,color[0],color[1],color[2]);
    }

    var redrawPickerSquare = function() {
        var idx=(loc[0] + loc[1] * m.width) * 4;
        var r=img.data[idx],
            g=img.data[idx+1],
            b=img.data[idx+2];
        $("#color").css("background-color","rgb("+r+","+g+","+b+")");
        ctx.putImageData(img, 0, 0);
        drawFocusCircle(ctx, 6, loc[0], loc[1], "#ffffff");
        drawFocusCircle(ctx, 8, loc[0], loc[1], "#000000");
    };

    var regenRedrawPicker = function() {
        regeneratePickerSquare(col);
        redrawPickerSquare();
    };

    var cfun = function(ev) {
        os=$("#pickersquare").offset();
        loc[0]=ev.pageX - os.left;
        loc[1]=ev.pageY - os.top;
        redrawPickerSquare();
    };

    var calcSpectrumOffset = function(ev) {
        os=$("#spectrumbar").offset();
        col=(ev.pageX-os.left)/m.width;
        drawSpectrumBar(ctxb,m,col);
        regenRedrawPicker();
    };

    regenRedrawPicker();

    var sqDrag=false;
    var pDrag=false;

    $("#pickersquare").click(cfun);
    $("#pickersquare").mousedown(function(e) {
        sqDrag = true;
    });
    $("#pickersquare").mousemove(function(e) {
        if (sqDrag) {cfun(e);}
    });
    $("#spectrumbar").click(calcSpectrumOffset);
    $("#spectrumbar").mousedown(function(e) {
        pDrag = true;
    });
    $("#spectrumbar").mousemove(function(e) {
        if (pDrag) {calcSpectrumOffset(e);}
    });
    $(document).mouseup(function(e) {
        sqDrag = false;
        pDrag = false;
    });
});
