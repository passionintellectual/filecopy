var ps = require('ps-node');
var Rx = require('rxjs');

module.exports = function() {
	
	    let killed = new Rx.ReplaySubject(1);
		let found = false;

	// A simple pid lookup 
	ps.lookup({}, function(err, resultList ) {
		if (err) {
			throw new Error( err );
		}
		resultList.forEach(function( process ){
			if( process ){
				// console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );
				if(process.command.indexOf('Pluralsight.exe') > -1) {
					
					// kill process
					ps.kill( process.pid, function( err ) {
						if (err) {
							throw new Error( err );
						}
						else {
							console.log( 'Process %s has been killed!', process.command );
							killed.next(1);
							found = true;
						}
					});
					
				} 
			}
		});
		
		if(!found || !resultList || !resultList.length) {
			killed.next(1);
		}
	});
	return killed;

}