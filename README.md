# Laboratory Information Management System (LIMS)

A complete production-ready Laboratory Information Management System built with Next.js, TypeScript, and MongoDB.

## 🚀 Features

- **Complete Lab Workflow**: Patient registration → Order creation → Sample collection → Result entry → Pathologist verification → Report generation
- **Role-Based Access Control (RBAC)**: 8 different user roles with granular permissions
- **Multi-Hospital Support**: Manage multiple hospitals and their staff
- **Sample Tracking**: Barcode/QR code generation for sample identification
- **Real-time Notifications**: Email, SMS, and in-app notifications
- **Audit Logging**: Complete traceability of all system actions
- **PDF Report Generation**: Professional lab reports with QR verification
- **Inventory Management**: Track laboratory supplies and equipment
- **Quality Control**: QC lot management and run tracking
- **Analytics Dashboard**: Comprehensive reporting and analytics

## 🛠 Technology Stack

### Frontend
- **Next.js 16.4.0** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form validation and handling
- **TanStack Query** - Server state management

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing

### Additional Libraries
- **jsPDF** - PDF report generation
- **QRCode.js** - QR code generation
- **JSBarcode** - Barcode generation
- **Nodemailer** - Email notifications
- **Zod** - Runtime type validation

## 📋 User Roles & Permissions

1. **ADMIN** - Full system access
2. **LAB_ADMIN** - Laboratory management
3. **RECEPTIONIST** - Patient registration and billing
4. **LAB_TECHNICIAN** - Sample processing and result entry
5. **PATHOLOGIST** - Result verification and approval
6. **ACCOUNTANT** - Financial management
7. **HOSPITAL_STAFF** - Hospital-specific access
8. **PATIENT** - Personal data access

## 🗄 Database Schema

The system uses MongoDB with the following main collections:
- Users (authentication and role management)
- Patients (patient demographics and medical history)
- Hospitals (hospital information and settings)
- Doctors (referring physicians)
- Tests (laboratory test definitions and parameters)
- Orders (test orders and workflow)
- Samples (sample tracking and events)
- Results (test results and verification)
- Reports (generated PDF reports)
- AuditLogs (system activity tracking)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB instance (local or cloud)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd lims
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Update `.env.local` with your configuration:
   \`\`\`env
   MONGODB_URI=mongodb://localhost:27017/lims
   JWT_SECRET=your-jwt-secret-key
   NEXTAUTH_SECRET=your-nextauth-secret
   APP_URL=http://localhost:3000
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   \`\`\`

4. **Database Setup**
   
   Start MongoDB and seed the database:
   \`\`\`bash
   npm run seed
   \`\`\`

5. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Access the Application**
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👤 Demo Credentials

The seeded database includes the following demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@lims.com | Admin@123 |
| Lab Admin | labadmin@lims.com | Admin@123 |
| Receptionist | receptionist@lims.com | Admin@123 |
| Lab Technician | technician@lims.com | Admin@123 |
| Pathologist | pathologist@lims.com | Admin@123 |
| Accountant | accountant@lims.com | Admin@123 |
| Hospital Staff (CGH) | staff@citygeneral.com | Admin@123 |
| Hospital Staff (MMC) | staff@metromedical.com | Admin@123 |

## 📊 Seeded Data

The database includes sample data:
- 8 Users (various roles)
- 3 Hospitals
- 4 Doctors  
- 5 Laboratory Tests (CBC, Lipid Profile, LFT, FBS, TFT)
- 4 Patients

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data
- `npm run db:test` - Test database connection

## 🏗 Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API endpoints
├── components/            # Reusable components
│   └── ui/                # UI primitives
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication utilities
│   ├── mongodb.ts         # Database connection
│   ├── permissions.ts     # RBAC system
│   ├── validation.ts      # Zod schemas
│   └── utils.ts           # Helper functions
├── models/                # MongoDB models
│   ├── User.ts
│   ├── Patient.ts
│   ├── Hospital.ts
│   └── ...
└── scripts/               # Database scripts
    └── seed.ts            # Database seeding
\`\`\`

## 🔒 Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Input validation with Zod schemas
- Audit logging for all critical operations
- SQL injection protection (MongoDB)
- XSS protection with sanitized inputs

## 🧪 Testing

The system includes comprehensive test coverage:
- Authentication flow testing
- RBAC permission testing
- Database connection testing
- API endpoint testing
- End-to-end workflow testing

## 📈 Performance & Scalability

- MongoDB indexing for optimized queries
- Pagination for large datasets
- Server-side rendering with Next.js
- Efficient data fetching with TanStack Query
- Optimized bundle size with Next.js

## 🔄 Workflow Implementation

### Complete Lab Workflow:
1. **Patient Registration** - Create patient records
2. **Order Creation** - Select tests and create orders
3. **Sample Collection** - Generate barcodes/QR codes
4. **Sample Receipt** - Track sample reception
5. **Result Entry** - Lab technicians enter results
6. **Verification** - Pathologists verify results
7. **Report Generation** - Generate PDF reports
8. **Notification** - Alert stakeholders
9. **Report Download** - Secure report access
10. **QR Verification** - Verify report authenticity

## 🔮 Future Enhancements

- [ ] Mobile app for sample collection
- [ ] Integration with laboratory instruments
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Real-time chat for consultations
- [ ] Electronic signature integration
- [ ] FHIR compliance for interoperability

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ using Next.js, TypeScript, and MongoDB**