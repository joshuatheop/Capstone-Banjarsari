// Minimal contract for the Leaflet methods used by the two map widgets.
export interface LeafletMap {
  setView: (point: [number, number], zoom: number) => LeafletMap;
  panTo: (point: [number, number]) => LeafletMap;
  on: (event: 'click', callback: (event: { latlng: { lat: number; lng: number } }) => void) => LeafletMap;
  remove: () => void;
}
export interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  getLatLng: () => { lat: number; lng: number };
  setLatLng: (point: [number, number]) => LeafletMarker;
  on: (event: 'dragend', callback: () => void) => LeafletMarker;
  bindPopup: (content: HTMLElement) => LeafletMarker;
  openPopup: () => LeafletMarker;
}
export interface LeafletApi {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
  icon: (options: Record<string, unknown>) => object;
  marker: (point: [number, number], options: Record<string, unknown>) => LeafletMarker;
}
declare global { interface Window { L?: LeafletApi } }
