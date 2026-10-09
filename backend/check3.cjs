const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required');

const contentSchema = new mongoose.Schema({
  entityType: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true, index: true }
});
const ContentEntry = mongoose.model('ContentEntryTest', contentSchema, 'contententries');

async function run() {
  await mongoose.connect(uri);
  
  const raw = await mongoose.connection.collection('contententries').find({ entityType: 'subcategories' }).toArray();
  console.log('Raw count:', raw.length);
  
  const modelNoFilter = await ContentEntry.find({ entityType: 'subcategories' }).lean();
  console.log('Model no filter:', modelNoFilter.length);
  
  const modelFilter = await ContentEntry.find({ entityType: 'subcategories', status: 'published', isActive: true }).lean();
  console.log('Model filter:', modelFilter.length);
  
  process.exit(0);
}
run();
