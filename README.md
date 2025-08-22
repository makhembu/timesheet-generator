# Timesheet Generator

A professional timesheet generation application built with Next.js for interpreter services. This web application allows users to create, fill out, and generate PDF timesheets for language interpretation services.

## Features

- **Interactive Form**: Complete form with all necessary fields for interpreter timesheets
- **Live Preview**: Real-time preview of how the timesheet will look
- **PDF Generation**: Generate filled PDFs with all entered data
- **Blank Template**: Download blank templates for manual completion
- **Auto-calculation**: Automatic duration calculation based on start and end times
- **Professional Design**: Clean, modern UI with responsive design
- **Company Branding**: Includes company logo and professional styling

## Form Sections

### Booking Details
- Date and time information
- Language and subject details
- Location and service user information
- Booking and interpreter notes

### Interpreter Profile
- Interpreter name and job reference
- Reporting structure and contact information

### Customer Section
- Actual start/finish times
- Service quality assessments
- Customer signature and department details

### Interpreter Declaration
- Legal declaration text
- Signature and date fields

## Technology Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **PDF Generation**: jsPDF
- **TypeScript**: Full type safety
- **Responsive Design**: Mobile-first approach

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd timesheet-generator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Fill out the form**: Complete all required fields in the interactive form
2. **Live preview**: See real-time updates in the preview section
3. **Generate PDF**: Click "Generate Timesheet PDF" to download the completed timesheet
4. **Blank template**: Use "Download Blank Template" for manual completion

## PDF Features

- Professional letterhead with company branding
- Clean, organized layout
- Automatic page breaks for long content
- Professional footer with company information
- High-quality output suitable for business use

## Company Information

**Jambo Linguists Ltd**
- The Home Of Swahili
- Radley House, Richardshaw Rd, Pudsey, LS28 6LE
- Company No. 15333696
- Email: jamii@jambolinguists.com
- Phone: +44 7938 065717

## Development

### Project Structure
```
timesheet-generator/
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx        # App layout
│   ├── globals.css       # Global styles
│   └── favicon.ico       # App icon
├── public/               # Static assets
├── package.json          # Dependencies
└── README.md            # This file
```

### Key Components
- `TimesheetGenerator`: Main component with form and PDF generation
- Form state management with React hooks
- PDF generation using jsPDF library
- Responsive UI with Tailwind CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for Jambo Linguists Ltd.

## Support

For support or questions, please contact:
- Email: jamii@jambolinguists.com
- Phone: +44 7938 065717
