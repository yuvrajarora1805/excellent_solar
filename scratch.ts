import { jeVerificationDb } from './lib/db-helpers/discom';
async function test() {
  try {
    await jeVerificationDb.createOrUpdate({ discom_application_id: 1, status: 'APPROVED' });
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
}
test();
