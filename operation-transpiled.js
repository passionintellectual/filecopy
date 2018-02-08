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
src = 'C:\\Users\\nemad\\AppData\\Local\\Pluralsight\\courses';
var dbDest = 'C:\\Users\\nemad\\AppData\\Local\\Pluralsight\\pluralsight.db';
var dbEmptySrc = "pluralsight.db";
dest = 'D:\\Psvid2017';
var toCopyToDest = void 0;

var fs = require('fs');
var ncp = require('ncp').ncp;
var getSize = require('get-folder-size');
var Rx = require('rxjs');
var rimraf = require('rimraf');
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

var killPl = require('./killPl.js');
killPl().subscribe(function () {
	init();
});
function deleteFolder(location) {
	var deleted = new Rx.ReplaySubject(1);
	console.log('deleting file, ' + location);
	// rl.question("Do you want to really delete? [yes]/no: ", function(answer) {
	//   answer = answer ? answer.toLowerCase() : null;
	//  if (answer === 'y' || answer === 'yes') {
	rimraf(location, function () {
		deleted.next({
			location: location,
			deleted: true
		});
	});
	//}

	//});
	return deleted;
}

process.argv.forEach(function (val, index, array) {
	console.log(index + ': ' + val);
	if (index === 4) {
		toCopyToDest = !!val;
	}
	if (index === 2) {
		src = val;
	}
	if (index === 3) {
		dest = val;
	}
});

ncp.limit = 16;

function exists(file) {
	var exists = fs.existsSync(file);
	if (exists) {
		console.log('The file, ' + file + ' exists.');
	} else {
		console.log('The file does not ' + file + ' exist.');
	}
	return exists;
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

function copyFile(source, target, cb) {
	var cbCalled = false;

	var rd = fs.createReadStream(source);
	rd.on("error", function (err) {
		done(err);
	});
	var wr = fs.createWriteStream(target);
	wr.on("error", function (err) {
		done(err);
	});
	wr.on("close", function (ex) {
		done();
	});
	rd.pipe(wr);

	function done(err) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}
}
var observable = new Rx.ReplaySubject(1);
var obs = [];
var length = 0;
var processedCount = 0;
var executeOnFile = function executeOnFile(file) {

	var donePromise = new Rx.ReplaySubject();
	console.log('processing file', file);

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
				console.log('dest size is small', file);
				donePromise.next('noaction');
			} else {

				// delete from src
				deleteFolder(srcPath).subscribe(function (deleted) {

					console.log('deleted the file: ', deleted.location);

					donePromise.next('deleted');
				});
			}
		});
	} else {
		donePromise.next('noaction');
		if (toCopyToDest) {
			copyToDestination(srcPath, destPath);
		}
	}

	donePromise.subscribe(function (x) {
		console.log('stat', x);observable.next(++processedCount);
	});

	return donePromise;
};

function init() {

	fs.readdir(src, function (err, files) {

		if (err) {
			console.log('error', err);
		}
		console.log('files', files);

		length = files.length;

		files.forEach(function (file, index) {
			obs.push(executeOnFile(file));
		});
		if (!length) {
			observable.next(0);
		}

		// copyToDestination(dbEmptySrc, dbDest);
		// console.log('obs',obs);
		observable.subscribe(function (x) {

			console.log('sub x', x);
			console.log('processedCount is now', processedCount);
			if (processedCount === length) {
				console.log('ffff', x);
				done();
			}
		});;
	});

	// console.log('processedFiles', processedFiles);

	/* if(processedFiles && processedFiles.length) {
 	
 	Rx.Observable.concat(processedFiles)
    .subscribe((responses) => {
 		 done();
    });
 }else {
 	//done();
 }		
   */
	function copyDbFile(callback) {
		fs.readdir(src, function (err, files) {
			if (err) {
				console.log('error', err);
			}
			console.log('files', files);
			if (files.length == 0) {

				copyFile(dbEmptySrc, dbDest, function () {
					console.log('copied ' + dbEmptySrc + ' to ' + ' ' + dbDest);
					callback.call(null);
				});
			} else {
				callback.call(null);
			}
		});
	}

	function done() {
		console.log('Processed All files');
		copyDbFile(function () {
			console.info('finished');
		});
	}
}
