
var downloadFrequency = 1000;

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var request = require('request');

var US_FLIGHTS_URL = 'http://data.flightradar24.com/zones/fcgi/feed.js?bounds=56.13271372224092,4.772810565471144,-130.2324952148433,-62.841796875';

var DB;
function connectToDB(cb) {
  // Connection URL
  var url = 'mongodb://localhost:27017/eagleeye';
  // Use connect method to connect to the Server
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");

    DB = db;
    DB.flights.createIndex({date: -1});
    cb();
  });
}

function getData() {
  var flights = DB.collection('flights');
  request(US_FLIGHTS_URL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(body);
      delete json.full_count;
      delete json.version;
      // Add all records to mongod
      var d = +new Date;
      var records = [];
      for (var i in json)  {
        records.push({
          data: json[i],
          date: d
        });
      }
      flights.insertMany(records, function(err, res) {
        console.log(err);
        console.log(res);
      });
    }
  });
}

function startCRON() {
  connectToDB(function() {
    setInterval(getData, downloadFrequency);
  });
}

module.exports.startCRON = startCRON;