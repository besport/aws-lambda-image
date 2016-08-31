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
            // TODO: consider cropping in these calculations!
            var new_height = undefined;
            var new_width = undefined;
            if ( "size" in this.options ) {
                if (image.width < image.height) {
                    if (image.width > this.options.size && image.width * 5 < this.options.size * 6)
                    { new_width = image.width; }
                    else
                    { new_width = this.options.size; }
                    new_height = Math.round(image.height * new_width / image.width);
                }
                else {
                    if (image.height > this.options.size && image.height * 5 < this.options.size * 6)
                    { new_height = image.height; }
                    else
                    { new_height = this.options.size; }
                    new_width  = Math.round(image.width * new_height / image.height);
                }
            }
            switch ( params.format.toLowerCase() ){
                case "jpg":
                case "jpeg":
                    params.customArgs = ['+repage', '-strip', '-interlace', 'plane', '-define',
                                         'jpeg:size=' + String(2 * new_width) + "x" + String(2 * new_height),
                                         '-auto-orient', '-background', 'white', '-flatten'];
                    break;
                case "png":
                    params.customArgs = ["-background" , "none" , "+repage" ,
                                         "-strip", "-interlace", "Plane", "-auto-orient"];
                    break;
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
