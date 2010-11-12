// Original author: John Zila
// Modified by: Andrey Petrov

function ctx_xy_to_rgb(ctx, xy) {
    var img=ctx.getImageData(xy[0],xy[1],1,1);
    return [img.data[0], img.data[1], img.data[2]];
}


/* Canvas helpers */

//
// Accepts a "base" color and builds a square gradient with that color, black,
// and white.
//
var canvas_draw_gradient_square = function(ctx, rgb) {
    var w=ctx.canvas.width, h=ctx.canvas.height;

    var gradients = [
        ["#ffffff", "#ffffff"],
        [rgb_a_to_css(rgb, 0),rgb_a_to_css(rgb, 0xff)],
        [rgb_a_to_css([0,0,0], 1), rgb_a_to_css([0,0,0], 0)]
    ];
    var locs = [
        [0,0,w,0],
        [0,0,0,h],
        [0,0,w,0]
    ];
    for(var i=0; i<3; i++) {
        var gradient = ctx.createLinearGradient(locs[i][0], locs[i][1], locs[i][2], locs[i][3]);
        gradient.addColorStop(0, gradients[i][0]);
        gradient.addColorStop(1, gradients[i][1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }
}

//
// Draw a circle on the provided context with radius r, centered at (x,y), and
// styled with the color string represented by color.
//
var canvas_draw_circle = function(ctx, r, x, y, color) {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

var canvas_draw_filled_circle = function(ctx, r, x, y, color) {
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}


function clip(x, y, w, h) {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= w) x = w-1;
    if (y >= h) y = h-1;
    return [x, y];
}

/***/

function ColorPicker(target) {
    this.target = target;

    this.picker = $('<canvas class="picker" width="208px" height="208px"></canvas>');
    this.picker_canvas = this.picker[0].getContext("2d");
    this.picker_pos = [0, 0];

    this.spectrum = $('<canvas class="spectrum" width="208px" height="25px"></canvas>');
    this.spectrum_canvas = this.spectrum[0].getContext("2d");
    this.spectrum_pos = 0;

    this.container = $('<div class="color-picker"></div').append(this.picker).append(this.spectrum);

    $(target).after(this.container);

    this.draw();

    // Bind events

    var self = this;
    var drag_picker = false, drag_spectrum = false;

    // -> Click
    this.picker.click(
        function(e) { return self._picker_select_event(e); }
    ).mousedown(
        function(e) { drag_picker = true; }
    );

    this.spectrum.click(
        function(e) { return self._spectrum_select_event(e); }
    ).mousedown(
        function(e) { drag_spectrum = true; }
    );

    // -> Drag
    $(document).mousemove(
        function(e) {
            if (drag_picker) return self._picker_select_event(e);
            if (drag_spectrum) return self._spectrum_select_event(e);
        }
    ).mouseup(
        function(e) {
            drag_picker = false;
            drag_spectrum = false;
        }
    );
}
ColorPicker.prototype = {
    add_listener: function(name, fn) {
        this.container.bind(name, fn);
    },
    set_color: function(rgb) {
        var hsv = rgb_to_hsv(rgb);

        this.spectrum_pos = (hsv[0]/0xff);
        this.picker_pos = [(hsv[2]/0xff)*this.picker_canvas.canvas.width - 1, (hsv[1]/0xff)*this.picker_canvas.canvas.height - 1];

        this.draw();
    },
    get_color: function() {
        return ctx_xy_to_rgb(this.picker_canvas, this.picker_pos);
    },
    draw: function() {
        this._draw_spectrum();
        this._draw_picker();
    },

    // Draw helpers
    // TODO: Move these out to a ColorPickerRenderEngine object?

    _draw_spectrum: function() {
        var ctx = this.spectrum_canvas;

        var w = ctx.canvas.width, h = ctx.canvas.height, xw = Math.floor(this.spectrum_pos*w);
        var gradient = ctx.createLinearGradient(0, 0, w, 0), sw = 1.0/6;
        var colors = [
            "#FF0000",
            "#FFFF00",
            "#00FF00",
            "#00FFFF",
            "#0000FF",
            "#FF00FF"
        ];
        var locs=[0,sw,2*sw,3*sw,4*sw,5*sw,6*sw];

        for (var i=0; i<7; i++) {
            gradient.addColorStop(locs[i], colors[i%6]);
        }

        // TODO: Move this out to a helper?
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Draw the cursor line.
        ctx.beginPath();
        ctx.moveTo(xw,0);
        ctx.lineTo(xw,h);
        ctx.closePath();
        ctx.strokeStyle = rgb_to_css(invert_rgb(ctx_xy_to_rgb(ctx, [xw, 0])));
        ctx.lineWidth = 4;
        ctx.stroke();

    },
    _draw_picker: function() {
        // Draw 2d picker square gradient

        var ctx_picker = this.picker_canvas;
        var ctx_spectrum = this.spectrum_canvas;

        var xy = [parseInt(this.spectrum_pos*(ctx_spectrum.canvas.width-1)), 0];

        canvas_draw_gradient_square(ctx_picker, invert_rgb(ctx_xy_to_rgb(ctx_spectrum, xy)));

        // Pick color out of the gradient square

        var pos = this.picker_pos;
        var rgb = ctx_xy_to_rgb(ctx_picker, pos);

        // Trigger callbacks
        this.container.trigger('change', [rgb]);

        // Draw the circle
        canvas_draw_filled_circle(ctx_picker, 7, pos[0], pos[1], "#" + rgb_to_hex(rgb));
        canvas_draw_circle(ctx_picker, 7.5, pos[0], pos[1], "#000000");
        canvas_draw_circle(ctx_picker, 6, pos[0], pos[1], "#ffffff");
    },

    // Event handlers

    _spectrum_select_event: function(event) {
        event.stopPropagation();

        var ctx = this.spectrum_canvas;
        var w = ctx.canvas.width, h = ctx.canvas.height;

        var offset = this.spectrum.offset();
        var xy = clip(event.pageX-offset.left, event.pageY-offset.top, w, h);

        this.spectrum_pos = (xy[0])/w;
        this.draw();
    },
    _picker_select_event: function(event) {
        event.stopPropagation();

        var ctx = this.picker_canvas;
        var offset = this.picker.offset();

        this.picker_pos = clip(event.pageX-offset.left, event.pageY-offset.top, ctx.canvas.width, ctx.canvas.height);
        this.draw();
    }
}
