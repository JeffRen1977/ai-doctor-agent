# Chat History Structure

## Overview
The AI Doctor Agent now saves all chat history using Firebase Firestore with the `chatHistory` collection. Each document in this collection represents a user's complete chat history, with the document ID being the user's email address.

## Collection: `chatHistory`

### Document Structure
Each document in the `chatHistory` collection has the following structure:

```javascript
{
  userEmail: "user@example.com",        // User's email (also the document ID)
  messages: [                           // Array of chat messages
    {
      id: "msg-1234567890-abc123",      // Unique message ID
      content: "Hello, I have a headache", // Message content
      sender: "user",                   // "user" or "assistant"
      timestamp: Timestamp,             // When the message was sent
      createdAt: Timestamp              // When the message was created
    },
    {
      id: "msg-1234567891-def456",
      content: "I understand you have a headache...",
      sender: "assistant",
      timestamp: Timestamp,
      createdAt: Timestamp
    }
  ],
  createdAt: Timestamp,                 // When the chat history was first created
  updatedAt: Timestamp,                 // When the chat history was last updated
  totalMessages: 42                     // Total number of messages
}
```

### Document ID Convention
- **Document ID**: User's email address (e.g., "john.doe@example.com")
- **Benefits**: 
  - Easy to query by user email
  - No need for additional indexes
  - Natural partitioning by user

## API Endpoints

### 1. Send Message
```
POST /api/chat/send
```
- Saves both user message and AI response to `chatHistory` collection
- Creates new document if user doesn't exist
- Updates existing document with new messages

### 2. Get Chat History
```
GET /api/chat/history?limit=50
```
- Retrieves user's chat history from `chatHistory` collection
- Supports pagination with `limit` parameter
- Messages are sorted by timestamp (oldest first)

### 3. Clear Chat History
```
DELETE /api/chat/history
```
- Resets user's chat history to empty array
- Maintains document structure but clears messages

### 4. Get Chat Statistics
```
GET /api/chat/stats
```
- Returns user's chat statistics:
  - Total message count
  - User message count
  - AI message count
  - Last activity timestamp

### 5. Admin Functions

#### Get All Users' Chat History
```
GET /api/chat/admin/all-users
```
- Returns list of all users with chat history
- Includes message counts and last activity
- Sorted by last activity (most recent first)

#### Delete User's Chat History
```
DELETE /api/chat/admin/user/:email
```
- Deletes specific user's chat history
- Resets to empty state with deletion metadata

## Data Flow

1. **User sends message** → Saved to `chatHistory/{userEmail}` as user message
2. **AI generates response** → Saved to `chatHistory/{userEmail}` as assistant message
3. **Both messages** are stored in the same document under the `messages` array
4. **Document metadata** (updatedAt, totalMessages) is updated with each message

## Benefits of This Structure

### 1. **Efficient Queries**
- Direct access by user email (document ID)
- No need for complex queries or joins
- Fast retrieval of user's complete chat history

### 2. **Scalability**
- Each user's data is isolated in separate documents
- Natural partitioning prevents hot spots
- Easy to implement user-specific data retention policies

### 3. **Data Consistency**
- All messages for a user are stored together
- Atomic updates ensure data integrity
- Easy to implement backup and restore

### 4. **Analytics Ready**
- Built-in counters (totalMessages)
- Timestamp tracking for activity analysis
- Easy to implement usage analytics

## Security Considerations

### 1. **User Isolation**
- Users can only access their own chat history
- Document ID (email) ensures data separation
- Authentication middleware validates user access

### 2. **Admin Functions**
- Admin endpoints are protected by authentication
- Can be further restricted with role-based access control
- Audit trail for admin actions (deletion tracking)

## Migration from Previous Structure

If migrating from the previous `userChats` collection:

1. **Data Structure**: The new structure is compatible with existing data
2. **Collection Name**: Changed from `userChats` to `chatHistory`
3. **Document ID**: Now uses user email instead of auto-generated IDs
4. **Additional Fields**: New fields like `totalMessages` are added

## Example Usage

### Creating a New Chat Session
```javascript
// When user first sends a message
const chatHistoryDoc = {
  userEmail: "user@example.com",
  messages: [
    {
      id: "msg-1234567890-abc123",
      content: "Hello, I need help",
      sender: "user",
      timestamp: new Date(),
      createdAt: new Date()
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  totalMessages: 1
};
```

### Adding New Messages
```javascript
// When adding subsequent messages
const newMessage = {
  id: "msg-1234567891-def456",
  content: "AI response here",
  sender: "assistant",
  timestamp: new Date(),
  createdAt: new Date()
};

// Update document with new message
await updateDoc(chatHistoryDocRef, {
  messages: arrayUnion(newMessage),
  updatedAt: new Date(),
  totalMessages: increment(1)
});
```

## Monitoring and Maintenance

### 1. **Document Size Limits**
- Firestore documents have a 1MB size limit
- Monitor message count and content length
- Implement cleanup strategies for long conversations

### 2. **Performance Monitoring**
- Track document read/write operations
- Monitor query performance
- Implement caching strategies if needed

### 3. **Data Retention**
- Implement automatic cleanup for old messages
- Archive long conversations
- Maintain compliance with data retention policies
