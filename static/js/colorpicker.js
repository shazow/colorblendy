function p(m, x, y, r, g, b) {
    var i = (x + y * m.width) * 4;
    m.data[i+0] = r;
    m.data[i+1] = g;
    m.data[i+2] = b;
    m.data[i+3] = 0xff;
}

function sg(m, cr, cg, cb) {
    var i,j,r,g,b,s,f,x,y;
    s=m.width;
    f=256.0/s;

    for (i=0; i<s; i++) {
        for (j=0; j<s; j++) {
            var ij=i-j;
            r=parseInt(f*(ij+cr*j < 0 ? 0 : ij+cr*j));
            g=parseInt(f*(ij+cg*j < 0 ? 0 : ij+cg*j));
            b=parseInt(f*(ij+cb*j < 0 ? 0 : ij+cb*j));
            p(m, i, j, r, g, b);
        }
    }
}

function xc(c, x, w) {
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
    c[0]=n[0];
    c[1]=n[1];
    c[2]=n[2];
}

function pb(cxb,m,x) {
    var c=[0,0,0],f=256,w=m.width,h=m.height;
    for(i=0; i<w; i++) {
        xc(c, i, w);
        for (j=0; j<h; j++) {
            p(m, i, j, c[0]*f, c[1]*f, c[2]*f);
        }
    }
    cxb.putImageData(m,0,0);
    cxb.beginPath();
    cxb.moveTo(parseInt(x*w),0);
    cxb.lineTo(parseInt(x*w),h);
    cxb.closePath();
    cxb.strokeStyle = "#000000";
    cxb.lineWidth = 3;
    cxb.stroke();
}

function dot(cx,r,x,y,co) {
    cx.beginPath();
    cx.arc(x,y,r,0,Math.PI*2,true);
    cx.closePath();
    cx.strokeStyle = co;
    cx.lineWidth = 2;
    cx.stroke();
}

var img, c;

$(document).ready(function() {
    var e,s,loc=[0,0],col=0;

    e = $("#pickerbase").get(0);
    cxb = e.getContext("2d");

    w = parseInt(e.getAttribute("width"));
    h = parseInt(e.getAttribute("height"));

    m = cxb.createImageData(w, h);
    pb(cxb,m,col);
    cxb.putImageData(m, 0, 0);

    e = $("#pickersquare").get(0);
    cx = e.getContext("2d");

    s = parseInt(e.getAttribute("width"));

    img = cx.createImageData(s, s);

    var tfun = function(o) {
        var c=[];
        xc(c,o,1);
        sg(img,c[0],c[1],c[2]);
    }

    var rfun = function(e) {
        var i=(loc[0] + loc[1] * m.width) * 4;
        var r=img.data[i],
            g=img.data[i+1],
            b=img.data[i+2];
        $("#color").css("background-color","rgb("+r+","+g+","+b+")");
        cx.putImageData(img, 0, 0);
        dot(cx, 6, loc[0], loc[1], "#ffffff");
        dot(cx, 8, loc[0], loc[1], "#000000");
    };

    var trfun = function(e) {
        tfun(col); rfun();
    };

    var cfun = function(ev) {
        os=$("#pickersquare").offset();
        loc[0]=ev.pageX - os.left;
        loc[1]=ev.pageY - os.top;
        rfun();
    };

    var pc = function(ev) {
            os=$("#pickerbase").offset();
            col=(ev.pageX-os.left)/m.width;
            pb(cxb,m,col);
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
    $("#pickerbase").click(pc);
    $("#pickerbase").mousedown(function(e) {
        pDrag = true;
    });
    $("#pickerbase").mousemove(function(e) {
        if (pDrag) {pc(e);}
    });
    $(document).mouseup(function(e) {
        sqDrag = false;
        pDrag = false;
    });
});
