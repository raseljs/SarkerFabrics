require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required');
async function run() {
  await mongoose.connect(uri);
  const ContentEntry = mongoose.connection.collection('contententries');
  const subs = await ContentEntry.find({ entityType: 'subcategories' }).toArray();
  console.log('Subcategories found:', subs.length);
  process.exit(0);
}
run();
