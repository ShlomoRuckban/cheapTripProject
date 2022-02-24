import L from 'leaflet';
import airport from "./airport.png"
const airportIcon = new L.Icon({
    iconUrl:airport,
    iconRetinaUrl: airport,
    iconAnchor: null,
    popupAnchor: null,
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null,
    iconSize: new L.Point(40, 40),
});
export default airportIcon;