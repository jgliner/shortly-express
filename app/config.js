var path = require('path');
var knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../db/shortly.sqlite')
  }
});
var db = require('bookshelf')(knex);

db.knex.schema.hasTable('urls').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('urls', function (link) {
      link.increments('id').primary();
      link.string('url', 255);
      link.string('baseUrl', 255);
      link.string('code', 100);
      link.string('title', 255);
      link.integer('visits');
      link.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

db.knex.schema.hasTable('clicks').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('clicks', function (click) {
      click.increments('id').primary();
      click.integer('linkId');
      click.timestamps();
    }).then(function (table) {
      console.log('Created Table', table);
    });
  }
});

/************************************************************/
// Add additional schema definitions below
/************************************************************/

db.knex.schema.hasTable('users').then(function(exists) {
  if (!exists) {
    db.knex.schema.createTable('users', function(user) {
      user.increments('id').primary();
      user.string('username', 128);
      user.string('password', 128);
      user.string('salt', 128);
    }).then(function(table) {
      console.log('Created Table', table);
    });
  }
});

/************************************************************/
// DB methods
/************************************************************/

db.tableInsert = function(userObj) {
  db.knex.select().table('users').where('username',userObj.username)
  .then(function(rows) {
    if (rows.length > 0) {
      throw "Username taken";
    }
    else {
      return rows;
    }
  })
  .then(function(rows) {
    return knex.insert(userObj, 'id').into('users');
  })
  .then(function() {
    return db.knex.select().table('users');
  })
  .then(function(thing) {
    console.log(thing);
  })
  .catch(function(err) {
    console.error(err);
  });
};

db.tableRead = function(username, cb) {
  db.knex.select().from('users').where('username',username)
  .then(function(rows) {
    if (rows.length === 0) {
      throw "User doesn't exist, yo.";
    }
    else if (rows.length > 1) {
      throw "Uhh, we somehow have multiple users with that name. Not sure how that happened.";
    }
    else {
      cb(rows[0]);
    }
  });
};


module.exports = db;
