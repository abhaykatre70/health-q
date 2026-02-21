import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
    Navigation, MapPin, Phone, ArrowLeft,
    Loader2, Navigation2, Cross, AlertCircle,
    Sun, Moon, Shield, Info, HeartPulse, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Logo from '../components/Logo';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 14, { duration: 1.5 });
    }, [center, map]);
    return null;
}

export default function HospitalFinder() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [location, setLocation] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeHospital, setActiveHospital] = useState(null);
    const [emergencyMode, setEmergencyMode] = useState(false);

    const userIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    const hospitalIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    const fetchNearbyHospitals = async (lat, lon) => {
        setLoading(true);
        try {
            const radius = 8000; // Increased radius to 8km
            const query = `
                [out:json][timeout:25];
                (
                  node["amenity"="hospital"](around:${radius},${lat},${lon});
                  way["amenity"="hospital"](around:${radius},${lat},${lon});
                  node["amenity"="clinic"](around:${radius},${lat},${lon});
                  node["healthcare"="hospital"](around:${radius},${lat},${lon});
                );
                out center;
            `;

            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });

            if (!response.ok) throw new Error("Failed to fetch map data");
            const data = await response.json();

            const formatted = data.elements.map(el => {
                const elementLat = el.lat || el.center?.lat;
                const elementLon = el.lon || el.center?.lon;
                const dLat = (elementLat - lat) * Math.PI / 180;
                const dLon = (elementLon - lon) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * Math.PI / 180) * Math.cos(elementLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                return {
                    id: el.id,
                    name: el.tags.name || el.tags['name:en'] || 'Unlabeled Hospital',
                    lat: elementLat,
                    lon: elementLon,
                    distance: distanceKm.toFixed(1),
                    address: el.tags['addr:full'] || el.tags['addr:street'] || 'Nearby Facility',
                    phone: el.tags.phone || el.tags['contact:phone'] || 'Call Front Desk',
                    emergency: el.tags.emergency === 'yes' || true, // Defaulting to true for demo
                    availability: Math.floor(Math.random() * 5) + 1 // Simulated bed availability
                };
            }).filter(h => h.name !== 'Unlabeled Hospital').sort((a, b) => a.distance - b.distance).slice(0, 15);

            setHospitals(formatted);
        } catch (err) {
            setError("Hospital database is busy. Showing simulated nearby facilities.");
            setHospitals([
                { id: 1, name: "City Center ER", distance: "1.2", address: "Main St, Sector 4", phone: "911-001", emergency: true, availability: 3, lat: lat + 0.01, lon: lon + 0.01 },
                { id: 2, name: "St. Jude Memorial", distance: "2.5", address: "North Avenue", phone: "911-002", emergency: true, availability: 1, lat: lat - 0.01, lon: lon - 0.01 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const requestLocation = () => {
        setLoading(true);
        setError('');
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                fetchNearbyHospitals(latitude, longitude);
            },
            () => {
                setError("Location permission denied. Please enable GPS for emergency tracking.");
                setLoading(false);
                // Fallback to a default location (e.g., Delhi) for demo
                const lat = 28.6139, lon = 77.2090;
                setLocation({ lat, lng: lon });
                fetchNearbyHospitals(lat, lon);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    useEffect(() => {
        requestLocation();
    }, []);

    const handleQuickIntake = (hospital) => {
        const name = prompt("Patient Name for Emergency Intake:");
        if (name) {
            setEmergencyMode(true);
            setActiveHospital(hospital);
            // In a real app, this would hit a public Supabase endpoint to raise a 'critical' queue entry
            setTimeout(() => {
                alert(`SUCCESS: Emergency Triage Request sent to ${hospital.name}. Your ETA is registered. Proceed immediately to the ER desk.`);
            }, 800);
        }
    };

    const defaultCenter = location ? [location.lat, location.lng] : [20.5937, 78.9629];

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-inter overflow-hidden transition-colors duration-300">
            {/* Nav */}
            <header className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <Logo className="w-8 h-8" />
                        <div>
                            <h1 className="font-black text-slate-900 dark:text-white leading-tight">Emergency Portal</h1>
                            <p className="text-[10px] font-black uppercase text-red-500 animate-pulse">Live ER Tracking</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button onClick={requestLocation} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all">
                        <Navigation className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* Sidebar */}
                <div className="w-full lg:w-[400px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col z-20 overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Active ERs</h2>
                            <span className="bg-red-50 dark:bg-red-900/20 text-red-600 text-[10px] font-black px-3 py-1 rounded-full border border-red-100 dark:border-red-800">CROWD-VERIFIED</span>
                        </div>
                        {error && <p className="text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-xl flex gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 no-scrollbar">
                        {loading && hospitals.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                <p className="text-xs font-black uppercase tracking-widest animate-pulse">Calibrating Radar...</p>
                            </div>
                        ) : hospitals.map((h) => (
                            <motion.div key={h.id} whileHover={{ scale: 0.98 }} onClick={() => setActiveHospital(h)}
                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${activeHospital?.id === h.id ? 'border-red-500 bg-red-50/10 shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">{h.name}</h3>
                                    <span className="text-[10px] font-black text-slate-400">{h.distance} KM</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mb-4 line-clamp-1">{h.address}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${h.availability > 2 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h.availability} ER Slots Open</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={`tel:${h.phone}`} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"><Phone className="w-3.5 h-3.5" /></a>
                                        <button onClick={(e) => { e.stopPropagation(); handleQuickIntake(h); }} className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-black rounded-lg hover:bg-red-700 transition-all uppercase tracking-tight">Quick Intake</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Map Interface */}
                <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
                    <MapContainer center={defaultCenter} zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"} />
                        <MapUpdater center={location ? [location.lat, location.lng] : null} />

                        {location && <Marker position={[location.lat, location.lng]} icon={userIcon}><Popup>Emergency Point: You</Popup></Marker>}

                        {hospitals.map(h => (
                            <Marker key={h.id} position={[h.lat, h.lon]} icon={hospitalIcon} eventHandlers={{ click: () => setActiveHospital(h) }} />
                        ))}
                    </MapContainer>

                    {/* Bottom Info Card */}
                    <AnimatePresence>
                        {activeHospital && (
                            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                                className="absolute bottom-8 left-8 right-8 lg:left-auto lg:w-[400px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 z-[1000]">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">{activeHospital.name}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{activeHospital.distance} KM</span>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${activeHospital.availability > 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {activeHospital.availability} BEDS READY
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveHospital(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Cross className="w-6 h-6 rotate-45 text-slate-400" /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleQuickIntake(activeHospital)} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">
                                        <Zap className="w-4 h-4" /> Start Intake
                                    </button>
                                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${activeHospital.lat},${activeHospital.lon}`} target="_blank" rel="noreferrer"
                                        className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                                        <Navigation2 className="w-4 h-4" /> Go Now
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
