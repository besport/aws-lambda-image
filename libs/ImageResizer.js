"use strict";

const ImageData   = require("./ImageData");
const ImageMagick = require("imagemagick");
const tmp = require('tmp');
const fs = require('fs');

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
        const tmpobj = tmp.fileSync();
        const params = {
            srcPath: tmpobj.name,
            srcFormat: image.type,
            format:    image.type
        };
        const options = this.options;
        const acl = options.acl;

        return new Promise((resolve, reject) => {
            fs.write(tmpobj.fd, image.data, 0, image.data.length, null,
                     (err) => {
                if (err) { reject("write: " + err); return; }
                if ( "index" in options ) {
                    params.srcIndex = options.index;
                }
                if ( "format" in options ) {
                    params.format = options.format;
                }
                image.headers.CacheControl = "max-age=604800";
                image.headers.ContentType = mimeType(params.format);
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
                if ( "crop" in options ) {
                    srcWidth = options.crop.width;
                    srcHeight = options.crop.height;
                    params.customArgs.push("-crop");
                    params.customArgs.push(
                        String(options.crop.width) + "x" +
                        String(options.crop.height) + "+" +
                        String(options.crop.x) + "+" +
                        String(options.crop.y)
                    );
                };
                var new_height = undefined;
                var new_width = undefined;
                if ( "size" in options ) {
                    if (srcWidth < srcHeight) {
                        if (srcWidth > options.size && srcWidth * 5 < options.size * 6)
                        { new_width = srcWidth; }
                        else
                        { new_width = Math.min(options.size, srcWidth); }
                        new_height = Math.round(srcHeight * new_width / srcWidth);
                    }
                    else {
                        if (srcHeight > options.size && srcHeight * 5 < options.size * 6)
                        { new_height = srcHeight; }
                        else
                        { new_height = Math.min(options.size, srcHeight); }
                        new_width  = Math.round(srcWidth * new_height / srcHeight);
                    }
                }
                if ( "size" in options ) {
                    switch ( params.srcFormat ) {
                        case "jpg":
                        case "jpeg":
                            params.customArgs.push('-define');
                            params.customArgs.push('jpeg:size=' + String(2 * new_width) + "x" + String(2 * new_height));
                    }
                }
                if ( "size" in options ) {
                    params.customArgs.push("-resize");
                    params.customArgs.push(String(new_width) + "x" + String(new_height));
                }
                ImageMagick.resize(params, (err, stdout, stderr) => {
                    tmpobj.removeCallback();
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
        });
    }
}

module.exports = ImageResizer;
