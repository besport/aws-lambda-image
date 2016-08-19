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
            format:    image.type,
            customArgs: ['+repage', '-strip', '-interlace', 'plane',
                         '-auto-orient', '-background', 'white', '-flatten']
        };

        const acl = this.options.acl;

        return new Promise((resolve, reject) => {
            if ( "format" in this.options ) {
                params.format = this.options.format;
            }
            if ( "crop" in this.options ) {
                params.customArgs.push("-crop");
                params.customArgs.push(
                    String(this.options.crop.width) + "%x" +
                    String(this.options.crop.height) + "%+" +
                    (image.width * this.options.crop.x / 100).toFixed(2) + "+" +
                    (image.height * this.options.crop.y / 100).toFixed(2)
                );
            };
            var new_height = undefined;
            var new_width = undefined;
            if ( "size" in this.options ) {
                params.customArgs.push("-resize");
                if (image.width < image.height) {
                    new_width = this.options.size;
                    new_height = Math.round(image.height * this.options.size / image.width);
                }
                else {
                    new_width  = Math.round(image.width * this.options.size / image.height);
                    new_height = this.options.size;
                }
                params.customArgs.push(String(new_width) + "x" + String(new_height));
            }
            ImageMagick.resize(params, (err, stdout, stderr) => {
                if ( err || stderr ) {
                    reject("ImageMagick err" + (err || stderr));
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
