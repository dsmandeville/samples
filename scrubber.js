// recursive data scrubber written to clean JSON data returned from the Drupal 8 RabbitMQ module
// checks each node for a start- or enddate child and compares that date to the target date passed
// as a parameter to the request (defaults to now)



const moment = require( 'moment' );
const config = require('../config');

// check for data set
// pass to getTargetDate
module.exports.checkDataSet = function ( data, req ) {
	return getTargetDate ( data, req, function ( scrubbedData ) {
		return scrubbedData;
	} );
}

// set targetDate as now or the preview date if one exists
// pass to scrubData
function getTargetDate ( data, qdate, callback ) {
	// set default date to now
	var targetDate = moment();

	// if not production and date is appended, use the appended date
	if ( config.previewEnabled  && typeof req.query.date !== "undefined" ) {
		targetDate = moment( qdate, config.dates.format );
	}

	// pass everything on to the actual scrubber
	var dataset = scrubNode ( data, targetDate );

	// return to checkDataSet
	callback( dataset );
}

// walk through the return object checking for dates
function scrubNode( node, targetDate ) {
	let scrubReturn = {};

	// not an object? return node
	if ( node === null || typeof node  !== "object" ) {
		return node;
	} else {
		// if it is an object, check to see if the value is an array
		// if it is an array, scrub each array member
		// if it's not, check the the node
		// return an empty array for nodes that don't meet the date criteria
		for ( let prop in node ) {
			if ( node[ prop ] instanceof Array ) {
				scrubReturn[ prop ] = [];
				for ( let i = 0; i < node[ prop ].length; i++ ) {
					scrubReturn[prop].push(scrubNode( node[ prop ][i], targetDate ));
				}
			} else {
				if ( node.hasOwnProperty( config.dates.startdate ) || node.hasOwnProperty( config.dates.enddate ) ) {
					if ( checkDates( node[i], targetDate ) ) {
						scrubReturn[ prop ] = scrubNode( node[ prop ], targetDate );
					} else {
						scrubReturn[ prop ] = [];
					}
				} else {
					return node;
				}
			}
		}
	}
	return scrubReturn;
}

// subroutine that makes the actual date comparisons
function checkDates ( data, targetDate, callback ) {
	let dateOkay = true;

	// check start date
	if ( typeof data.startdate !== "undefined" ) {
		if (! ( moment( data.startdate, config.dates.format ).isSameOrAfter( targetDate ) ) ) {
			dateOkay = false;
		}
	}
	// check end date
	if ( typeof data.enddate !== "undefined" ) {
		if (! ( moment( data.enddate, config.dates.format ).isBefore( targetDate ) ) ) {
			dateOkay = false;
			// send unpublish request to Drupal API
			// still needs to be researched
			// create as a separate util
		}
	}

	// return to scrubData
	return dateOkay;
}