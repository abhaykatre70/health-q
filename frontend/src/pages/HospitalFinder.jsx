import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Navigation, MapPin, Phone, Star, ArrowLeft, Loader2, Navigation2, Cross, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

// Component to dynamically re-center map
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 14, { duration: 1.5 });
    }, [center, map]);
    return null;
}

export default function HospitalFinder() {
    const navigate = useNavigate();
    const [location, setLocation] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeHospital, setActiveHospital] = useState(null);

    // Custom icons
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
            // Overpass API query: find amenities=hospital or clinic within 5km radius
            const radius = 5000;
            const query = `
                [out:json][timeout:25];
                (
                  node["amenity"="hospital"](around:${radius},${lat},${lon});
                  way["amenity"="hospital"](around:${radius},${lat},${lon});
                  node["amenity"="clinic"](around:${radius},${lat},${lon});
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

                // Calculate rough distance in km (Haversine approximation for short distances)
                const dLat = (elementLat - lat) * Math.PI / 180;
                const dLon = (elementLon - lon) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * Math.PI / 180) * Math.cos(elementLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                return {
                    id: el.id,
                    name: el.tags.name || 'Unknown Medical Center',
                    lat: elementLat,
                    lon: elementLon,
                    distance: distanceKm.toFixed(1),
                    address: el.tags['addr:full'] || el.tags['addr:street'] || 'Address unavailable',
                    phone: el.tags['phone'] || el.tags['contact:phone'] || null,
                    emergency: el.tags['emergency'] === 'yes'
                };
            }).filter(h => h.name !== 'Unknown Medical Center').sort((a, b) => a.distance - b.distance).slice(0, 15); // Top 15 closest

            setHospitals(formatted);
        } catch (err) {
            setError("Could not load hospital data. The free Overpass API might be rate-limited right now.");
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
            (error) => {
                setError("Location access denied. Please enable location permissions to find nearby hospitals.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const defaultCenter = location ? [location.lat, location.lng] : [20.5937, 78.9629]; // Default to center of India

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-inter overflow-hidden">
            {/* Header */}
            <header className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 shadow-sm relative">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <Logo className="w-8 h-8" />
                        <div>
                            <h1 className="font-black text-slate-900 leading-tight">Nearby Hospitals</h1>
                            <p className="text-xs font-semibold text-slate-500">Live emergency routing & capacity</p>
                        </div>
                    </div>
                </div>
                {!location && !loading && (
                    <button onClick={requestLocation}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
                        <Navigation className="w-4 h-4" /> Locate Me
                    </button>
                )}
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row relative z-10">
                {/* Left Sidebar: List */}
                <div className="w-full lg:w-[400px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl lg:shadow-none h-[40vh] lg:h-full">
                    <div className="p-5 border-b border-slate-100 flex-none bg-slate-50/50">
                        <h2 className="font-black text-lg text-slate-900 mb-1">Results within 5km</h2>
                        <p className="text-xs text-slate-500 font-medium">Powered by OpenStreetMap live data.</p>

                        {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {loading && hospitals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <p className="text-sm font-bold">Scanning area...</p>
                            </div>
                        ) : !location && hospitals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 pb-12 space-y-4">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                                    <MapPin className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-slate-900 font-bold mb-1">Location required</p>
                                    <p className="text-sm text-slate-500 font-medium">HealthQ needs your location to route you to the nearest open ER or clinic.</p>
                                </div>
                                <button onClick={requestLocation} className="mt-2 w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">
                                    Enable Location
                                </button>
                            </div>
                        ) : hospitals.length === 0 && location && !loading ? (
                            <div className="p-8 text-center text-slate-500 font-medium text-sm">No hospitals found within 5km of your location.</div>
                        ) : (
                            hospitals.map((h) => (
                                <div key={h.id}
                                    onClick={() => setActiveHospital(h)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${activeHospital?.id === h.id ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400' : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-slate-900 text-sm leading-tight pr-2">{h.name}</h3>
                                        <span className="shrink-0 bg-slate-100 text-slate-600 font-black text-[10px] px-2 py-0.5 rounded-full">{h.distance} km</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium truncate mb-3">{h.address}</p>
                                    <div className="flex items-center gap-2">
                                        {h.emergency && <span className="text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-center">24/7 ER</span>}
                                        {h.phone && <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"><Phone className="w-3 h-3" /> {h.phone}</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Map Area */}
                <div className="flex-1 relative z-10 bg-slate-100 h-[60vh] lg:h-full">
                    <MapContainer center={defaultCenter} zoom={location ? 14 : 5} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Clean, modern basemap
                        />
                        <MapUpdater center={location ? [location.lat, location.lng] : null} />

                        {/* User Location Marker */}
                        {location && (
                            <Marker position={[location.lat, location.lng]} icon={userIcon}>
                                <Popup>
                                    <div className="font-bold font-inter text-blue-700">You are here</div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Hospital Markers */}
                        {hospitals.map(h => (
                            <Marker
                                key={h.id}
                                position={[h.lat, h.lon]}
                                icon={hospitalIcon}
                                eventHandlers={{ click: () => setActiveHospital(h) }}
                            >
                                {activeHospital?.id === h.id && (
                                    <Popup>
                                        <div className="font-inter">
                                            <p className="font-black text-slate-900 text-sm mb-1">{h.name}</p>
                                            <p className="text-xs text-slate-500 mb-2">{h.distance} km away</p>
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`} target="_blank" rel="noreferrer"
                                                className="block w-full text-center bg-blue-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                                                Get Directions
                                            </a>
                                        </div>
                                    </Popup>
                                )}
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Active Hospital Floating Card (Mobile) */}
                    <AnimatePresence>
                        {activeHospital && (
                            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                                className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-[500] font-inter">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black text-lg text-slate-900 leading-tight pr-4">{activeHospital.name}</h3>
                                    <button onClick={() => setActiveHospital(null)} className="p-1 -mr-2 -mt-2 text-slate-400 hover:text-slate-900 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors shrink-0">
                                        <Cross className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{activeHospital.distance} km</span>
                                    {activeHospital.emergency && <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-red-100 text-red-700 rounded text-center">ER</span>}
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-5">{activeHospital.address}</p>

                                <div className="flex gap-2">
                                    <button onClick={() => navigate('/book')} className="flex-1 bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors text-center shadow-md">
                                        Book Slot
                                    </button>
                                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${activeHospital.lat},${activeHospital.lon}`} target="_blank" rel="noreferrer"
                                        className="flex-1 bg-blue-600 text-white text-xs font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20">
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
