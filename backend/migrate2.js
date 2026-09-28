const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS IncentiveClaims;", (err) => {
    if (err) console.error(err);
    else console.log("Dropped IncentiveClaims");
  });
});
db.close();
