import {
    ReplaySubject
} from 'rxjs/ReplaySubject';

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



let src, dest = '';
src = 'C:\\Users\\nemad\\AppData\\Local\\Pluralsight\\courses';
dest = 'D:\\Psvid2017';
let toCopyToDest;

const fs = require('fs');
var ncp = require('ncp').ncp;
var getSize = require('get-folder-size');
var Rx = require('rxjs');
var rimraf = require('rimraf');
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);



function deleteFolder(location) {
    let deleted = new Rx.ReplaySubject(1);
    console.log(`deleting file, ${location}`);
   // rl.question("Do you want to really delete? [yes]/no: ", function(answer) {
     //   answer = answer ? answer.toLowerCase() : null;
      //  if (answer === 'y' || answer === 'yes') {
            rimraf(location, () => {
                deleted.next({
                    location: location,
                    deleted: true
                });
            });
        //}

    //});
    return deleted;
}

process.argv.forEach(function(val, index, array) {
    console.log(index + ': ' + val);
    if (index === 4) {
        toCopyToDest = !!val;
    }
	if(index === 2) {
		src = val;
	}
	if(index === 3) {
		dest = val;
	}
});

ncp.limit = 16;

function exists(file) {
    let exists =  fs.existsSync(file);
	if(exists) {
		    console.log(`The file, ${file} exists.`)
	} else {
				    console.log(`The file does not ${file} exist.`)

	}
	return exists;
}

function getFolderSize(file) {
    var subject = new Rx.ReplaySubject(1);
    getSize(file, function(err, size) {
        if (err) {
            throw err;
        }

        console.log(`file size of ${file} is ${size}`);
        // console.log((size / 1024 / 1024).toFixed(2) + ' Mb');
        subject.next(size);
    });
    return subject.asObservable();
}

function copyToDestination(s, d) {
    let options = {
        clobber: true
    };
    console.log(`copying file name (${s}) to path (${d})`);
    ncp(s, d, options, function(err) {
        if (err) {
            return console.error(err);
        }
        console.log('done!');
    });

}

function getDestPath(file, dir) {
    if (file) {
        return `${dir}/${file}`;
    }
}

fs.readdir(src, (err, files) => {
	if(err) {
		console.log('error', err);
	}
	console.log('files', files);
    files.forEach(file => {
        let destPath = getDestPath(file, dest);
        let srcPath = getDestPath(file, src);
        if (exists(destPath)) {
            let sizeAtDest = getFolderSize(destPath);
            let sizeAtSrc = getFolderSize(srcPath);

            Rx.Observable.zip(sizeAtSrc, sizeAtDest)
                .subscribe(x => {
                    let destSize = x[1];
                    let srcSize = x[0];
                    if (destSize < srcSize) {
                        // Do nothing, getting downloading
                        if (toCopyToDest) {
                            copyToDestination(srcPath, destPath);
                        }
                    } else {
                        // delete from src
                        deleteFolder(srcPath).subscribe((deleted) => {
                            console.log('deleted the file: ', deleted.location);
                        });
                    }
                });



        } else {
            if (toCopyToDest) {
                copyToDestination(srcPath, destPath);
            }
        }

    });
})