# Diet Analysis Structure

## Overview
The AI Doctor Agent now provides advanced diet analysis using Gemini AI for image recognition and nutritional analysis. All diet analysis results are stored in Firebase Firestore using the `userDietAnalysis` collection, with each document ID being the user's email address.

## Collection: `userDietAnalysis`

### Document Structure
Each document in the `userDietAnalysis` collection has the following structure:

```javascript
{
  userEmail: "user@example.com",        // User's email (also the document ID)
  analyses: [                           // Array of diet analysis records
    {
      id: "analysis-1234567890-abc123", // Unique analysis ID
      imagePath: "image-1234567890.jpg", // Stored image filename
      originalFilename: "food.jpg",      // Original uploaded filename
      imageSize: 1024000,               // Image size in bytes
      aiAnalysis: "AI分析结果...",        // Gemini AI analysis text
      recognizedFoods: [],              // Array of recognized foods
      analysisType: "image_analysis",   // Type of analysis
      userEmail: "user@example.com",    // User email
      analysisTimestamp: Timestamp,     // When analysis was performed
      timestamp: Timestamp,             // When record was created
      createdAt: Timestamp              // When record was created
    }
  ],
  createdAt: Timestamp,                 // When the diet analysis history was first created
  updatedAt: Timestamp,                 // When the diet analysis history was last updated
  totalAnalyses: 42                     // Total number of analyses
}
```

### Document ID Convention
- **Document ID**: User's email address (e.g., "john.doe@example.com")
- **Benefits**: 
  - Easy to query by user email
  - No need for additional indexes
  - Natural partitioning by user

## API Endpoints

### 1. Analyze Food Image
```
POST /api/diet-analysis/analyze
```
- **Authentication**: Required (JWT token)
- **Input**: Multipart form with image file
- **Process**:
  1. Uploads food image
  2. Uses Gemini AI for image analysis
  3. Provides nutritional analysis and health recommendations
  4. Saves results to `userDietAnalysis` collection
  5. Cleans up temporary image files
- **Response**: Analysis results with AI insights

### 2. Get Diet Analysis History
```
GET /api/diet-analysis/history?limit=20
```
- **Authentication**: Required (JWT token)
- **Parameters**: `limit` (optional, default: 20)
- **Returns**: User's diet analysis history from `userDietAnalysis` collection
- **Features**: Pagination support, sorted by timestamp (newest first)

### 3. Get Diet Analysis Statistics
```
GET /api/diet-analysis/stats
```
- **Authentication**: Required (JWT token)
- **Returns**: User's diet analysis statistics:
  - Total analysis count
  - Last analysis timestamp
  - Creation and update timestamps

### 4. Clear Diet Analysis History
```
DELETE /api/diet-analysis/history
```
- **Authentication**: Required (JWT token)
- **Action**: Resets user's diet analysis history to empty array
- **Maintains**: Document structure but clears analyses

### 5. Get Food Database
```
GET /api/diet-analysis/foods
```
- **Authentication**: Not required
- **Returns**: Static food database with nutritional information
- **Data**: Calories, carbs, protein, fat, fiber, glycemic index

### 6. Get Personalized Recommendations
```
GET /api/diet-analysis/recommendations
```
- **Authentication**: Required (JWT token)
- **Process**: Uses Gemini AI to generate personalized diet recommendations
- **Returns**: AI-generated health and nutrition advice

## Gemini AI Integration

### Image Analysis Process
1. **Image Upload**: User uploads food image (JPEG, PNG, etc.)
2. **Image Processing**: Convert to base64 for Gemini AI
3. **AI Analysis**: Gemini AI analyzes image with specialized prompt
4. **Result Processing**: Parse and structure AI response
5. **Storage**: Save complete analysis to Firebase

### AI Prompt Structure
The Gemini AI receives a comprehensive prompt that requests:
- **Food Identification**: Name, ingredients, cooking method
- **Nutritional Analysis**: Calories, macros, fiber, glycemic index
- **Health Assessment**: Diabetes impact, nutritional value, risks
- **Improvement Suggestions**: Healthier alternatives, portion advice

### AI Response Format
```javascript
{
  success: true,
  analysis: "详细的AI分析结果...",
  recognizedFoods: [] // 可扩展为结构化食物数据
}
```

## Data Flow

1. **User uploads image** → Image saved temporarily
2. **Gemini AI analyzes** → Provides comprehensive nutrition analysis
3. **Results processed** → Structured data with AI insights
4. **Saved to Firebase** → Stored in `userDietAnalysis/{userEmail}`
5. **Temporary cleanup** → Image files removed after processing

## Benefits of This Structure

### 1. **AI-Powered Analysis**
- Advanced image recognition using Gemini AI
- Comprehensive nutritional analysis
- Personalized health recommendations
- Professional nutritionist-level insights

### 2. **Efficient Storage**
- User-specific data isolation
- Structured analysis records
- Easy retrieval and history tracking
- Scalable document structure

### 3. **User Experience**
- Real-time image analysis
- Detailed health insights
- Historical analysis tracking
- Personalized recommendations

### 4. **Data Analytics**
- Built-in counters (totalAnalyses)
- Timestamp tracking for trends
- User behavior analysis
- Health pattern recognition

## Security and Privacy

### 1. **User Isolation**
- Users can only access their own diet analysis
- Document ID (email) ensures data separation
- Authentication middleware validates access

### 2. **Image Handling**
- Temporary file storage only
- Automatic cleanup after processing
- No permanent image storage
- Secure file upload validation

### 3. **Data Protection**
- JWT authentication required
- User email-based access control
- Secure Firebase rules
- No cross-user data access

## Error Handling

### 1. **Upload Errors**
- File type validation
- Size limit enforcement
- Network error handling
- Graceful failure responses

### 2. **AI Analysis Errors**
- Gemini AI service fallbacks
- Timeout handling
- Partial result processing
- User-friendly error messages

### 3. **Storage Errors**
- Firebase connection issues
- Permission denied handling
- Data corruption prevention
- Automatic retry mechanisms

## Performance Considerations

### 1. **Image Processing**
- File size limits (10MB)
- Supported formats (JPEG, PNG, etc.)
- Compression optimization
- Quick cleanup

### 2. **AI Response Time**
- Gemini AI model optimization
- Prompt engineering for speed
- Caching strategies
- Async processing

### 3. **Database Operations**
- Efficient document queries
- Index optimization
- Pagination support
- Background processing

## Example Usage

### Upload and Analyze Food Image
```javascript
// Frontend form submission
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/diet-analysis/analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
// result.data contains AI analysis and recommendations
```

### Get Analysis History
```javascript
const response = await fetch('/api/diet-analysis/history?limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const history = await response.json();
// history.data.analyses contains user's analysis history
```

## Future Enhancements

### 1. **Advanced Food Recognition**
- Structured food data extraction
- Nutritional database integration
- Portion size estimation
- Allergen detection

### 2. **Health Tracking**
- Trend analysis over time
- Goal setting and tracking
- Progress visualization
- Health score calculation

### 3. **Integration Features**
- Wearable device integration
- Meal planning suggestions
- Shopping list generation
- Restaurant menu analysis

### 4. **AI Improvements**
- Multi-language support
- Cultural food recognition
- Seasonal recommendations
- Personalized learning

## Monitoring and Maintenance

### 1. **Performance Monitoring**
- Image upload success rates
- AI analysis response times
- Database operation performance
- User engagement metrics

### 2. **Quality Assurance**
- AI analysis accuracy
- User feedback collection
- Continuous prompt improvement
- Model performance tracking

### 3. **Data Management**
- Storage optimization
- Archive strategies
- Data retention policies
- Backup and recovery

This diet analysis system provides a comprehensive, AI-powered solution for users to understand their food choices and make healthier decisions, with all data securely stored and easily accessible through the user-friendly API endpoints.
