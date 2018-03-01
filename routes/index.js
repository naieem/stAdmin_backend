/*
sample payload for distinct
{
	"distinctFieldName":"username",
	"QueryCondition":[
		{
			"multiple":false,
			"condition":"in",
			"field":"tags",
			"value":"admin,user"
		},{
			"multiple":true,
			"condition":"and",
			"fields":[ 
				{
					"condition":"gt",
					"field":"age",
					"value":"15"
				},
				{
					"condition":"lt",
					"field":"age",
					"value":"30"
				}
			]
		}
	]
}
*/

var uuid = require('uuid-v4');
var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var Duration = require('duration'); // package needed to calculate time taken by api call
var faker = require('faker');
var User = require('../model/user');

//----------------------- redis configuration block starts ------------------------//
var redis = require("redis"),
    subscriber = redis.createClient(), // subcriber client
    publisher = redis.createClient(); // publisher client

subscriber.on("message", function(channel, message) {
    console.log("Message '" + message + "' on channel '" + channel + "' arrived!")
});

subscriber.subscribe("test");

publisher.publish("test", "haaaaai");
publisher.publish("test", "kthxbai");


//----------------------- redis configuration block ends ------------------------//

/**
 * /api/insert
 * type:Post
 * @param obj
 */
router.post('/insert', function(req, res, next) {

    console.log('------------------------------------');
    console.log('insert request recieved');
    console.log('------------------------------------');
    var startTime = new Date();
    var userData = generateModelData();
    User.insertMany(userData, function(error, docs) {
        if (!error) {
            var endTime = new Date();
            var duration = new Duration(startTime, endTime);

            console.log('------------------------------------');
            console.log('Time taken to insert 100000 data in mlab ' + duration.seconds + ' seconds');
            console.log('------------------------------------');

            res.json({
                status: 200,
                response: 'ok'
            });
        } else {
            var endTime = new Date();
            var duration = new Duration(startTime, endTime);

            console.log('------------------------------------');
            console.log('Duration with error of 100000 data in mlab took ' + duration.seconds + ' seconds');
            console.log('------------------------------------');
            console.log(error);
            debugger;
            res.json({
                status: 500,
                response: error
            });
        }
    });
    //res.json(userData);
});

/**
 * /api/getdistinct
 * type:Post
 * @param obj
 */
router.post('/getdistinct', function(req, res, next) {
    var query = queryBuilder(req.body.QueryCondition);
    User.distinct('username', query, function(err, resp) {
        if (!err && resp) {
            res.json({
                totalResultCount: resp.length,
                status: 200,
                data: resp
            });
        } else {

            res.json({
                status: 500,
                response: err
            });
        }
    });
    //res.json(userData);
});


/**
 * /api/getbyquery
 * type:Post
 * @param obj
 */
router.post('/getbyquery', function(req, res, next) {
    var startTime = new Date();
    var query = queryBuilder(req.body.QueryCondition);
    User.find(query, function(err, resp) {
        if (!err && resp) {
            var endTime = new Date();
            var duration = new Duration(startTime, endTime);

            res.json({
                timeTaken: duration.seconds,
                totalResultCount: resp.length,
                status: 200,
                data: resp
            });
        } else {

            res.json({
                status: 500,
                response: err
            });
        }
    });
    //res.json(userData);
});


/**
 * /api/delete
 * type:Post
 * @param obj
 */
router.post('/delete', function(req, res, next) {

    console.log('------------------------------------');
    console.log('delete request recieved');
    console.log('------------------------------------');
    User.count({ tags: { $in: ['admin'] } }, function(err, count) {
        if (count > 0) {
            User.deleteMany({ tags: { $in: ['admin'] } }, function(err) {
                if (!err) {
                    console.log('------------------------------------');
                    console.log('delete request completes');
                    console.log(count + ' items deleted');
                    console.log('------------------------------------');
                    res.json({
                        status: 200,
                        response: 'ok'
                    });
                } else {
                    console.log('------------------------------------');
                    console.log('delete request fails');
                    console.log('------------------------------------');
                    res.json({
                        status: 500,
                        response: err
                    });
                }
            })
        } else {
            console.log('------------------------------------');
            console.log('no item found to delete');
            console.log('------------------------------------');
            res.json({
                status: 500,
                response: 'no item found to delete'
            });
        }
    });
});


/**
 * Generating dummy data for inserting in the db 
 * @params {params} 
 * @returns {returns}
 */
function generateModelData() {
    var totalNumber = 100000;

    console.log('------------------------------------');
    console.log('generating ' + totalNumber + ' data started');
    console.log('------------------------------------');
    var startTime = new Date();
    var userData = [];
    for (let index = 0; index < totalNumber; index++) {
        var user = {
            _id: uuid(),
            name: faker.name.findName(),
            username: faker.name.findName(),
            password: faker.internet.password(),
            admin: false,
            location: faker.address.state() + ', ' + faker.address.city() + ', ' + faker.address.country(),
            meta: {
                age: faker.random.number(100),
                website: faker.internet.url()
            },
            tags: ['admin'],
            created_at: new Date(),
            updated_at: new Date()
        };
        userData.push(user);
    }
    var endTime = new Date();
    var duration = new Duration(startTime, endTime);

    console.log('------------------------------------');
    console.log('Time taken to generate 100000 data for inserting ' + duration.seconds + ' seconds');
    console.log('------------------------------------');
    return userData;
}

/**
 * Parent query builder function which 
 * takes all responsibility to make a query 
 * @params {params} 
 * @returns {returns}
 */
function queryBuilder(query) {
    var queryObject = {};
    var logicalOperators = {
        'and': '$and',
        'or': '$or'
    }
    var startTime = new Date();
    query.forEach(element => {
        if (!element.multiple) {
            var queryVal = singleOperatorQuery(element.condition, element.value);
            queryObject[element.field] = queryVal;
        }
        if (element.multiple) {
            queryObject[logicalOperators[element.condition]] = multipleOperatorQuery(element.condition, element.fields);

        }
    });
    var endTime = new Date();
    var duration = new Duration(startTime, endTime);

    console.log('------------------------------------');
    console.log('Time taken to build query ' + duration.seconds + ' seconds');
    console.log('------------------------------------');
    return queryObject;
}

/**
 * Query builder for single block query 
 * @params {params} 
 * @returns {query object}
 */
function singleOperatorQuery(condition, value) {
    if (condition == 'in' || condition == 'nin') {
        value = value.split(',');
    }
    switch (condition) {
        case 'in':
            return {
                $in: value
            }
            break;
        case 'nin':
            return {
                $in: value
            }
            break;

        case 'gte':
            return {
                $gte: value
            }
        case 'gt':
            return {
                $gt: value
            }
        case 'lt':
            return {
                $lt: value
            }
        case 'lte':
            return {
                $lte: value
            }
        case 'and':
            return {
                $gte: value
            }
            break;
        case 'eq':
            return {
                $eq: value
            }
            break;
        case 'ne':
            return {
                $ne: value
            }
            break;

        default:
            break;
    }
    // return conditions[operator];
}

/**
 * Making query for multiple true obejcts 
 * @params {params} 
 * @returns {returns}
 */
function multipleOperatorQuery(condition, value) {
    var resultarray = [];
    switch (condition) {
        case 'and':
            value.forEach(element => {
                var conditionObject = {};
                conditionObject[element.field] = singleOperatorQuery(element.condition, element.value);
                resultarray.push(conditionObject);
            });
            return resultarray;
            break;

        case 'or':
            return {
                $gte: value
            }
    }
}

module.exports = router;