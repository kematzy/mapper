/**
 * Module dependencies.
 */

var helper = require('../test_helper.js')
  , _ = require('lodash')
  , str = require('underscore.string')
  , QueryBuilder = helper.QueryBuilder;

/**
 * Model stub.
 */

var model = {
  tableName:  'model_name',
  primaryKey: 'index',
  _fields: [
    { 'column_name': 'index' },
    { 'column_name': 'name' },
    { 'column_name': 'email' },
    { 'column_name': 'age' },
    { 'column_name': 'field' }
  ]
};

model._columns = _(model._fields).pluck('column_name');
model.escapedTableName = '`'+model.tableName+'`';

// whitespace doesn't matter to sql but it's esier to write unit test
// if spaces are normalized
var oldEqual = assert.equal;
assert.equal = function(actual, expected, message) {
  if (_.isString(actual)) {
    actual = str.clean(actual);
  }
  oldEqual.apply(assert, Array.prototype.slice.call(arguments));
}

var qb = new QueryBuilder({model: model});
var strictQb = new QueryBuilder({model: model, strict: true});

  // DELETE
describe("DELETE", function() {
  it('deletes all rows by default', function() {
    assert.equal(
      qb.delete().toSql(),
      "DELETE FROM `model_name` ;"
    );
  });

  it('throws an error in strict mode if WHERE clause is missing (use truncate)', function() {
    function test(){
      strictQb.delete().toSql();
    }
    assert.throws(test, Error);
  });

  it('deletes with a where clause', function() {
    assert.equal(
      qb.delete().where({name: 'foo'}).toSql(),
      "DELETE FROM `model_name` " +
      "WHERE name = 'foo' ;"
    );
  });

  it('allows multiple fields in WHERE clause', function() {
    assert.equal(
      qb.delete().where({
        'name': 'foo',
        'email': 'bar@bah.com'
      }).toSql(),

      "DELETE FROM `model_name` " +
      "WHERE name = 'foo' " +
      "AND email = 'bar@bah.com' ;"
    );
  });

  it('ignores invalid fields by default', function() {
    assert.equal(
      qb.delete().where({
        'name': 'foo',
        'email': 'bar@bah.com',
        'bad_field': 1000
      }).toSql(),

      "DELETE FROM `model_name` " +
      "WHERE name = 'foo' " +
      "AND email = 'bar@bah.com' ;"
    );
  });

  it('throws an error on invalid fields in strict mode', function() {
    assert.equal(
      qb.delete().where({
        'name': 'foo',
        'email': 'bar@bah.com',
        'bad_field': 1000
      }).toSql(),

      "DELETE FROM `model_name` " +
      "WHERE name = 'foo' " +
      "AND email = 'bar@bah.com' ;"
    );
  });

}); // # end DELETE


describe("INSERT", function() {
  it('basic with all valid fields', function() {
    var obj = { index: '1234', name: 'Joseph' };

    assert.equal(
      qb.insert(obj).toSql(),
      "INSERT INTO `model_name`(index, name) " +
      "VALUES ('1234', 'Joseph') ;"
    );
  });

  it('array of objects', function() {
    var obj = [{ index: '1234', name: 'Joseph' }, { index: '2222', name: 'Jane' }];

    assert.equal(
      qb.insert(obj).toSql(),
      "INSERT INTO `model_name`(index, name) " +
      "VALUES ('1234', 'Joseph'), ('2222', 'Jane') ;"
    );
  });

  it('ignores invalid fields by default', function() {
    var obj = { index: '1234', bad_field: 'Joseph' };

    assert.equal(
      qb.insert(obj).toSql(),
      "INSERT INTO `model_name`(index) " +
      "VALUES ('1234') ;"
    );
  });

  it('throws errors on invalid fields in strict mode', function() {
    var obj = { index: '1234', bad_field: 'Joseph' };

    function test() {
      strictQb.insert(obj).toSql();
    }
    assert.throws(test, Error);
  });

  it('inserts basic', function() {
    assert.equal(
      qb.insert("index, name", ['1234', 'Joseph']).toSql(),
      "INSERT INTO `model_name`(index, name) " +
      "VALUES ('1234','Joseph') ;"
    );
  });

  // it('insert statement: ignore invalid fields', function() {
  //   var obj = {
  //     bad_field: 'abcdef',
  //     email: 'bob@email.com',
  //     name: 'Bob',
  //     age: 8
  //   };

  //   assert.equal(
  //     Statements.insert(model, obj, []),
  //     "INSERT INTO `model_name`(email,name,age) " +
  //     "VALUES(?,?,?);"
  //   );
  // });

});

describe("SELECT", function() {

  it('single field', function() {
    assert.equal(
      qb.where("index = ?", ['2345']).toSql(),
      "SELECT * FROM `model_name` WHERE index = '2345' ;"
    );
  });


  it('multiple fields', function() {
    assert.equal(
      qb.where("name = ? AND index IN (?) AND name IS ?", ['foo', ['134', '678'], null]).toSql(),
      "SELECT * FROM `model_name` WHERE name = 'foo' AND index IN ('134','678') AND name IS NULL ;"
    );
  });


  it('object property', function() {
    assert.equal(
      qb.where({name: 'awesome sauce'}).toSql(),
      "SELECT * FROM `model_name` " +
      "WHERE name = 'awesome sauce' ;"
    );
  });


  it('multiple fields', function() {
    assert.equal(
      qb.where({ name: 'awesome sauce', email: 'joepancakes@email.com' })
        .toSql(),
      "SELECT * FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' ;"
    );
  });

  it('select fields', function() {
    assert.equal(
      qb.select("index, email")
        .where({
          'name': 'awesome sauce',
          'email': 'joepancakes@email.com'
        })
        .toSql(),

      "SELECT index, email FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' ;"
    );
  });

  it('select fields by array', function() {
    assert.equal(
      qb.select(["index", "email"])
        .where({
          'name': 'awesome sauce',
          'email': 'joepancakes@email.com'
        })
        .toSql(),

      "SELECT index,email FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' ;"
    );
  });


  it('limits', function() {
    assert.equal(
      qb.select('index, email')
        .where({
          'name': 'awesome sauce',
          'email': 'joepancakes@email.com'
        })
        .limit(25)
        .toSql(),

      "SELECT index, email FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' " +
      "LIMIT 25 ;"
    );
  });

  it('offsets', function() {
    assert.equal(
      qb.select('index, email')
        .where({
          'name': 'awesome sauce',
          'email': 'joepancakes@email.com'
        })
        .offset(25)
        .toSql(),

      "SELECT index, email FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' " +
      "OFFSET 25 ;"
    );
  });

  it('limits and offsets', function() {
    assert.equal(
      qb.select('index, email')
        .where({
          'name': 'awesome sauce',
          'email': 'joepancakes@email.com'
        })
        .limit(10)
        .offset(25)
        .toSql(),

      "SELECT index, email FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' " +
      "LIMIT 10 " +
      "OFFSET 25 ;"
    );
  });


  it('orders asc', function() {
    assert.equal(
      qb.select('index, email')
        .where({
          'name': 'awesome sauce',
          'email': 'joepancakes@email.com'
        })
        .limit(50)
        .orderBy('field')
        .toSql(),

      "SELECT index, email FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' " +
      "ORDER BY field " +
      "LIMIT 50 ;"
    );
  });

  it('orders, offsets and limits in any order', function() {
    assert.equal(
      qb.select('index, email')
        .limit(50)
        .offset(20)
        .where({
          'name': 'awesome sauce',
          'email': 'joepancakes@email.com'
        })
        .orderBy('field')
        .toSql(),

      "SELECT index, email FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' " +
      "ORDER BY field " +
      "LIMIT 50 " +
      "OFFSET 20 ;"
    );
  });

  it('multiple order fields', function() {
    assert.equal(
      qb.select('index, email')
        .where({
          'name': 'awesome sauce',
          'email': 'joepancakes@email.com'
        })
        .orderBy(['field DESC', 'field2'])
        .toSql(),

      "SELECT index, email FROM `model_name` " +
      "WHERE name = 'awesome sauce' " +
      "AND email = 'joepancakes@email.com' " +
      "ORDER BY field DESC,field2 ;"
   );
  });


  it('properties with operators', function() {
    assert.equal(
      qb.where({
          'name <>': 'awesome sauce',
          'name in': ['one', 'two'],
          'age not in': [1, 3],
          'age =': 1
        })
        .toSql(),

      "SELECT * FROM `model_name` " +
      "WHERE name <> 'awesome sauce' " +
      "AND name in ('one','two') " +
      "AND age not in (1,3) " +
      "AND age = 1 " +
      ";"
   );
  });


  it('ignores invalid fields by default', function() {
    assert.equal(
      qb.where({
          'name': 'foo',
          'bad_field': 'bar',
        })
        .toSql(),

      "SELECT * FROM `model_name` " +
      "WHERE name = 'foo' ;"
    );
  });


  it('throws an error on invalid fields in strict mode', function() {
    var qb = new QueryBuilder({model: model, strict: true})
      , test = function() {
          qb.where({ 'name': 'foo', 'bad_field': 'bar', }) .toSql();
        };
    assert.throws(test, Error);
  });


  it('returns a no return query on all invalid fields', function() {
    assert.equal(
      qb.where({bad_field: 0}).toSql(),
      "SELECT * FROM `model_name` WHERE 1=0 ;"
    );
  });


  it('column alias', function() {
    assert.equal(
      qb.select('index AS a').where("index = ?", ['2345']).toSql(),
      "SELECT index AS a FROM `model_name` " +
      "WHERE index = '2345' ;"
    )
  });

  it('query using null', function() {
    assert.equal(
      qb.where({'name': null}).toSql(),
      "SELECT * FROM `model_name` " +
      "WHERE name IS NULL ;"
    );
  });

  it('pages', function() {
    assert.equal(
      qb.page(2, 25).toSql(),
      "SELECT * FROM `model_name` " +
      "LIMIT 50, 25 ;"
    );
  });
}); // end describe


describe("TRUNCATE", function() {
  it("truncates", function() {
    assert.equal(qb.truncate().toSql(), "TRUNCATE `model_name` ;");
  });
});


describe("UPDATE", function() {
  it('updates with all valid fields', function() {
    var obj = { index: '1234', name: 'Joseph' };

    assert.equal(
      qb.set(obj).where({'age >': 15 }).toSql(),
      "UPDATE `model_name` " +
      "SET index = '1234', name = 'Joseph' " +
      "WHERE age > 15 ;"
    );
  }),

  it('ignores invalid fields by default', function() {
    var obj = {
      age: 8,
      bad_field: 'abcdef',
      name: 'Bob',
      email: 'bob@email.com'
    };

    assert.equal(
      qb.set(obj).where({name: 'joe'}).toSql(),
      "UPDATE `model_name` " +
      "SET age = 8, name = 'Bob', email = 'bob@email.com' " +
      "WHERE name = 'joe' ;"
    );
  });

  it('throws an error on invalid fields in strict mode', function() {
    var obj = {
      age: 8,
      bad_field: 'abcdef',
      name: 'Bob',
      email: 'bob@email.com'
    };

    function test() {
      strictQb.set(obj).where({name: 'joe'}).toSql();
    }
    assert.throws(test, Error);
  });

  it('updates all by default without a where clause', function() {
    var obj = {
      age: 8,
      bad_field: 'abcdef',
      name: 'Bob',
      email: 'bob@email.com'
    };

    assert.equal(
      qb.set(obj).toSql(),
      "UPDATE `model_name` " +
      "SET age = 8, name = 'Bob', email = 'bob@email.com' ;"
    );
  });

  it('throws an error if where clause is missing in strict mode', function() {
    var obj = {
      age: 8,
      name: 'Bob',
      email: 'bob@email.com'
    };

    function test() {
      strictQb.set(obj).toSql();
    }
    assert.throws(test, Error);
  });

}); // end UPDATE
