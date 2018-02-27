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

var faker = require('faker');
var User = require('../model/user');

/**
 * /api/insert
 * type:Get
 * @param obj
 */
router.get('/insert', function(req, res, next) {
    var userData = generateModelData();
    User.insertMany(userData, function(error, docs) {
        res.json({
            status: 200,
            response: 'ok'
        });
    });
    //res.json(userData);
});

/**
 * /api/getdistinct
 * type:Post
 * @param obj
 */
router.post('/getdistinct', function(req, res, next) {
    queryBuilder(req.body.QueryCondition);
    // User.distinct('username', { tags: { $in: ['admin'] } }, function(err, resp) {
    //     if (!err && resp) {
    //         res.json({
    //             status: 400,
    //             data: resp
    //         });
    //     } else {
    //         res.json({
    //             status: 400,
    //             response: err
    //         });
    //     }
    // });
    //res.json(userData);
});

/**
 * /api/delete
 * type:Post
 * @param obj
 */
router.post('/delete', function(req, res, next) {
    User.count({ tags: { $in: ['user'] } }, function(err, count) {
        if (count > 0) {
            User.deleteMany({ tags: { $in: ['user'] } }, function(err) {
                if (!err) {
                    res.json({
                        status: 200,
                        response: 'ok'
                    });
                } else {
                    res.json({
                        status: 500,
                        response: 'not deleted'
                    });
                }
            })
        } else {
            res.json({
                status: 500,
                response: 'no item found to delete'
            });
        }
    });
});

function generateModelData() {
    var userData = [];
    for (let index = 0; index < 10; index++) {
        // var user = new User({
        var user = {
            _id: uuid(),
            name: faker.name.findName(),
            username: 'supto',
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
    return userData;
}


function queryBuilder(query) {
    var queryObject = {};
    query.forEach(element => {
        if (!element.multiple) {
            var t = objAccordingTooperator(element.condition, element.value);
            queryObject[element.field] = t;
        }
        if (element.multiple) {

        }
    });
}

function objAccordingTooperator(operator, value) {
    if (operator == 'in' || operator == 'nin') {
        value = value.split(',');
    }
    // var conditions = {
    //     'in': {
    //         $in: value
    //     },
    //     'gte': {
    //         $gte: value
    //     },
    //     'lt': {
    //         $lt: value
    //     }
    // } 
    switch (operator) {
        case 'in':
            return {
                $in: value
            }
            break;

        case 'gte':
            return {
                $gte: value
            }
        case 'lt':
            return {
                $lt: value
            }
        case 'and':
            return {
                $gte: value
            }
            break;

        default:
            break;
    }
    // return conditions[operator];
}

module.exports = router;