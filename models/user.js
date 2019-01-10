var DataStore = require('nedb');
var db = new DataStore('../data/users.db')
var connect = require('camo').connect;
var Document = require('camo').Document;


connect('nedb://memory').then(function(user){
    return Promise.all([Admin.save()]);
}).then(function(user){
    user.forEach(function(u){
        console.log('Saved User:' + u.name)
    })
})

class User extends Document {
    constructor() {
        super();

        this.username = String;
        this.password = String;
        this.role = String;
    }
}


var Admin =  User.create({
    name: 'Administrator',
    password: 'adminpassword',
    role: 'admin'
});