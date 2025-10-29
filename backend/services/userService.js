const { dynamoDb, TABLE_NAME, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } = require('../config/dynamodb');
const bcrypt = require('bcryptjs');

class UserService {
  // Create a new user
  async createUser(email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `USER#${Date.now()}`;
    
    const params = {
      TableName: TABLE_NAME,
      Item: {
        PK: userId,
        SK: 'PROFILE',
        entityType: 'USER',
        email: email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      ConditionExpression: 'attribute_not_exists(PK)'
    };

    try {
      await dynamoDb.send(new PutCommand(params));
      return {
        id: userId,
        email: email,
        createdAt: params.Item.createdAt
      };
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('User already exists');
      }
      throw error;
    }
  }

  // Find user by email
  async findUserByEmail(email) {
    console.log('🔍 UserService.findUserByEmail - Email:', email);
    
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'email = :email AND entityType = :type',
      ExpressionAttributeValues: {
        ':email': email,
        ':type': 'USER'
      }
    };

    try {
      const result = await dynamoDb.send(new ScanCommand(params));
      console.log('✅ Scan result - Items found:', result.Items ? result.Items.length : 0);
      
      if (result.Items && result.Items.length > 0) {
        console.log('👤 User found:', result.Items[0].PK);
        return result.Items[0];
      }
      console.log('❌ No user found with email:', email);
      return null;
    } catch (error) {
      console.error('❌ Error finding user:', error);
      console.error('Error details:', error.message);
      console.error('Error name:', error.name);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: userId,
        SK: 'PROFILE'
      }
    };

    try {
      const result = await dynamoDb.send(new GetCommand(params));
      return result.Item || null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Update user password
  async updatePassword(email, newPassword) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: user.PK,
        SK: 'PROFILE'
      },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedPassword,
        ':updatedAt': new Date().toISOString()
      }
    };

    try {
      await dynamoDb.send(new UpdateCommand(params));
      return { message: 'Password updated successfully' };
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = new UserService();
