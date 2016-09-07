"use strict";

const ImageData   = require("./ImageData");
const ImageMagick = require("imagemagick");

function mimeType(format) {
    switch (format.toLowerCase()) {
        case "jpg": case "jpeg": return "image/jpeg";
        case "png": return "image/png";
    }
    return "image/" + format;
}

class ImageResizer {

    /**
     * Image Resizer
     * resize image with ImageMagick
     *
     * @constructor
     * @param Number width
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Execute resize
     *
     * @public
     * @param ImageData image
     * @return Promise
     */
    exec(image) {
        const params = {
            srcData:   image.data.toString("binary"),
            srcFormat: image.type,
            format:    image.type
        };

        const acl = this.options.acl;

        return new Promise((resolve, reject) => {
            if ( "index" in this.options ) {
                params.srcIndex = this.options.index;
            }
            if ( "format" in this.options ) {
                params.format = this.options.format;
            }
            image.headers.ContentType = mimeType(params.format)
            params.format
            switch ( params.format.toLowerCase() ){
                case "jpg":
                case "jpeg":
                    params.customArgs = ['+repage', '-strip', '-interlace', 'plane',
                                         '-auto-orient', '-background', 'white', '-flatten'];
                    break;
                case "png":
                    params.customArgs = ["-background" , "none" , "+repage" ,
                                         "-strip", "-interlace", "Plane", "-auto-orient"];
                    break;
            }
            params.customArgs.push("-quiet"); // surpress warnings
            var srcWidth  = image.width;
            var srcHeight = image.height;
            if ( "crop" in this.options ) {
                srcWidth = this.options.crop.width;
                srcHeight = this.options.crop.height;
                params.customArgs.push("-crop");
                params.customArgs.push(
                    String(this.options.crop.width) + "x" +
                    String(this.options.crop.height) + "+" +
                    String(this.options.crop.x) + "+" +
                    String(this.options.crop.y)
                );
            };
            var new_height = undefined;
            var new_width = undefined;
            if ( "size" in this.options ) {
                if (srcWidth < srcHeight) {
                    if (srcWidth > this.options.size && srcWidth * 5 < this.options.size * 6)
                    { new_width = srcWidth; }
                    else
                    { new_width = this.options.size; }
                    new_height = Math.round(srcHeight * new_width / srcWidth);
                }
                else {
                    if (srcHeight > this.options.size && srcHeight * 5 < this.options.size * 6)
                    { new_height = srcHeight; }
                    else
                    { new_height = this.options.size; }
                    new_width  = Math.round(srcWidth * new_height / srcHeight);
                }
            }
            if ( "size" in this.options ) {
                switch ( params.srcFormat ) {
                    case "jpg":
                    case "jpeg":
                        params.customArgs.push('-define');
                        params.customArgs.push('jpeg:size=' + String(2 * new_width) + "x" + String(2 * new_height));
                }
            }
            if ( "size" in this.options ) {
                params.customArgs.push("-resize");
                params.customArgs.push(String(new_width) + "x" + String(new_height));
            }
            ImageMagick.resize(params, (err, stdout, stderr) => {
                if ( err || stderr ) {
                    params.srcData = "<truncated>";
                    reject("ImageResizer (" + JSON.stringify(params) + "): "
                                            + JSON.stringify(err)
                                            + JSON.stringify(stderr));
                } else {
                    resolve(new ImageData(
                        image.fileName,
                        image.bucketName,
                        stdout,
                        image.headers,
                        acl,
                        params.format,
                        new_width,
                        new_height
                    ));
                }
            });
        });
    }
}

module.exports = ImageResizer;
