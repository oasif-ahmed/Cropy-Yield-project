import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../i18n/LanguageContext.jsx';

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) });
    },
  });
  return null;
}

export default function MapPicker({ lat, lng, onChange, height = 240 }) {
  const { t } = useLanguage();
  const center = lat != null && lng != null ? [Number(lat), Number(lng)] : [23.81, 90.41];
  return (
    <div>
      <MapContainer center={center} zoom={lat != null ? 11 : 7} style={{ height, width: '100%', borderRadius: '0.5rem' }} scrollWheelZoom={false}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler
          onPick={(p) => onChange(p)}
        />
        {lat != null && lng != null && <CircleMarker center={[Number(lat), Number(lng)]} radius={8} pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.8 }} />}
      </MapContainer>
      <p className="mt-1 text-xs text-gray-500">{t('ম্যাপে ক্লিক করে জমির অবস্থান চিহ্নিত করুন', 'Click on the map to mark the land location')}</p>
    </div>
  );
}
