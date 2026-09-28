const fs = require('fs');
const path = require('path');

const models = [
  'BloodRequest',
  'Donor',
  'OutbreakAlert',
  'SchemeApplication',
  'IncentiveClaim',
  'MisinfoCheck',
  'AwarenessContent'
];

models.forEach(model => {
  const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
  const controllerContent = "const { " + model + " } = require('../models');\n\nexports.getAll = async (req, res) => {\n  try {\n    const data = await " + model + ".findAll();\n    res.json({ success: true, data });\n  } catch (error) {\n    res.status(500).json({ success: false, error: error.message });\n  }\n};\n\nexports.getById = async (req, res) => {\n  try {\n    const data = await " + model + ".findByPk(req.params.id);\n    if (!data) return res.status(404).json({ success: false, error: 'Not found' });\n    res.json({ success: true, data });\n  } catch (error) {\n    res.status(500).json({ success: false, error: error.message });\n  }\n};\n\nexports.create = async (req, res) => {\n  try {\n    const data = await " + model + ".create(req.body);\n    res.status(201).json({ success: true, data });\n  } catch (error) {\n    res.status(400).json({ success: false, error: error.message });\n  }\n};\n\nexports.update = async (req, res) => {\n  try {\n    const data = await " + model + ".findByPk(req.params.id);\n    if (!data) return res.status(404).json({ success: false, error: 'Not found' });\n    await data.update(req.body);\n    res.json({ success: true, data });\n  } catch (error) {\n    res.status(400).json({ success: false, error: error.message });\n  }\n};\n\nexports.delete = async (req, res) => {\n  try {\n    const data = await " + model + ".findByPk(req.params.id);\n    if (!data) return res.status(404).json({ success: false, error: 'Not found' });\n    await data.destroy();\n    res.json({ success: true, data: {} });\n  } catch (error) {\n    res.status(500).json({ success: false, error: error.message });\n  }\n};\n";

  fs.writeFileSync(path.join(__dirname, 'controllers', lowerModel + 'Controller.js'), controllerContent);
});

// Generate Routes for all 10 models (Patient and Consultation and HealthRecord as well)
const allModels = [
  'Patient',
  'HealthRecord',
  'Consultation',
  ...models
];

allModels.forEach(model => {
  const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
  // Only write routes if not already created (patientRoutes is already created)
  if (model === 'Patient') return;
  
  const routeContent = "const express = require('express');\nconst router = express.Router();\nconst " + lowerModel + "Controller = require('../controllers/" + lowerModel + "Controller');\n\nrouter.get('/', " + lowerModel + "Controller.getAll);\nrouter.get('/:id', " + lowerModel + "Controller.getById);\nrouter.post('/', " + lowerModel + "Controller.create);\nrouter.put('/:id', " + lowerModel + "Controller.update);\nrouter.delete('/:id', " + lowerModel + "Controller.delete);\n\nmodule.exports = router;\n";
  fs.writeFileSync(path.join(__dirname, 'routes', lowerModel + 'Routes.js'), routeContent);
});

console.log('CRUD controllers and routes generated successfully.');
