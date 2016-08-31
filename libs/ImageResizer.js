"use strict";

const ImageData   = require("./ImageData");
const ImageMagick = require("imagemagick");

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
            var srcWidth  = image.width;
            var srcHeight = image.height;
            if ( "crop" in this.options ) {
                srcWidth = Math.round(image.width * this.options.crop.width / 100);
                srcHeight = Math.round(image.height * this.options.crop.height / 100);
                params.customArgs.push("-crop");
                params.customArgs.push(
                    String(srcWidth) + "x" +
                    String(srcHeight) + "+" +
                    Math.round(image.width * this.options.crop.x / 100) + "+" +
                    Math.round(image.height * this.options.crop.y / 100)
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
