# Horizon School Search 🎓

A modern, child-safe search engine designed specifically for **Horizon Christian School** that combines real web search with AI-powered instant answers and educational content filtering.

## 🌟 Overview

Horizon School Search is a React-based application that provides a safe, educational search environment for students, guests, and staff. The system integrates multiple search technologies including LangSearch API, OpenAI GPT models, and role-based content filtering to deliver age-appropriate, educational results.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Search APIs   │    │   AI Services   │
│                 │    │                 │    │                 │
│ • React 18      │───▶│ • LangSearch    │───▶│ • OpenAI GPT    │
│ • TypeScript    │    │ • Web Results   │    │ • Instant       │
│ • Material UI   │    │ • Domain Filter │    │   Answers       │
│ • Redux Toolkit │    │ • Child Safety  │    │ • Chat (Staff)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │ Authentication  │
                    │                 │
                    │ • Azure AD      │
                    │ • Role-based    │
                    │ • Guest Access  │
                    └─────────────────┘
```

## 🎯 Key Features

### 🔍 **Intelligent Search System**
- **Real Web Search**: Powered by LangSearch API for current, relevant results
- **AI Instant Answers**: GPT-generated quick answers that appear above search results
- **Educational Fallbacks**: Curated educational content when web results are insufficient
- **Smart Filtering**: Role-based content filtering for child safety

### 🛡️ **Child Safety & Content Filtering**
- **Domain-based Filtering**: Blocks social media and inappropriate sites
- **Role-specific Restrictions**: Different filtering levels for students vs. staff
- **AI Content Analysis**: Secondary layer of content safety checking
- **Educational Focus**: Prioritizes educational and reference materials

### 👥 **Role-based Access Control**
- **Guest Access**: Basic search with strict filtering
- **Student Access**: Enhanced search with educational focus
- **Staff Access**: Advanced features with minimal restrictions

### 🤖 **AI-Powered Features**
- **Instant Answers**: Quick, factual responses to search queries
- **Staff Chat**: Full conversational AI for staff members
- **Smart Prompting**: Role-specific AI prompts for appropriate responses

## 🎭 User Roles & Feature Matrix

### 📊 Feature Access by Role

```
┌─────────────────────────┬─────────┬─────────┬─────────┐
│ Feature                 │  Guest  │ Student │  Staff  │
├─────────────────────────┼─────────┼─────────┼─────────┤
│ Basic Web Search        │    ✅    │    ✅    │    ✅    │
│ AI Instant Answers      │    ✅    │    ✅    │    ✅    │
│ Educational Fallbacks   │    ✅    │    ✅    │    ✅    │
│ Search History          │    ✅    │    ✅    │    ✅    │
│ Real-time Search        │    ✅    │    ✅    │    ✅    │
│ AI Chat Assistant       │    ❌    │    ❌    │    ✅    │
│ Social Media Access     │    ❌    │    ❌    │    ✅    │
│ Advanced Search         │    ❌    │    ❌    │    ✅    │
│ Reddit/Twitter Results  │    ❌    │    ❌    │    ✅    │
│ Minimal Content Filter  │    ❌    │    ❌    │    ✅    │
└─────────────────────────┴─────────┴─────────┴─────────┘
```

### 🔍 Search Experience by Role

#### 👤 **Guest Users**
- **Purpose**: Visitors and prospective families exploring school resources
- **Search Style**: Simple, educational content only
- **AI Answers**: 1-2 sentences, child-friendly language
- **Content Filter**: Strict - blocks all social media platforms
- **Token Limit**: 200 tokens (concise responses)

#### 🎒 **Student Users**
- **Purpose**: Current students accessing educational resources
- **Search Style**: Educational focus with broader content access
- **AI Answers**: 1-2 sentences, age-appropriate explanations
- **Content Filter**: Strict - same as guests for safety
- **Token Limit**: 200 tokens (student-friendly responses)

#### 👨‍🏫 **Staff Users**
- **Purpose**: Teachers and administrators with professional needs
- **Search Style**: Full access to research and professional content
- **AI Answers**: 2-4 sentences, professional language
- **Content Filter**: Minimal - only blocks Discord
- **Token Limit**: 400 tokens (detailed responses)
- **AI Chat**: Full conversational AI assistant available

### 🛡️ Content Filtering Details

#### **Blocked Domains by Role**

```
Guest/Student (Strict Filtering):
┌──────────────────────────────────────┐
│ • facebook.com                       │
│ • twitter.com                        │
│ • instagram.com                      │
│ • tiktok.com                         │
│ • snapchat.com                       │
│ • reddit.com                         │
│ • discord.com                        │
└──────────────────────────────────────┘

Staff (Minimal Filtering):
┌──────────────────────────────────────┐
│ • discord.com (only)                 │
│                                      │
│ ✅ Allows: Twitter, Reddit,          │
│    Facebook for research purposes    │
└──────────────────────────────────────┘
```

## 🚀 Technology Stack

### **Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Material UI v7** - Modern, accessible component library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing

### **Backend Services**
- **LangSearch API** - Real web search results
- **OpenAI GPT** - AI instant answers and chat
- **Azure AD** - Authentication and authorization

### **Development Tools**
- **Create React App** - Build tooling and development server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- OpenAI API key
- LangSearch API access
- Azure AD app registration (for authentication)

### Installation

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

   Create `.env` file in the root directory:
   ```env
   REACT_APP_OPENAI_API_KEY=your-openai-api-key
   REACT_APP_SEARCH_API_ENDPOINT=https://api.langsearch.com/v1/web-search
   REACT_APP_SEARCH_API_KEY=your-langsearch-api-key
   REACT_APP_AZURE_CLIENT_ID=your-azure-client-id
   REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id
   ```

   Create `public/env.json` for runtime configuration:
   ```json
   {
     "OPENAI_API_KEY": "your-openai-api-key",
     "SEARCH_API_ENDPOINT": "https://api.langsearch.com/v1/web-search",
     "SEARCH_API_KEY": "your-langsearch-api-key",
     "AZURE_CLIENT_ID": "your-azure-client-id",
     "AZURE_TENANT_ID": "your-azure-tenant-id"
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

### **AI Configuration**
OpenAI integration settings:

```typescript
interface OpenAIConfig {
  apiKey: string;           // OpenAI API key
  model: string;            // GPT model (default: gpt-4o-mini)
  maxTokens: {
    instant: number;        // Tokens for instant answers
    chat: number;           // Tokens for chat responses
  };
}
```

### **Role-based Settings**
Content filtering and feature access:

```typescript
interface RoleConfig {
  guest: {
    maxTokens: 200;
    blockedDomains: string[];
    features: string[];
  };
  student: {
    maxTokens: 200;
    blockedDomains: string[];
    features: string[];
  };
  staff: {
    maxTokens: 400;
    blockedDomains: string[];
    features: string[];
  };
}
```

## 🎨 User Interface

### **Search Interface**
- **Sticky Search Bar**: Always visible at the top
- **Real-time Typing**: 4-second delay for child-friendly typing
- **Loading States**: Skeleton screens during search
- **Responsive Design**: Works on desktop, tablet, and mobile

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

## 🔒 Security & Privacy

### **Data Protection**
- **No Personal Data Storage**: Search queries are not permanently stored
- **Secure API Communication**: All API calls use HTTPS
- **Token-based Authentication**: Azure AD integration for staff access
- **Client-side Processing**: Sensitive operations handled in browser

### **Child Safety Measures**
- **Multi-layered Filtering**: Domain blocking + AI content analysis
- **Age-appropriate Responses**: Role-specific AI prompts
- **Educational Focus**: Fallback to educational content
- **Staff Oversight**: Enhanced access for supervision

### **Privacy Compliance**
- **Minimal Data Collection**: Only necessary for functionality
- **No Tracking**: No analytics or tracking scripts
- **Local Storage**: Temporary data only (search history)
- **Transparent Operations**: Clear user communication about AI usage

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Auth/            # Authentication components
│   ├── Layout/          # Layout components
│   └── Search/          # Search-related components
│       ├── SearchSection.tsx
│       ├── AIInstantAnswer.tsx
│       └── LoadingSkeleton.tsx
├── config/              # Configuration files
│   └── app-config.ts    # Runtime configuration
├── hooks/               # Custom React hooks
│   └── redux.ts         # Redux hooks
├── services/            # External service integrations
│   ├── aiSearchService.ts
│   ├── webSearchService.ts
│   ├── openAiService.ts
│   └── authService.ts
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

## 📚 API Documentation

### **Search Flow**
1. User types query (4-second delay)
2. System calls LangSearch API for web results
3. Results filtered based on user role
4. AI generates instant answer using search context
5. Both instant answer and web results displayed

### **Authentication Flow**
1. User visits site (guest access by default)
2. Staff can sign in via Azure AD
3. Role determined from Azure AD claims
4. Features enabled/disabled based on role

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

### **Debug Mode**
Enable detailed logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏫 About Horizon Christian School

Horizon School Search is proudly developed for **Horizon Christian School**, committed to providing excellent Christian education in a safe, nurturing environment. This search platform reflects our values of safety, learning, and technological innovation in education.

---

**Built with ❤️ for education by the Horizon Christian School technology team**