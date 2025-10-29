const { dynamoDb, TABLE_NAME, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('../config/dynamodb');

class NotesService {
  // Create a new note
  async createNote(userId, noteData) {
    const noteId = `NOTE#${Date.now()}`;
    
    console.log('✍️ NotesService.createNote - UserId:', userId, 'NoteId:', noteId);
    
    const params = {
      TableName: TABLE_NAME,
      Item: {
        PK: userId,
        SK: noteId,
        entityType: 'NOTE',
        noteId: noteId,
        title: noteData.title,
        content: noteData.content,
        category: noteData.category || 'General',
        priority: noteData.priority || 'Medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    try {
      await dynamoDb.send(new PutCommand(params));
      console.log('✅ Note created successfully in DynamoDB');
      return params.Item;
    } catch (error) {
      console.error('❌ Error creating note:', error);
      console.error('Error details:', error.message);
      console.error('Error name:', error.name);
      throw error;
    }
  }

  // Get all notes for a user
  async getUserNotes(userId) {
    console.log('🔍 NotesService.getUserNotes - UserId:', userId);
    
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': userId,
        ':sk': 'NOTE#'
      }
    };

    try {
      const result = await dynamoDb.send(new QueryCommand(params));
      console.log('✅ Query result - Items count:', result.Items ? result.Items.length : 0);
      return result.Items || [];
    } catch (error) {
      console.error('❌ Error getting user notes:', error);
      console.error('Error details:', error.message);
      console.error('Error name:', error.name);
      throw error;
    }
  }

  // Get a single note
  async getNote(userId, noteId) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: userId,
        SK: noteId
      }
    };

    try {
      const result = await dynamoDb.send(new GetCommand(params));
      return result.Item || null;
    } catch (error) {
      console.error('Error getting note:', error);
      throw error;
    }
  }

  // Update a note
  async updateNote(userId, noteId, noteData) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: userId,
        SK: noteId
      },
      UpdateExpression: 'SET title = :title, content = :content, category = :category, priority = :priority, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':title': noteData.title,
        ':content': noteData.content,
        ':category': noteData.category || 'General',
        ':priority': noteData.priority || 'Medium',
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamoDb.send(new UpdateCommand(params));
      return result.Attributes;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  // Delete a note
  async deleteNote(userId, noteId) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: userId,
        SK: noteId
      }
    };

    try {
      await dynamoDb.send(new DeleteCommand(params));
      return { message: 'Note deleted successfully' };
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // Get statistics for user notes
  async getUserStats(userId) {
    const notes = await this.getUserNotes(userId);
    
    const stats = {
      totalNotes: notes.length,
      highPriority: notes.filter(n => n.priority === 'High').length,
      categories: [...new Set(notes.map(n => n.category))].length,
      byCategory: {},
      byPriority: {
        High: notes.filter(n => n.priority === 'High').length,
        Medium: notes.filter(n => n.priority === 'Medium').length,
        Low: notes.filter(n => n.priority === 'Low').length
      }
    };

    // Count notes by category
    notes.forEach(note => {
      stats.byCategory[note.category] = (stats.byCategory[note.category] || 0) + 1;
    });

    return stats;
  }
}

module.exports = new NotesService();
