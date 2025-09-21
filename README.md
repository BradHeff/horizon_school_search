# Horizon School Search 🎓

A modern, child-safe search engine designed specifically for **Horizon Christian School** that combines real web search with AI-powered instant answers, educational content filtering, and persistent user data storage.

## 🌟 Overview

Horizon School Search is a full-stack React application that provides a **revolutionary hybrid search experience** combining real web search with AI-powered instant answers. The system uses **LangSearch API** for current web results, **OpenAI GPT-5** for intelligent instant answers, **Node.js backend** for user data persistence, and sophisticated **role-based content filtering** to deliver child-safe, educational results in seconds.

### 🎯 **Latest Features (September 2025)**
- **⚡ AI Instant Answers**: GPT-5 generates immediate, contextual answers using real search results
- **🌐 Real Web Search**: Live results from LangSearch API, not mock data
- **🛡️ Smart Filtering**: Multi-layered safety filtering based on user roles
- **🗄️ Backend Data Storage**: MongoDB Atlas for user accounts, search history, and chat sessions
- **📋 Real-time Breadcrumbs**: Pill-style search history and chat breadcrumbs with instant updates
- **🚀 Child-Optimized**: 5-15 second response times designed for impatient children
- **📚 Educational Focus**: Prioritizes learning resources and blocks inappropriate content

## 📸 Screenshots

### Search Interface
![Horizon School Search Interface](images/Screenshot.png)

*The main search interface showing AI-powered instant answers, web search results, and child-safe content filtering in action.*

## 🏗️ System Architecture

### 🔄 **Complete System Architecture (Updated 2025)**
```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           FULL-STACK ARCHITECTURE                             │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend      │    Backend      │    Database     │    External APIs        │
│                 │                 │                 │                         │
│ • React 18      │ • Node.js       │ • MongoDB Atlas │ • LangSearch API        │
│ • TypeScript    │ • Express       │ • User Storage  │ • OpenAI GPT-5          │
│ • Material UI   │ • JWT Auth      │ • Search History│ • Azure AD Graph        │
│ • Redux Store   │ • CORS Config   │ • Chat Sessions │ • Microsoft Graph       │
│ • Azure AD      │ • Rate Limiting │ • Indexes       │ • OAuth 2.0             │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────┘
                                    │
                    ┌─────────────────────────────────────────────────────────┐
                    │                SEARCH FLOW                              │
                    │                                                         │
                    │ User Query → Backend Auth → LangSearch → AI Analysis →  │
                    │ → Content Filter → Database Save → Breadcrumb Update    │
                    └─────────────────────────────────────────────────────────┘
```

### 🏛️ **Backend Infrastructure**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND ARCHITECTURE                                 │
├─────────────────┬─────────────────┬─────────────────┬──────────────────────────┤
│   API Routes    │  Authentication │   Database      │     Data Models          │
│                 │                 │                 │                          │
│ • /auth/login   │ • Azure AD JWT  │ • Users         │ • User with licenses     │
│ • /searches/*   │ • Token verify  │ • SearchHistory │ • Search with tracking   │
│ • /chats/*      │ • Role-based    │ • ChatSessions  │ • Chat with messages     │
│ • /users/*      │ • optionalAuth  │ • Indexes       │ • Timestamps & metadata  │
│ • /health       │ • CORS handling │ • Aggregation   │ • Real-time updates      │
└─────────────────┴─────────────────┴─────────────────┴──────────────────────────┘
```

### 🔧 **Service Integration**
```
┌──────────────────┐    ┌────────────────────┐     ┌────────────────────┐
│   React Frontend │    │   Node.js API      │     │   MongoDB Atlas    │
│                  │    │                    │     │                    │
│ • Search UI      │───▶│ • JWT Auth        │───▶│ • User Storage     │
│ • Breadcrumbs    │    │ • Search Track     │     │ • Search History   │
│ • Real-time UI   │    │ • Chat Sessions    │     │ • Chat Data        │
│ • Auth Flow      │◀───│ • Data Persist    │◀───│ • Aggregation      │
└──────────────────┘    └────────────────────┘    └──────────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                     ┌──────────────────┐
                     │  External APIs   │
                     │                  │
                     │ • LangSearch     │
                     │ • OpenAI GPT-5   │
                     │ • Azure AD       │
                     │ • Microsoft Graph│
                     └──────────────────┘
```

## 🎯 Key Features

### 🌐 **Full-Stack Search System**
- **🌐 Live Web Results**: LangSearch API delivers current, real-time search results
- **🤖 AI Instant Answers**: GPT-5 analyzes search results and provides contextual answers in seconds
- **🗄️ Persistent Storage**: MongoDB backend stores user accounts, search history, and chat sessions
- **📋 Real-time Breadcrumbs**: Pill-style breadcrumbs showing last 5 searches/chats with instant updates
- **⚡ Child-Optimized Speed**: 5-15 second total response time (was 60+ seconds)
- **🔄 Dual Display**: AI answer card + filtered web results simultaneously

### 🗄️ **Backend Data Management (NEW)**
- **👤 User Management**: MongoDB Atlas storage for authenticated users
- **📊 Search Tracking**: Persistent search history with metadata (query, category, results count)
- **💬 Chat Sessions**: Complete chat history storage for staff users
- **🔐 JWT Authentication**: Secure token-based API access with refresh tokens
- **📋 Breadcrumb System**: Real-time pill-style recent activity display
- **📈 Analytics Ready**: Search patterns, user behavior, and usage statistics

### 🛡️ **Advanced Content Safety**
- **👶 Child-First Design**: Every result vetted for age-appropriateness
- **🚫 Social Media Blocking**: Automatic filtering of Facebook, Twitter, Instagram, TikTok, Reddit
- **🎓 Educational Priority**: Promotes Khan Academy, Britannica, educational institutions
- **🔍 Multi-Layer Filtering**: Domain blocking + AI content analysis + role-based restrictions
- **⚖️ Role-Specific Access**: Different safety levels for guests, students, and staff

### 🧠 **Intelligent AI Integration**
- **📊 Context-Aware Answers**: AI uses actual search results for accurate, current information
- **🎯 Role-Optimized Prompts**: Different AI behavior for children vs. adults
- **💬 Staff Chat Mode**: Full conversational AI assistant with persistent history
- **🔧 Smart Token Management**: Optimized prompt engineering for fast, reliable responses
- **🛟 Graceful Fallbacks**: Educational content when web search fails

### 👥 **Sophisticated Role Management**
- **🌐 Guest Access**: Anonymous users with maximum content filtering
- **🎒 Student Access**: School-authenticated students with educational focus
- **👨‍🏫 Staff Access**: Teachers and administrators with research-level access
- **🔐 Azure AD Integration**: Seamless authentication with automatic role detection
- **📊 License-Based Detection**: Role assignment based on Microsoft 365 education licenses

## 🎭 User Roles & Feature Matrix

### 📊 Feature Access by Role

```
┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Feature                 │   Guest  │  Student │   Staff  │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ Real Web Search         │    ✅    │    ✅    │    ✅    │
│ AI Instant Answers      │    ✅    │    ✅    │    ✅    │
│ LangSearch Results      │    ✅    │    ✅    │    ✅    │
│ Domain Filtering        │    ✅    │    ✅    │    ✅    │
│ Search History          │    ✅    │    ✅    │    ✅    │
│ Persistent Data         │    ❌    │    ✅    │    ✅    │
│ Backend Storage         │    ❌    │    ✅    │    ✅    │
│ Breadcrumb Pills        │    ❌    │    ✅    │    ✅    │
│ 4-Second Debouncing     │    ✅    │    ✅    │    ✅    │
│ Loading Skeletons       │    ✅    │    ✅    │    ✅    │
│ Error Handling          │    ✅    │    ✅    │    ✅    │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ AI Chat Assistant       │    ❌    │    ❌    │    ✅    │
│ Chat History Storage    │    ❌    │    ❌    │    ✅    │
│ Social Media Results    │    ❌    │    ❌    │    ✅*   │
│ Reddit Access           │    ❌    │    ❌    │    ✅*   │
│ Twitter/Facebook        │    ❌    │    ❌    │    ✅*   │
│ Research Platforms      │    ❌    │    ❌    │    ✅    │
│ Minimal Filtering       │    ❌    │    ❌    │    ✅    │
│ Advanced AI Prompts     │    ❌    │    ❌    │    ✅    │
│ 500 Token Responses     │    ❌    │    ❌    │    ✅    │
└─────────────────────────┴──────────┴──────────┴──────────┘

* Staff can access but with educational/research context priority
```

### 📋 **NEW: Breadcrumb System**

#### **Pill-Style Recent Activity**
- **📍 Location**: Directly under search input field
- **📊 Display**: Last 5 searches and chats as truncated pill chips
- **🎨 Design**: Category-colored pills with search/chat icons
- **⚡ Real-time**: Instant updates when new searches/chats are made
- **🔄 Interactive**: Click to re-run search or open chat session

#### **Visual Example**
```
Search: [                                    ]
Recent: [🔍 best teaching meth...] [🔍 lesson plan disc...] [💬 AI help with...] [🔍 science proj...]
```

## 🚀 Technology Stack

### **Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Material UI v7** - Modern, accessible component library
- **Redux Toolkit** - State management with persistence
- **React Router** - Client-side routing

### **Backend (NEW)**
- **Node.js + Express** - RESTful API server
- **MongoDB Atlas** - Cloud database for user data
- **JWT Authentication** - Secure token-based auth
- **Mongoose ODM** - MongoDB object modeling
- **CORS & Rate Limiting** - Security middleware

### **External Services**
- **LangSearch API** - Real web search results
- **OpenAI GPT-5** - AI instant answers and chat
- **Azure AD** - Authentication and authorization
- **Microsoft Graph** - User profile and license data

### **Development Tools**
- **Create React App** - Build tooling and development server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Backend development server

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- MongoDB Atlas account (for backend)
- OpenAI API key
- LangSearch API access
- Azure AD app registration (for authentication)

### Frontend Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd horizon-school-search
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**

   Create `public/env.json` for runtime configuration:
   ```json
   {
     "OPENAI_API_KEY": "your-openai-api-key",
     "SEARCH_API_ENDPOINT": "https://api.langsearch.com/v1/web-search",
     "SEARCH_API_KEY": "your-langsearch-api-key",
     "AZURE_CLIENT_ID": "your-azure-client-id",
     "AZURE_TENANT_ID": "your-azure-tenant-id",
     "BACKEND_URL": "https://search-api.horizon.sa.edu.au"
   }
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

### Backend Setup (NEW)

**⚠️ Note**: The backend code is currently not shared on GitHub for security reasons. It contains production credentials and is deployed directly to the server.

**Backend Features Include:**
- User authentication with Azure AD integration
- Search history tracking and storage
- Chat session management
- JWT token handling
- MongoDB data persistence
- Real-time breadcrumb data

**Backend Architecture:**
```
backend/
├── server.js              # Main Express server
├── models/
│   ├── User.js            # User schema with Azure AD
│   ├── SearchHistory.js   # Search tracking
│   └── ChatSession.js     # Chat storage
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── searches.js       # Search tracking APIs
│   └── chats.js          # Chat session APIs
└── middleware/auth.js     # JWT validation
```

## 🔧 Configuration

### **Search Configuration**
The system supports multiple search backends configured in `src/config/app-config.ts`:

```typescript
interface SearchConfig {
  apiEndpoint: string;    // LangSearch API endpoint
  apiKey: string;         // LangSearch API key
  maxResults: number;     // Maximum results per search
  timeout: number;        // Search timeout in ms
}
```

### **Backend Configuration (NEW)**
Backend API integration settings:

```typescript
interface BackendConfig {
  baseUrl: string;           // Backend API URL
  authEndpoint: string;      // Authentication endpoint
  searchEndpoint: string;    // Search tracking endpoint
  chatEndpoint: string;      // Chat session endpoint
}
```

### **AI Configuration**
OpenAI integration settings:

```typescript
interface OpenAIConfig {
  apiKey: string;           // OpenAI API key
  model: string;            // GPT model (default: gpt-5-2025-08-07)
  maxTokens: {
    instant: number;        // Tokens for instant answers
    chat: number;           // Tokens for chat responses
  };
}
```

## 🎨 User Interface

### **Search Interface**
- **Sticky Search Bar**: Always visible at the top
- **Real-time Typing**: 4-second delay for child-friendly typing
- **Breadcrumb Pills**: Recent searches and chats displayed as colorful pills
- **Loading States**: Skeleton screens during search
- **Responsive Design**: Works on desktop, tablet, and mobile

### **Breadcrumb System (NEW)**
1. **Pill Display**: Horizontal scrolling row of recent activity
2. **Color Coding**: Different colors for different search categories
3. **Truncation**: Long queries show with "..." for readability
4. **Real-time Updates**: New searches appear immediately
5. **Interactive**: Click to re-run searches or open chat sessions

### **Result Display**
1. **AI Instant Answer** (if available)
   - Prominent AI badge and branding
   - Confidence indicator (High/Medium/Low)
   - Source attribution with clickable links
   - Clear disclaimer about AI-generated content

2. **Web Search Results**
   - Clean card-based layout
   - Category indicators
   - Domain information
   - Click to open in new tab

### **Staff-only Features**
- **AI Chat Toggle**: Switch between search and chat modes
- **Conversation Interface**: Full chat history and context
- **Advanced Search Options**: Less restricted content access
- **Chat History**: Persistent conversation storage

## 🔒 Security & Privacy

### **Data Protection**
- **Authenticated Storage**: Search queries stored only for logged-in users
- **JWT Security**: Token-based authentication with refresh tokens
- **Secure API Communication**: All API calls use HTTPS
- **Data Encryption**: MongoDB Atlas with encryption at rest
- **Privacy Controls**: Users can clear their search history

### **Child Safety Measures**
- **Multi-layered Filtering**: Domain blocking + AI content analysis
- **Age-appropriate Responses**: Role-specific AI prompts
- **Educational Focus**: Fallback to educational content
- **Staff Oversight**: Enhanced access for supervision

### **Privacy Compliance**
- **Minimal Data Collection**: Only necessary for functionality
- **No Third-party Tracking**: No analytics or tracking scripts
- **Transparent Operations**: Clear user communication about data storage
- **Secure Deletion**: Users can clear their data

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Auth/            # Authentication components
│   ├── Layout/          # Layout components
│   ├── Breadcrumbs/     # Breadcrumb components (NEW)
│   │   ├── Breadcrumbs.tsx
│   │   ├── CompactBreadcrumbs.tsx     # Pill-style breadcrumbs
│   │   └── BreadcrumbErrorBoundary.tsx
│   └── Search/          # Search-related components
│       ├── SearchSection.tsx
│       ├── AIInstantAnswer.tsx
│       └── LoadingSkeleton.tsx
├── config/              # Configuration files
│   └── app-config.ts    # Runtime configuration
├── hooks/               # Custom React hooks
│   └── redux.ts         # Redux hooks
├── services/            # External service integrations
│   ├── aiSearchService.ts       # Main search coordination
│   ├── webSearchService.ts      # LangSearch + AI filtering
│   ├── openAiService.ts         # OpenAI integration
│   ├── authService.ts           # Azure AD authentication
│   ├── backendService.ts        # Backend API calls (NEW)
│   └── breadcrumbService.ts     # Breadcrumb management (NEW)
├── store/               # Redux store and slices
│   ├── index.ts
│   └── slices/
│       ├── authSlice.ts
│       └── searchSlice.ts
└── types/               # TypeScript type definitions
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Use Material UI components when possible
- Implement proper error handling
- Add comprehensive logging
- Test with different user roles
- Ensure child safety compliance
- Test breadcrumb functionality

## 📚 API Documentation

### **🔄 Complete Search Flow (Updated)**

```
1️⃣ USER INPUT
   • User types search query
   • 4-second debounce delay (child-friendly)
   • Minimum 3 characters required
   • Duplicate search prevention

2️⃣ AUTHENTICATION CHECK
   • Check if user is logged in
   • Determine user role (guest/student/staff)
   • Prepare for potential data storage

3️⃣ WEB SEARCH
   • LangSearch API call initiated
   • Request: 8 results, no time limit
   • Response: Real-time web results
   • Timeout: 15 seconds maximum

4️⃣ CONTENT FILTERING
   • Domain-based filtering by user role
   • Guest/Student: Block social media
   • Staff: Minimal filtering
   • Educational content prioritization

5️⃣ AI INSTANT ANSWER
   • GPT-5 analyzes filtered results
   • Role-specific prompts and token limits
   • Context: Top 3 search results
   • Output: Contextual, child-appropriate answer

6️⃣ DATA STORAGE (NEW)
   • Save search to MongoDB (authenticated users)
   • Update breadcrumb cache immediately
   • Track user search patterns

7️⃣ RESULTS DISPLAY
   • AI instant answer card (top)
   • Updated breadcrumb pills (recent searches)
   • Filtered web results list (below)
   • Loading skeletons during processing
   • Error handling and fallbacks
```

### **Backend API Endpoints (NEW)**

#### Authentication
- `POST /auth/login` - User login with Azure AD data
- `POST /auth/refresh` - Refresh JWT tokens
- `GET /auth/me` - Get current user information
- `POST /auth/logout` - Logout and clear tokens

#### Search Management
- `GET /searches/recent` - Get user's recent searches
- `POST /searches/track` - Track a new search
- `GET /searches` - Get search history with pagination

#### Chat Management (Staff Only)
- `GET /chats/recent` - Get recent chat sessions
- `POST /chats` - Create new chat session
- `GET /chats/:id` - Get specific chat session
- `POST /chats/:id/messages` - Add message to chat

## 🐛 Troubleshooting

### **Common Issues**

**Search Returns No Results**
- Check LangSearch API key and endpoint
- Verify domain filtering isn't too restrictive
- Check console for API errors

**AI Answers Not Appearing**
- Verify OpenAI API key is configured
- Check token limits in configuration
- Monitor console for AI service errors

**Authentication Issues**
- Verify Azure AD configuration
- Check client ID and tenant ID
- Ensure proper redirect URLs

**Backend Connection Issues (NEW)**
- Check backend URL in configuration
- Verify MongoDB Atlas connection
- Check JWT token validity
- Monitor network requests in DevTools

**Breadcrumbs Not Loading**
- Check user authentication status
- Verify backend search tracking is working
- Check console for breadcrumb service errors

### **Debug Mode**
Enable detailed logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## 📋 TODO List

### 🔄 **In Progress**
- [ ] Deploy updated backend with latest fixes
- [ ] Validate end-to-end authentication flow
- [ ] Test breadcrumb real-time updates in production

### 🎯 **Planned Features**
- [ ] **Search Analytics Dashboard** - Admin view of search patterns and popular queries
- [ ] **Bookmark System** - Allow users to save favorite searches and results
- [ ] **Advanced Filters** - Date range, content type, and source filtering
- [ ] **Voice Search** - Voice input for younger children
- [ ] **Offline Mode** - Cached results for limited connectivity
- [ ] **Dark Mode** - Theme toggle for different lighting conditions
- [ ] **Export Functionality** - Save search results to PDF or print
- [ ] **Search Suggestions** - Auto-complete based on user history
- [ ] **Reading Level Adaptation** - Adjust AI responses based on user age/grade
- [ ] **Multilingual Support** - Spanish and other language options

### 🚀 **Performance Optimizations**
- [ ] **Search Result Caching** - Redis cache for common queries
- [ ] **Image Optimization** - WebP format and lazy loading
- [ ] **CDN Integration** - CloudFlare for faster global access
- [ ] **Database Indexing** - Optimize MongoDB queries
- [ ] **API Rate Limiting** - Smart throttling based on user patterns

### 🎨 **User Experience Enhancements**
- [ ] **Breadcrumb Categories** - Group searches by subject/category
- [ ] **Search History Export** - Download personal search history
- [ ] **Customizable Interface** - User preferences for layout
- [ ] **Keyboard Shortcuts** - Power user navigation
- [ ] **Mobile App** - Native iOS/Android applications

### 🛡️ **Security & Safety**
- [ ] **Content Moderation Dashboard** - Staff tools for reviewing flagged content
- [ ] **Enhanced AI Safety** - Additional content filtering layers
- [ ] **Parental Controls** - Parent dashboards for student accounts
- [ ] **Audit Logging** - Comprehensive security and usage logs
- [ ] **Two-Factor Authentication** - Enhanced security for staff accounts

### 🔧 **Technical Debt**
- [ ] **API Documentation** - Comprehensive backend API docs
- [ ] **Unit Testing** - Frontend and backend test coverage
- [ ] **Error Monitoring** - Sentry or similar error tracking
- [ ] **Performance Monitoring** - Application performance insights
- [ ] **Backup Strategy** - Automated database backups

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏫 About Horizon Christian School

Horizon School Search is proudly developed for **Horizon Christian School**, committed to providing excellent Christian education in a safe, nurturing environment. This search platform reflects our values of safety, learning, and technological innovation in education.

The system now includes comprehensive backend data storage to track student learning patterns, provide personalized educational experiences, and maintain secure user accounts while preserving the child-safe environment that is central to our mission.

---

**Built with ❤️ for education by the Horizon Christian School technology team**

*Last Updated: September 21, 2025*
*Status: Production Ready with Backend Integration*

---

**⚠️ Note**: Backend source code is not included in this repository for security reasons. The backend API provides user authentication, data persistence, and search tracking functionality essential for the full user experience.