function setPixel(img, x, y, r, g, b) {
    var i = (x + y * img.width) * 4;
    img.data[i+0] = r;
    img.data[i+1] = g;
    img.data[i+2] = b;
    img.data[i+3] = 0xff;
}

function drawSquareGradient(img, rbase, gbase, bbase) {
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

function getSpectrumColor(color, x, w) {
    var f,v,t,n;
    f = 1.0/0x100;
    v = (x/w)*0x600;
    if (v<0x100) {
        t=v;
        n=[1,f*t,0];
    } else if (v<0x200) {
        t=v-0x100;
        n=[1-f*t,1,0];
    } else if (v<0x300) {
        t=v-0x200;
        n=[0,1,f*t];
    } else if (v<0x400) {
        t=v-0x300;
        n=[0,1-f*t,1];
    } else if (v<0x500) {
        t=v-0x400;
        n=[f*t,0,1];
    } else {
        t=v-0x500;
        n=[1,0,1-f*t];
    }
    color[0]=n[0];
    color[1]=n[1];
    color[2]=n[2];
}

function drawSpectrumBar(ctxb,m,x) {
    var color=[0,0,0],f=0x100,w=m.width,h=m.height;
    for(i=0; i<w; i++) {
        getSpectrumColor(color, i, w);
        for (j=0; j<h; j++) {
            setPixel(m, i, j, color[0]*f, color[1]*f, color[2]*f);
        }
    }
    ctxb.putImageData(m,0,0);
    ctxb.beginPath();
    ctxb.moveTo(parseInt(x*w),0);
    ctxb.lineTo(parseInt(x*w),h);
    ctxb.closePath();
    ctxb.strokeStyle = "#000000";
    ctxb.lineWidth = 3;
    ctxb.stroke();
}

function drawFocusCircle(ctx,r,x,y,co) {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.strokeStyle = co;
    ctx.lineWidth = 2;
    ctx.stroke();
}

var img, color;

$(document).ready(function() {
    var e,s,loc=[0,0],col=0;

    e = $("#pickerbase").get(0);
    ctxb = e.getContext("2d");

    w = parseInt(e.getAttribute("width"));
    h = parseInt(e.getAttribute("height"));

    m = ctxb.createImageData(w, h);
    drawSpectrumBar(ctxb,m,col);
    ctxb.putImageData(m, 0, 0);

    e = $("#pickersquare").get(0);
    ctx = e.getContext("2d");

    s = parseInt(e.getAttribute("width"));

    img = ctx.createImageData(s, s);

    var tfun = function(coeff) {
        var color=[];
        getSpectrumColor(color,coeff,1);
        drawSquareGradient(img,color[0],color[1],color[2]);
    }

    var rfun = function() {
        var idx=(loc[0] + loc[1] * m.width) * 4;
        var r=img.data[idx],
            g=img.data[idx+1],
            b=img.data[idx+2];
        $("#color").css("background-color","rgb("+r+","+g+","+b+")");
        ctx.putImageData(img, 0, 0);
        drawFocusCircle(ctx, 6, loc[0], loc[1], "#ffffff");
        drawFocusCircle(ctx, 8, loc[0], loc[1], "#000000");
    };

    var trfun = function() {
        tfun(col); rfun();
    };

    var cfun = function(ev) {
        os=$("#pickersquare").offset();
        loc[0]=ev.pageX - os.left;
        loc[1]=ev.pageY - os.top;
        rfun();
    };

    var calcSpectrumOffset = function(ev) {
            os=$("#pickerbase").offset();
            col=(ev.pageX-os.left)/m.width;
            drawSpectrumBar(ctxb,m,col);
            trfun();
        };

    trfun();

    var sqDrag=false;
    var pDrag=false;

    $("#pickersquare").click(cfun);
    $("#pickersquare").mousedown(function(e) {
        sqDrag = true;
    });
    $("#pickersquare").mousemove(function(e) {
        if (sqDrag) {cfun(e);}
    });
    $("#pickerbase").click(calcSpectrumOffset);
    $("#pickerbase").mousedown(function(e) {
        pDrag = true;
    });
    $("#pickerbase").mousemove(function(e) {
        if (pDrag) {calcSpectrumOffset(e);}
    });
    $(document).mouseup(function(e) {
        sqDrag = false;
        pDrag = false;
    });
});
