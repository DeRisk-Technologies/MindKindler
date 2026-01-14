// src/components/maps/SchoolsMap.tsx
"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail } from 'lucide-react';

// Fix Leaflet Icon
const icon = L.icon({
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface SchoolsMapProps {
    schools: any[];
}

export function SchoolsMap({ schools }: SchoolsMapProps) {
    // Default to London or first school
    const center = schools[0]?.address?.coordinates || { lat: 51.505, lng: -0.09 };

    return (
        <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={false} style={{ height: "400px", width: "100%", borderRadius: "0.5rem" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {schools.map(school => (
                <Marker 
                    key={school.id} 
                    position={[school.address.coordinates?.lat || 51.5, school.address.coordinates?.lng || -0.1]} 
                    icon={icon}
                >
                    <Popup>
                        <div className="p-1">
                            <h3 className="font-bold text-sm">{school.name}</h3>
                            <div className="text-xs text-slate-500 mb-2">{school.address.street}</div>
                            
                            <div className="flex gap-1 mb-2">
                                {school.stats?.activeCases > 0 && <Badge variant="destructive" className="text-[10px]">{school.stats.activeCases} Alerts</Badge>}
                                <Badge variant="secondary" className="text-[10px]">{school.stats?.studentsOnRoll || 0} Students</Badge>
                            </div>

                            {school.senco?.name && (
                                <div className="bg-slate-50 p-2 rounded border text-xs">
                                    <strong>SENCO:</strong> {school.senco.name}
                                    <div className="flex gap-2 mt-1">
                                        {school.senco.phone && <a href={`tel:${school.senco.phone}`}><Phone className="w-3 h-3 text-slate-400 hover:text-green-600"/></a>}
                                        {school.senco.email && <a href={`mailto:${school.senco.email}`}><Mail className="w-3 h-3 text-slate-400 hover:text-blue-600"/></a>}
                                    </div>
                                </div>
                            )}
                            
                            <Button size="sm" variant="link" className="px-0 text-xs w-full mt-1">View Profile</Button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
