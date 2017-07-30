var Parse = require('parse/node');
var os = require('os');
var fs = require('fs');

function LerosService() {
    this.apikeys = JSON.parse(fs.readFileSync(os.homedir() + '/.bungalow/leros.key.json'));
    Parse.serverURL = 'https://parseapi.back4app.com/'
    Parse.initialize(this.apikeys.app_id);
    Parse.User.logIn('drsounds', '123');
}
var Aqtivity = Parse.Object.extend('Aqtivity');
var Facility = Parse.Object.extend('Facility');
var Sport = Parse.Object.extend('Sport');

function AqtivityObject(o) {
    this.name = o.get('name'),
    this.time = o.get('time'),
    this.facility = new FacilityObject(o.get('facility'));
    this.sport = new SportObject(o.get('sport'));
}


function FacilityObject(o) {
    this.name = o.get('name');
    this.id = o.get('id');
}


function SportObject(o) {
    this.name = o.get('name');
    this.id = o.get('id');
}


LerosService.prototype.getAqtivities = function () {
    return new Promise(function (resolve, reject) {
        var query = new Parse.Query(Aqtivity);
        query.descending('time').find({
          success: function(objects) {
            var aqtivities = objects.map(function (o) {
                return new AqtivityObject(o);
            });
            resolve({
                objects: aqtivities
            });
          },
          error: function(object, error) {
            // The object was not retrieved successfully.
            // error is a Parse.Error with an error code and message.
            reject(error);
          }
        });
    });
}

module.exports = LerosService;