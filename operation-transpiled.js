'use strict';

var _ReplaySubject = require('rxjs/ReplaySubject');

// if src has file1, we need to check if dest has file1?
//  Yes: 
//      Check Size:
//          Smaller at src:
//              Delete from src
//          Same:
//              Delete from src
//          Smaller at dest:
//              Let it happen
// No: 
//      Do nothing


var src = void 0,
    dest = '';
src = './src';
dest = './dest';
var toCopyToDest = void 0;

var fs = require('fs');
var ncp = require('ncp').ncp;
var getSize = require('get-folder-size');
var Rx = require('rxjs');
var rimraf = require('rimraf');
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

function deleteFolder(location) {
    var deleted = new Rx.ReplaySubject(1);
    console.log('deleting file, ' + location);
    rl.question("Overwrite? [yes]/no: ", function (answer) {
        answer = answer ? answer.toLowerCase() : null;
        if (answer === 'y' || answer === 'yes') {
            rimraf(location, function () {
                deleted.next({
                    location: location,
                    deleted: true
                });
            });
        }
    });
    return deleted;
}

process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
    if (index === 2) {
        toCopyToDest = !!val;
    }
});

ncp.limit = 16;

function exists(file) {
    console.log('The file, ' + file + ' exists.');
    return fs.existsSync(file);
}

function getFolderSize(file) {
    var subject = new Rx.ReplaySubject(1);
    getSize(file, function (err, size) {
        if (err) {
            throw err;
        }

        console.log('file size of ' + file + ' is ' + size);
        // console.log((size / 1024 / 1024).toFixed(2) + ' Mb');
        subject.next(size);
    });
    return subject.asObservable();
}

function copyToDestination(s, d) {
    var options = {
        clobber: true
    };
    console.log('copying file name (' + s + ') to path (' + d + ')');
    ncp(s, d, options, function (err) {
        if (err) {
            return console.error(err);
        }
        console.log('done!');
    });
}

function getDestPath(file, dir) {
    if (file) {
        return dir + '/' + file;
    }
}

fs.readdir(src, function (err, files) {
    files.forEach(function (file) {
        var destPath = getDestPath(file, dest);
        var srcPath = getDestPath(file, src);
        if (exists(destPath)) {
            var sizeAtDest = getFolderSize(destPath);
            var sizeAtSrc = getFolderSize(srcPath);

            Rx.Observable.zip(sizeAtSrc, sizeAtDest).subscribe(function (x) {
                var destSize = x[1];
                var srcSize = x[0];
                if (destSize < srcSize) {
                    // Do nothing, getting downloading
                    if (toCopyToDest) {
                        copyToDestination(srcPath, destPath);
                    }
                } else {
                    // delete from src
                    deleteFolder(srcPath).subscribe(function (deleted) {
                        console.log('deleted the file: ', deleted.location);
                    });
                }
            });
        } else {
            // copyToDestination(`${src}/${file}`);
        }
    });
});
