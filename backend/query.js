const { OutbreakAlert } = require('./models');
const { Op } = require('sequelize');
async function run() {
  const days = 7;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const data = await OutbreakAlert.findAll({
      where: {
        createdAt: { [Op.gte]: cutoff }
      },
      order: [['createdAt', 'DESC']]
  });
  console.log("ALERTS:", data.length);
  const stats = await OutbreakAlert.count({
      where: {
        createdAt: { [Op.gte]: cutoff },
        status: { [Op.in]: ['Active', 'Under Review'] }
      }
  });
  console.log("ACTIVE COUNT:", stats);
  process.exit(0);
}
run();
