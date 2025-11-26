# Monsterpedia 📜👹

Welcome to **Monsterpedia**! A digital encyclopedia dedicated to the fascinating and diverse world of monster girls. This project is a full-stack web application built with Angular and Firebase, designed to create, manage, and explore a comprehensive database of monster species.

The main concept is to present information about each monster girl in a way that evokes an ancient encyclopedia or an occult researcher's bulletin board, with detailed profile cards and informative articles.

## ✨ Features

### User Authentication & Roles
- **Three-tier permission system**: Visitor, User, and Admin
- Email verification required for full access
- Role-based access control for all features
- Secure authentication with Firebase Auth

### Content Management
- **Create & Edit Articles**: Verified users can contribute monster entries
- **Rich Article Editor**: Detailed information including:
  - Species classification and common names
  - Threat level assessment
  - Physical characteristics and behavior
  - Habitat and diet information
  - Tags for easy categorization
- **Image Upload**: Support for multiple images per entry
- **Markdown Support**: Rich text formatting for article content

### User Interface
- **Article of the Day**: Featured random monster on homepage
- **See More Section**: Discover 10 random monsters
- **Wiki Articles Page**: Browse all monsters with search functionality
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Vintage Aesthetic**: Brown/beige color palette with serif fonts
- **Consistent Design System**: Unified styling across all components

### Navigation & Discovery
- **Smart Search**: Filter monsters by name, species, description, or tags
- **Interactive Cards**: Hover effects and smooth transitions
- **Threat Level Indicators**: Color-coded danger ratings
- **Quick Navigation**: Header shortcuts to key pages

## 🛠️ Technology Stack

### Frontend
- **Angular 19**: Modern web framework with standalone components
- **TypeScript**: Type-safe development
- **RxJS**: Reactive programming for data streams
- **TailwindCSS**: Utility-first CSS framework
- **PrimeIcons**: Icon library
- **ngx-markdown**: Markdown rendering support

### Backend & Services
- **Firebase Authentication**: User management and security
- **Cloud Firestore**: NoSQL database for articles and user data
- **Firebase Storage**: Image hosting and management

### Development Tools
- **Angular CLI**: Project scaffolding and build tools
- **ESLint**: Code quality and consistency
- **Git**: Version control

## 📋 Permission Matrix

| Action | Visitor | User | Admin |
|--------|---------|------|-------|
| View articles | ✅ | ✅ | ✅ |
| Access dashboard | ❌ | ✅ | ✅ |
| Create articles | ❌ | ✅ | ✅ |
| Edit own articles | ❌ | ✅ | ✅ |
| Edit others' articles | ❌ | ❌ | ✅ |
| Delete articles | ❌ | ❌ | ✅ |
| Approve articles | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FeithNoir/MonsterpediaApp.git
cd MonsterpediaApp
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy `src/environments/environment.template.ts` to `src/environments/environment.ts`
   - Add your Firebase configuration

4. Run the development server:
```bash
ng serve
```

5. Open your browser and navigate to `http://localhost:4200`

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/                 # Authentication components
│   ├── core/                 # Core services and guards
│   │   ├── enums/           # User roles and other enums
│   │   ├── guards/          # Route guards (auth, role)
│   │   ├── interfaces/      # TypeScript interfaces
│   │   └── services/        # Business logic services
│   ├── pages/               # Page components
│   │   ├── dashboard/       # User dashboard
│   │   ├── entry/           # Article creation/editing
│   │   ├── home/            # Homepage
│   │   ├── layout/          # Main layout wrapper
│   │   ├── profile/         # User profile
│   │   └── wiki-articles/   # Article browsing
│   └── shared/              # Shared components
│       ├── article-of-the-day/
│       ├── header/
│       ├── hero/
│       ├── see-more-articles/
│       └── sidebar/
└── styles.css               # Global styles and design tokens
```

## 🎨 Design System

The application uses a vintage encyclopedia aesthetic with:
- **Color Palette**: Brown and beige tones (`--color-brand-primary`, `--color-bg-surface`)
- **Typography**: 
  - Titles: Sorts Mill Goudy
  - Body: Crimson Text
- **Components**: Consistent border radius, shadows, and transitions
- **Responsive**: Mobile-first approach with multiple breakpoints

## 🔐 Security Notes

> **Important**: This application implements client-side permission checks. For production use, you **must** implement Firebase Security Rules to validate permissions on the backend.

Example Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /entries/{entry} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.token.email_verified;
      allow update: if request.auth != null && 
        (resource.data.author.id == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🚀 Future Enhancements

- [ ] Article approval workflow for admins
- [ ] User management dashboard for admins
- [ ] Advanced filtering and sorting options
- [ ] Favorites and bookmarks system
- [ ] Comments and ratings on articles
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Export articles to PDF
- [ ] Social sharing features
- [ ] Activity feed and notifications

## 👤 Author

This project was developed by **Feith Noir**.

- **GitHub**: [![GitHub](https://img.shields.io/badge/GitHub-Feith%20Noir-181717?style=for-the-badge&logo=github)](https://github.com/feithnoir)

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

Thank you for visiting Monsterpedia! We hope this project inspires you to explore the fascinating world of monster girls. 🎭✨
