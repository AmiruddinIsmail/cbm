const Db = require("mysql2-async").default;

const connection = new Db({

    host: process.env.HOST,
  
    user: process.env.DB_USER,
  
    password: process.env.PASSWORD,
  
    database: process.env.DATABASE,
  
    waitForConnections: true,
    multipleStatements: true
  
  
  });

module.exports = connection