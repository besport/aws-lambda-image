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

        if ( "size" in this.options ) {
            params.customArgs.push("-resize");
            params.customArgs.push(String(this.options.size) + "x" + String(this.options.size) + "^>");
        };

        return new Promise((resolve, reject) => {
            ImageMagick.resize(params, (err, stdout, stderr) => {
                if ( err || stderr ) {
                    reject("ImageMagick err" + (err || stderr));
                } else {
                    resolve(new ImageData(
                        image.fileName,
                        image.bucketName,
                        stdout,
                        image.headers,
                        acl
                    ));
                }
            });
        });
    }
}

module.exports = ImageResizer;
