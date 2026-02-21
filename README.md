# 🏥 HealthQ - Next-Gen Clinical AI Platform

HealthQ is a comprehensive, modern healthcare platform designed to streamline the patient experience, empower medical providers, and intelligently manage hospital traffic.

Powered by advanced AI for medical triage, wait-time forecasting, and smart scheduling, HealthQ bridges the gap between doctors and patients through a breathtaking, responsive interface and a highly scalable backend.

### 🌐 Live Demo: <a href="https://health-q-three.vercel.app/" target="_blank" rel="noopener noreferrer">https://health-q-three.vercel.app/</a>

---

## 🏆 HackWhack 3.0 - 2nd Runner Up

**Team Abhiyanta** proudly secured the **2nd Runner Up** position at **HackWhack 3.0**, hosted at SBJITMR Nagpur. 

Competing against approximately **450 students** in an intense 24-hour hackathon, our 3-member team successfully cleared the first round (PPT presentation) and spent the full night coding to deliver this fully working prototype. The project features a complete backend integration, automated AI services, secure authentication, and deployment best practices, effectively solving real-world clinical coordination challenges.

### Built with ❤️ by Team Abhiyanta:
- **[Abhay Katre](https://github.com/abhaykatre70)** - Full Stack Developer
- **[Vinay Ninave](https://github.com/ninavevinay)** - Full Stack Developer
- **[Piyush Lomte](https://github.com/piyushlomte)** - Full Stack Developer

---

## 🚀 Key Features

### For Patients
- **Smart Appointment Booking**: Schedule appointments with an intelligent, dynamic UI that visually routes patients to the right specialist based on their symptoms.
- **AI Health Chatbot**: Pre-triage and get initial guidance through an empathetic AI powered by Groq & LLaMA.
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
- **AI Integrations**: Groq Cloud API & OpenAI (LLaMA-3.3-70b & GPT-4o-mini)

---

## 🛠️ Local Development

To run the HealthQ application locally on your machine:

1. Clone the repository and navigate to the frontend directory:
   ```bash
   git clone https://github.com/abhaykatre70/health-q.git
   cd health-q/frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` variables in the `frontend` folder:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_GROQ_API_KEY=your_groq_api_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing
Contributions, issues, and feature requests are always welcome! Feel free to check the issues page.
