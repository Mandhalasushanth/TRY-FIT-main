# TryFit: AI Multi-Angle Virtual Try-On

TryFit is an advanced AI-powered virtual try-on web application that allows users to upload clothing images, generate AI models, and create stunning virtual photoshoots from multiple angles (front, side, and back views). Built with Next.js, TypeScript, Tailwind CSS, and Google Gemini 2.0, TryFit delivers a comprehensive and modern user experience for fashion and e-commerce innovation.

## Features
- **Selectable Virtual Try-On:** Upload clothing images and generate realistic AI models from your chosen angle (front, side, or back view).
- **AI Model Generation:** Customize model gender, pose, body type, and skin tone for personalized results.
- **Smart Gender Detection:** Automatically detects whether clothing is for male or female models.
- **Enhanced Clothing Analysis:** Advanced analysis with Google Gemini 2.0 for better clothing categorization.
- **View Angle Selection:** Choose from front view, side view, or back view for targeted visualization.
- **Optimized Performance:** Single-view generation prevents API overload and ensures reliable results.
- **Modern UI:** Responsive, clean, and user-friendly interface built with Tailwind CSS and Radix UI components.

## Technology Stack
- **Next.js** (React framework)
- **TypeScript**
- **Tailwind CSS**
- **Google Gemini 2.0** (Advanced AI with multimodal capabilities)
- **Genkit AI** (Google AI development framework)
- **Radix UI** (component library)
- **Zod** (form validation)

## Project Structure
```
TRY-FIT/
├── src/
│   ├── app/                # Main app files (layout, pages, global styles)
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── ai/                 # AI flows and integrations
├── docs/                   # Project documentation
├── public/                 # Static assets (if any)
├── .env                    # Environment variables (GEMINI_API_KEY)
├── package.json            # Project dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Getting Started
1. **Clone the repository:**
   ```powershell
   git clone <your-repo-url>
   cd TRY-FIT
   ```
2. **Install dependencies:**
   ```powershell
   npm install
   ```
3. **Set up environment variables:**
   - Add your Google Gemini API key to the `.env` file:
     ```env
     GEMINI_API_KEY=your-gemini-api-key
     ```
4. **Run the development server:**
   ```powershell
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Usage Guide
- **Upload Clothing:** Use the UI to upload an image of clothing.
- **Auto-Analysis:** AI automatically analyzes clothing type and suggests appropriate gender.
- **Customize Model:** Select or adjust gender, pose, body type, and skin tone.
- **Choose View Angle:** Select front, side, or back view for the virtual try-on.
- **Generate Model:** Click to generate an AI model with selected parameters.
- **Create Try-On:** Generate the virtual try-on from your chosen angle.
- **Download Image:** Save your virtual try-on image.

## Contributing
Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request. For major changes, open an issue first to discuss your ideas.

## License
This project is licensed under the MIT License.


# TryFit: AI Multi-Angle Virtual Try-On

🎯 **Live Demo:**  
[👉 Click here to view the live site](https://try-fit-main-2cu3z87p1-mandhalasushanths-projects.vercel.app)

---


## Credits
- Built by [Your Name/Team]
- Powered by Google Gemini AI and Genkit
- UI components by Radix UI

---
For questions or support, please open an issue or contact the maintainer.
