// Check DynamoDB Table Structure
require('dotenv').config();
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'user_data';

async function checkTableStructure() {
  console.log('🔍 Checking DynamoDB table structure...\n');
  
  try {
    const command = new DescribeTableCommand({ TableName: TABLE_NAME });
    const response = await client.send(command);
    
    const table = response.Table;
    
    console.log('📊 Table Information:');
    console.log(`   Name: ${table.TableName}`);
    console.log(`   Status: ${table.TableStatus}`);
    console.log(`   Item Count: ${table.ItemCount}`);
    console.log(`   Size: ${table.TableSizeBytes} bytes`);
    console.log('');
    
    console.log('🔑 Key Schema:');
    table.KeySchema.forEach(key => {
      const attr = table.AttributeDefinitions.find(a => a.AttributeName === key.AttributeName);
      console.log(`   ${key.KeyType === 'HASH' ? 'Partition Key' : 'Sort Key'}: ${key.AttributeName} (${attr.AttributeType})`);
    });
    console.log('');
    
    // Check if keys match our expectation
    const hasCorrectPK = table.KeySchema.some(k => k.AttributeName === 'PK' && k.KeyType === 'HASH');
    const hasCorrectSK = table.KeySchema.some(k => k.AttributeName === 'SK' && k.KeyType === 'RANGE');
    
    if (hasCorrectPK && hasCorrectSK) {
      console.log('✅ Table structure is CORRECT!');
      console.log('   - Partition Key: PK ✓');
      console.log('   - Sort Key: SK ✓');
    } else {
      console.log('❌ Table structure is INCORRECT!');
      console.log('');
      console.log('Expected structure:');
      console.log('   - Partition Key: PK (String)');
      console.log('   - Sort Key: SK (String)');
      console.log('');
      console.log('Current structure:');
      table.KeySchema.forEach(key => {
        console.log(`   - ${key.KeyType === 'HASH' ? 'Partition Key' : 'Sort Key'}: ${key.AttributeName}`);
      });
      console.log('');
      console.log('⚠️  ACTION REQUIRED:');
      console.log('   You need to recreate the table with the correct keys:');
      console.log('   1. Go to AWS DynamoDB Console');
      console.log('   2. Delete the "user_data" table');
      console.log('   3. Create a new table with:');
      console.log('      - Table name: user_data');
      console.log('      - Partition key: PK (String)');
      console.log('      - Sort key: SK (String)');
    }
    
    return { hasCorrectPK, hasCorrectSK };
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
    return { hasCorrectPK: false, hasCorrectSK: false };
  }
}

checkTableStructure()
  .then(result => {
    process.exit(result.hasCorrectPK && result.hasCorrectSK ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
