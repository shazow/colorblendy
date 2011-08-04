#!/bin/bash
# build.sh - Compile and merge my JavaScript.

if [ ! -d ./build ]; then
    echo "build dir doesn't exist. aborting."
    exit 1;
fi

# Colorblendy-specific stuff
BUILD_PATH=./build/colorblendy
WORKING_PATH=./static

OUTPUT_JS=$BUILD_PATH/all.min.js
OUTPUT_CSS=$BUILD_PATH/all.min.css

echo "Setting up build environment: $BUILD_PATH"
rm -rf $BUILD_PATH
mkdir -p $BUILD_PATH
cp $WORKING_PATH/index.min.html $BUILD_PATH/index.html
cp $WORKING_PATH/*.{png,ico} $BUILD_PATH/


# JavaScript Closure stuff

echo "Compiling JavaScript..."

COMPILER_CMD="java -jar closure/compiler.jar"
OUTPUT_FLAG="--js_output_file $OUTPUT_JS"
#EXTRA_FLAGS="--compilation_level ADVANCED_OPTIMIZATIONS"

if [ ! -d closure ]; then
    echo "Closure compiler not found, downloading..."
    mkdir closure
    wget http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz -O- | tar -xzvf -
fi

function addprefix() {
    sep="$1"
    shift
    while (($#)); do
        echo -n "$sep $1 ";
        shift
    done
}

targets="$(addprefix --js $WORKING_PATH/js/*.js) $(addprefix --externs $WORKING_PATH/js/extern/*.js)"
$COMPILER_CMD $OUTPUT_FLAG $EXTRA_FLAGS $targets 2>> build.log


# CSS
echo "Compiling CSS..."
yuicompressor $WORKING_PATH/css/*.css -o "$OUTPUT_CSS"
