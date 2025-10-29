// Auto-Fix DynamoDB Table Structure
require('dotenv').config();
const { DynamoDBClient, DeleteTableCommand, CreateTableCommand, DescribeTableCommand, waitUntilTableNotExists } = require('@aws-sdk/client-dynamodb');
const readline = require('readline');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'user_data';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteTable() {
  console.log(`\n🗑️  Deleting table "${TABLE_NAME}"...`);
  try {
    await client.send(new DeleteTableCommand({ TableName: TABLE_NAME }));
    console.log('✅ Delete request sent');
    
    // Wait for table to be deleted
    console.log('⏳ Waiting for table to be deleted...');
    let attempts = 0;
    while (attempts < 30) {
      try {
        await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        await sleep(2000);
        attempts++;
        process.stdout.write('.');
      } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('\n✅ Table deleted successfully!');
          return true;
        }
        throw error;
      }
    }
    console.log('\n⚠️  Timeout waiting for table deletion');
    return false;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('ℹ️  Table does not exist');
      return true;
    }
    console.error('❌ Error deleting table:', error.message);
    return false;
  }
}

async function createTable() {
  console.log(`\n📝 Creating table "${TABLE_NAME}" with correct structure...`);
  
  const params = {
    TableName: TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'SK', KeyType: 'RANGE' }  // Sort key
    ],
    BillingMode: 'PAY_PER_REQUEST'  // On-demand pricing
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log('✅ Create request sent');
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to become active...');
    let attempts = 0;
    while (attempts < 30) {
      try {
        const result = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
        if (result.Table.TableStatus === 'ACTIVE') {
          console.log('\n✅ Table created and active!');
          return true;
        }
        await sleep(2000);
        attempts++;
        process.stdout.write('.');
      } catch (error) {
        await sleep(2000);
        attempts++;
        process.stdout.write('.');
      }
    }
    console.log('\n⚠️  Timeout waiting for table to become active');
    return false;
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    return false;
  }
}

async function verifyTable() {
  console.log(`\n🔍 Verifying table structure...`);
  
  try {
    const result = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    const table = result.Table;
    
    const hasCorrectPK = table.KeySchema.some(k => k.AttributeName === 'PK' && k.KeyType === 'HASH');
    const hasCorrectSK = table.KeySchema.some(k => k.AttributeName === 'SK' && k.KeyType === 'RANGE');
    
    if (hasCorrectPK && hasCorrectSK) {
      console.log('\n✅ SUCCESS! Table structure is correct:');
      console.log('   ✓ Partition Key: PK (String)');
      console.log('   ✓ Sort Key: SK (String)');
      console.log('\n🎉 Your application is now ready to use!');
      console.log('\nNext steps:');
      console.log('   1. Start backend: npm start');
      console.log('   2. Register a new user');
      console.log('   3. Create notes - they will now save properly! ✨');
      return true;
    } else {
      console.log('❌ Table structure is still incorrect');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying table:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     DynamoDB Table Structure Auto-Fix Tool              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('This tool will:');
  console.log('  1. Delete the existing "user_data" table');
  console.log('  2. Create a new table with correct structure (PK, SK)');
  console.log('');
  console.log('⚠️  WARNING: Any existing data will be lost!');
  console.log('   (The current table structure is incompatible anyway)');
  console.log('');
  
  const answer = await question('Do you want to proceed? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('\n❌ Operation cancelled');
    console.log('\nTo fix manually, see: TABLE_FIX_INSTRUCTIONS.md');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n🚀 Starting table recreation process...');
  
  // Step 1: Delete old table
  const deleted = await deleteTable();
  if (!deleted) {
    console.log('\n❌ Failed to delete table');
    rl.close();
    process.exit(1);
  }
  
  // Step 2: Create new table
  const created = await createTable();
  if (!created) {
    console.log('\n❌ Failed to create table');
    rl.close();
    process.exit(1);
  }
  
  // Step 3: Verify
  const verified = await verifyTable();
  
  rl.close();
  process.exit(verified ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  rl.close();
  process.exit(1);
});
