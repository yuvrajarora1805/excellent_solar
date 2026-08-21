const { projectDb } = require('./lib/db-helpers/projects.js');
async function test() {
  try {
    await projectDb.updateStatus(3, 'INSTALLATION_STARTED', 1, 'Test');
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
