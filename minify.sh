#!/bin/sh
# Get yuicompressor from http://developer.yahoo.com/yui/compressor/
function get_size() {
    stat -f%z "$1"
}
target_files=(static/js/core.js static/js/colorpicker.js static/css/base.css)
minified=()

old_total=0
new_total=0

for f in ${target_files[@]}; do
    outfile="${f//\./.min.}"
    yuicompressor "$f" -o "$outfile"

    old_size=$(get_size "$f")
    new_size=$(get_size "$outfile")
    percent=$(($new_size*100/$old_size))

    echo "minified $percent% ${f} ($old_size) -> $outfile ($new_size)"

    old_total=$(($old_total+$old_size));
    new_total=$(($new_total+$new_size));
done

echo "Total: $((new_total*100/old_total))% ($old_total -> $new_total)"

