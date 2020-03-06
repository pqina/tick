var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

module.exports = function (givenImagesPath) {
    function inlineSVG (file, enc, callback) {
        var imagesPath;

        if (!givenImagesPath) {
            imagesPath = path.dirname(file.path);
        } else {
            imagesPath = path.join(path.dirname(file.path), givenImagesPath);
            if (path.resolve(givenImagesPath) === path.normalize(givenImagesPath)) {
                imagesPath = givenImagesPath;
            }
        }

        // Do nothing if no contents
        if (file.isNull()) {
            this.push(file);
            return callback();
        }

        if (file.isStream()) {
            // accepting streams is optional
            this.emit('error', new gutil.PluginError('gulp-inline-svg', 'Stream content is not supported'));
            return callback();
        }

        function inline (inlineExpr, quotedPath) {
            
            var imagePath = quotedPath.replace(/['"]/g, '');

            try {
                var fileData = fs.readFileSync(path.join(imagesPath, imagePath));
            }
            catch (e) {
                gutil.log(gutil.colors.yellow('gulp-inline-svg'), 'Referenced file not found: ' + path.join(imagesPath, imagePath));
                return inlineExpr;
            }

            var fileData = new Buffer(fileData).toString();

            // replace double with single quotes
            fileData = fileData.replace(/"/g, "'");

            // replace <
            fileData = fileData.replace(/</g, "%3C");

            // replace >
            fileData = fileData.replace(/>/g, "%3E");

            // replace #
            fileData = fileData.replace(/#/g, "%23");

            var fileMime = mime.lookup(imagePath);

            return 'url("data:' + fileMime  + ';charset=utf-8,' + fileData + '")';
        }

        // check if file.contents is a `Buffer`
        if (file.isBuffer()) {

            var content = String(file.contents).replace(/url\(([^\)]+)\)/g, inline);
            file.contents = new Buffer(content);

            this.push(file);
        }

        return callback();
    }

    return through.obj(inlineSVG);
};