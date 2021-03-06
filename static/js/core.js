var reset_pickers, p1, p2, blend_mode, changing_picker = true, changed_picker = true, current_url = false;

function get_blend_mode() {
    if(!blend_mode) return 'multiply';
    return blend_mode.text().toLowerCase();
}
function write_url() {
    location.hash = "#!/" + get_blend_mode() + '/' + rgb_to_hex(p1.rgb) + '/' + rgb_to_hex(p2.rgb);
    current_url = location.hash;
}
function read_url() {
    var hash = location.hash;
    if(!hash || hash.substring(0,3) != '#!/') return;
    if(hash == current_url) return;
    current_url = hash;

    var parts = location.hash.substring(3).split('/');

    set_mode(parts[0]);
    p1.set_color(hex_to_rgb(parts[1]));
    p2.set_color(hex_to_rgb(parts[2]));

    render_blend();
}

function render_blend() {
    try {
        $("#color-bottom-preview").css('background-color', assure_hash_prefix($("#color-bottom").val()));
        $("#color-top-preview").css('background-color', assure_hash_prefix($("#color-top").val()));

        var c1 = css_to_rgb($("#color-bottom-preview").css('background-color'));
        var c2 = css_to_rgb($("#color-top-preview").css('background-color'));
        var blended = blend(get_blend_mode(), c1, c2);

        $("#color-blended-preview").css('background-color', rgb_to_css(blended));
        $("#color-blended").val("#" + rgb_to_hex(blended));

        $("h1:first a").css('color', rgb_to_css(invert_rgb(c1)));
    } catch(err) {
        alert("Unsupported color format.");
        throw err;
    }

    if(!changing_picker) write_url();
}

function set_mode(mode) {
    if(blend_mode) $(blend_mode).removeClass('active');
    blend_mode = $("#blend-mode #mode-" + mode).addClass('active');
    render_blend();
}

$(document).ready(function() {
    var r = $("form:first").submit(function() {
        render_blend(); reset_pickers();
        body.enableTextSelect();
        $('#color-blended').select(); 
        return false;
    });
    $("input[readonly!=readonly]", r).change(function() {
        render_blend(); reset_pickers();
    });

    blend_mode = $("#blend-mode li.active");

    $("#blend-mode li").click(function(e) {
        set_mode($(this).text().toLowerCase());
    });

    p1 = new ColorPicker($("#color-bottom"));
    p2 = new ColorPicker($("#color-top"));

    // Initialize picker interaction
    p1.preview = $("#color-bottom-preview");
    p2.preview = $("#color-top-preview");

    var body = $("body");

    var active_picker = false;

    $.map([p1, p2], function(o, i) {
        o.target.focus(function(e) {
            if(active_picker && active_picker != o) {
                active_picker.container.hide();
                active_picker = false;
                changed_picker = false;
            }
            o.container.show();
            active_picker = o;
        }).blur(function(e){
            if(!active_picker || changing_picker) return;
            active_picker.container.hide();
            active_picker = false;
            changed_picker = false;
        }).click(function(e) {
            e.stopPropagation();
        });

        o.add_listener('change', function(e, rgb) {
            e.stopPropagation();

            o.preview.css('background-color', rgb_to_css(rgb));
            o.target.val("#" + rgb_to_hex(rgb));
            render_blend();
        });

        o.add_listener('dragstart', function(e) { 
            console.log('dragstart');
            body.disableTextSelect(); changing_picker = true; changed_picker = true; });
        o.add_listener('dragstop', function (e) { body.enableTextSelect(); changing_picker = false; });
    });

    $(document).click(function(e) {
        if(!active_picker || changing_picker) return;
        active_picker.container.hide();
        active_picker = false;
        changed_picker = false;
    });

    reset_pickers = function() {
        var c1 = css_to_rgb($("#color-bottom-preview").css('background-color'));
        var c2 = css_to_rgb($("#color-top-preview").css('background-color'));
        p1.set_color(c1);
        p2.set_color(c2);
    }

    read_url();
    setInterval(read_url, 200);
    reset_pickers();

    changing_picker = false;
    changed_picker = false;

    $(document).keydown(function(e) {
        if(active_picker && changed_picker) {
            active_picker.target.blur();
        }
        if(e.which == 38 || e.which == 75) { // Down
            $(blend_mode).prev().click();
        } else if(e.which == 40 || e.which == 74) { // Up
            $(blend_mode).next().click();
        } else if (e.which == 9) { // Tab
            if($(e.target).attr("tabindex") == "3") {
                e.preventDefault();
                $("input[tabindex=1]").focus(); // Prevent escaping to the chrome
            }
        }
    });

});
