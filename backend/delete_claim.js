const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'database.sqlite', logging: false });
(async () => {
  try {
    const [results, metadata] = await sequelize.query("DELETE FROM IncentiveClaims");
    console.log(`Deleted all test claims. Rows affected: ${metadata}`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
