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

var reset_pickers, p1, p2;

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

    p1 = new ColorPicker($("#color-bottom"));
    p2 = new ColorPicker($("#color-top"));

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

    reset_pickers = function() {
        var c1 = css_to_rgb($("#color-bottom-preview").css('background-color'));
        var c2 = css_to_rgb($("#color-top-preview").css('background-color'));
        p1.set_color(c1);
        p2.set_color(c2);
    }

    reset_pickers();
});
