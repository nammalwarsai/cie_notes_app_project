// Test DynamoDB Connection
require('dotenv').config();
const { dynamoDb, TABLE_NAME, ScanCommand } = require('./config/dynamodb');

async function testConnection() {
  console.log('🔍 Testing DynamoDB Connection...');
  console.log('');
  console.log('Configuration:');
  console.log(`  Region: ${process.env.AWS_REGION}`);
  console.log(`  Table: ${process.env.DYNAMODB_TABLE_NAME}`);
  console.log(`  Access Key: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log('');

  try {
    // Try to scan the table (limit to 1 item to test connection)
    const params = {
      TableName: TABLE_NAME,
      Limit: 1
    };

    const result = await dynamoDb.send(new ScanCommand(params));
    
    console.log('✅ SUCCESS! Connected to DynamoDB');
    console.log(`📊 Table "${TABLE_NAME}" is accessible`);
    console.log(`📝 Items in table: ${result.Count || 0} (showing max 1 for test)`);
    console.log('');
    console.log('🎉 Your application is ready to use DynamoDB!');
    
    return true;
  } catch (error) {
    console.error('❌ ERROR: Failed to connect to DynamoDB');
    console.error('');
    console.error('Error details:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('  1. Check AWS credentials are correct in .env file');
    console.error('  2. Verify table "user_data" exists in AWS Console');
    console.error('  3. Ensure IAM user has DynamoDB permissions');
    console.error('  4. Confirm AWS region matches your table location');
    
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
