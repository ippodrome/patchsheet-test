const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const MAX_AGE_DAYS = 30; // ändra vid behov

// Körs varje natt kl 04:00 (Europe/Stockholm) — raderar patches äldre än MAX_AGE_DAYS
exports.cleanupOldPatches = onSchedule(
  {
    schedule: '0 4 * * *',
    timeZone: 'Europe/Stockholm',
    region: 'europe-west1',
  },
  async () => {
    const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const oldPatches = await db
      .collection('patches')
      .where('createdAt', '<', cutoff)
      .get();

    if (oldPatches.empty) {
      console.log('Inga gamla patches att radera.');
      return;
    }

    let deletedCount = 0;
    for (const patchDoc of oldPatches.docs) {
      // Radera alla subcollections: gamla 'marks', nya 'state' (som innehåller marks-dokumentet) + history
      const marksSnap = await patchDoc.ref.collection('marks').get();
      const stateSnap = await patchDoc.ref.collection('state').get();
      const historySnap = await patchDoc.ref.collection('history').get();

      const batch = db.batch();
      marksSnap.forEach(m => batch.delete(m.ref));
      stateSnap.forEach(s => batch.delete(s.ref));
      historySnap.forEach(h => batch.delete(h.ref));
      batch.delete(patchDoc.ref);
      await batch.commit();
      deletedCount++;
    }

    console.log(`Raderade ${deletedCount} patch(ar) äldre än ${MAX_AGE_DAYS} dagar.`);
  }
);

// Loggar nya innehållsrapporter tydligt i Cloud Functions-loggarna, så du
// ser dem i Firebase Console → Functions → Logs utan att behöva bläddra
// manuellt i Firestore-datan. Vill du ha mailutskick istället/också,
// koppla på t.ex. SendGrid eller Nodemailer här.
exports.onNewReport = onDocumentCreated(
  { document: 'reports/{reportId}', region: 'europe-west1' },
  (event) => {
    const data = event.data.data();
    console.warn(
      `⚑ NY RAPPORT — namn "${data.reportedName}" i patch ${data.patchId}, ` +
      `rapporterat av "${data.reportedBy}"`
    );
  }
);
