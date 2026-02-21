# 🏥 HealthQ - Next-Gen Clinical AI Platform

HealthQ is a comprehensive, modern healthcare platform designed to streamline the patient experience, empower medical providers, and intelligently manage hospital traffic.

Powered by advanced AI for medical triage, wait-time forecasting, and smart scheduling, HealthQ bridges the gap between doctors and patients through a breathtaking, responsive interface and a highly scalable backend.

### 🌐 Live Demo: [https://health-q-three.vercel.app/](https://health-q-three.vercel.app/)

## 🏆 Team Abhiyanta

Built with ❤️ by **Team Abhiyanta**:
- **Piyush Lomte** - Full Stack Developer
- **Abhay Katre** - Full Stack Developer
- **Vinay Ninave** - Full Stack Developer

---

## 🚀 Key Features

### For Patients
- **Smart Appointment Booking**: Schedule appointments with an intelligent, dynamic UI that visually routes patients to the right specialist based on their symptoms.
- **AI Health Chatbot**: Pre-triage and get initial guidance through an empathetic AI powered by Google's Gemini-2.0-Flash.
- **Real-time Live Queue**: Track your position in the consultation queue live from your dashboard.
- **AI Triage & Report Analysis**: Instantly analyze blood test reports or ongoing symptoms.
- **Emergency ER Routing**: Instantly locate the nearest hospital in critical situations.

### For Providers (Doctors)
- **Live Queue Management**: Track active patients, call the next patient, and dynamically modify queue priority.
- **AI Wait Predictor**: Provides patients accurate wait times based on historical consultation durations and current load. 
- **Command Center Dashboard**: View upcoming appointments and historical data through smooth, responsive charts.

---

## 💻 Tech Stack

- **Frontend Environment**: React 18, Vite
- **Styling & UI**: Tailwind CSS (Native styling, zero external heavy UI libs), Lucide Icons, Framer Motion (Micro-animations)
- **State & Routing**: React Router DOM v6
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Realtime Subscriptions)
- **Authentication**: Supabase Auth (Email + Password / OAuth Support)
- **AI Integrations**: `@google/generative-ai` (Gemini 2.0 Flash)

---

## ☁️ Deployment to Vercel

HealthQ is designed to be easily deployed to Vercel with zero configuration required for the frontend setup, as Vite is natively supported.

### Step 1: Push to GitHub
Ensure all code from your local machine is pushed to your GitHub repository.

### Step 2: Import on Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
2. Select the GitHub repository where HealthQ is hosted.
3. Configure the Project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Add Environment Variables
Before clicking Deploy, expand the **Environment Variables** section and add the following keys exactly as they appear in your `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Step 4: Deploy
Click **Deploy**. Vercel will install the dependencies, build the React project, and automatically apply the routing rules defined in `vercel.json` (which ensures deep linking works correctly on a Single Page Application). 

---

## 🛠️ Local Development

To run the application locally on your machine:

1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` variables.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing
Contributions, issues, and feature requests are always welcome! Feel free to check the issues page.
