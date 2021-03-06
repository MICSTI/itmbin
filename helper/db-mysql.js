var mysql = require('mysql');
var bcrypt = require('bcrypt');

Connection = function () {
  this.connection = null;

  this.salt = "$2a$10$77bT6JnjLBhcGKoouwZCXe";
}

Connection.prototype.create = function () {
  if (this.connection == null) {
    this.connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root'
    });

    this.connection.connect();

    // use database
    this.connection.query("USE itmbin");
  }
}

Connection.prototype.close = function () {
  this.connection.end( function(err) {
    console.log(err);
  } )
}

Connection.prototype.getUsers = function (callback) {
  var sql = "SELECT * FROM users";

  this.connection.query(sql, function (err, rows) {
    if (err) {
      throw err;
    } else {
      callback(rows);
    }
  });
}

Connection.prototype.getUserByEmail = function (email) {
  var sql = "SELECT * FROM users WHERE email = ?";

  this.connection.query(sql, [email], function (err, rows) {
    if (err) {
      throw err;
    } else {
      console.log(rows);
    }
  });
}

Connection.prototype.registerUser = function (user, callback) {
  var regThis = this;

  bcrypt.hash(user[2], regThis.salt, function (err, hash) {
      // replace clear-text password with hash
      user[2] = hash;

      regThis.connection.query("INSERT INTO users (user_name, email, pw, auth_key) VALUES (?, ?, ?, ?)", user, function(err, results) {
        if (err) {
          console.log("Error: " + err.message);
          return;
        }

        console.log("Inserted " + results.affectedRows + " row.");
        console.log("Id inserted: " + results.insertId);

        callback();
      });
  });
}

Connection.prototype.confirmUser = function (user_data, callback_success, callback_failure) {
  this.connection.query("UPDATE users SET auth = 1 WHERE email = ? AND auth_key = ? AND auth = 0", user_data, function (err, results) {
    if (err) {
      console.log("Error: " + err.message);
      return;
    }

    if (results.affectedRows == 1) {
      console.log("Successfully confirmed user!");
      callback_success();
    } else {
      console.log("Could not confirm user!");
      callback_failure();
    }
  });
}

Connection.prototype.performLogin = function (login_data, callback_success, callback_failure) {
    perfThis = this;

    bcrypt.hash(login_data[2], perfThis.salt, function (err, hash) {
      // replace input password with hash
      login_data[2] = hash;

      perfThis.connection.query("SELECT id, user_name, email FROM users WHERE (user_name = ? OR email = ?) AND pw = ? AND auth = 1", login_data, function (err, results) {
        if (err) {
          console.log("Error: " + err.message);
          return;
        }

        if (results.length > 0) {
          console.log("Successfully logged in!");

          // return user object of the logged-in user
          callback_success(results[0]);
        } else {
          console.log("Could not log in!");
          callback_failure();
        }
      });
    });
}

Connection.prototype.init = function () {
  // create database if not exists
  this.connection.query("CREATE DATABASE IF NOT EXISTS itmbin");

  // use database
  this.connection.query("USE itmbin");

  // user table
  this.connection.query("DROP TABLE IF EXISTS users");

  this.connection.query("CREATE TABLE users ( id BIGINT AUTO_INCREMENT PRIMARY KEY, user_name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, pw VARCHAR(255) NOT NULL, auth INT(1) UNSIGNED DEFAULT '0', auth_key VARCHAR(255) )");
  this.connection.query("ALTER TABLE users ADD UNIQUE unique_email (email)")

  // Add test user with login: test and password: test123
  var initThis = this;
  bcrypt.hash("test123", this.salt, function (err, hash) {
    initThis.connection.query("INSERT INTO users (user_name, email, pw, auth, auth_key) VALUES ('test', 'michael@fh.at', '" + hash + "', '1', '')");
  });
}

module.exports.Connection = Connection
