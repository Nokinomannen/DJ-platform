"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Avatar } from "@/components/avatar";
import { Rating } from "@/components/stars";
import { categoryLabel } from "@/lib/constants";
import { formatSek } from "@/lib/format";
import type { Bounds } from "@/lib/geo";
import type { ArtistCardData } from "@/lib/queries";

const SWEDEN_CENTER: L.LatLngTuple = [62, 16];

type Props = {
  artists: ArtistCardData[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  /** Area the user searched with "Search this area"; the map keeps that view instead of fitting results. */
  searchedBounds: Bounds | null;
  /** Changes whenever the result set comes from a new search, so the map re-fits. */
  fitKey: string;
  onSearchArea: (bounds: Bounds) => void;
  visible: boolean;
};

function priceIcon(artist: ArtistCardData, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="price-pin${active ? " price-pin-active" : ""}">${formatSek(artist.hourlyRate)}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

type MoveFlag = { current: boolean };

function FitToResults({
  artists,
  fitKey,
  searchedBounds,
  programmaticRef,
}: Pick<Props, "artists" | "fitKey" | "searchedBounds"> & { programmaticRef: MoveFlag }) {
  const map = useMap();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastKey.current === fitKey) return;
    lastKey.current = fitKey;
    // Non-animated fitBounds fires its move events synchronously, so the flag covers them.
    programmaticRef.current = true;
    if (searchedBounds) {
      map.fitBounds(
        [
          [searchedBounds.south, searchedBounds.west],
          [searchedBounds.north, searchedBounds.east],
        ],
        { animate: false },
      );
    } else if (artists.length > 0) {
      const bounds = L.latLngBounds(artists.map((a) => [a.mapLat, a.mapLng] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12, animate: false });
    }
    programmaticRef.current = false;
  }, [map, artists, fitKey, searchedBounds, programmaticRef]);

  return null;
}

function SearchAreaControl({ onSearchArea, programmaticRef }: Pick<Props, "onSearchArea"> & { programmaticRef: MoveFlag }) {
  const [moved, setMoved] = useState(false);
  const map = useMapEvents({
    moveend: () => {
      if (!programmaticRef.current) setMoved(true);
    },
  });

  if (!moved) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center">
      <button
        type="button"
        onClick={() => {
          const b = map.getBounds();
          setMoved(false);
          onSearchArea({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
        }}
        className="pointer-events-auto rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-xl"
      >
        Search this area
      </button>
    </div>
  );
}

function ResizeWhenShown({ visible, programmaticRef }: { visible: boolean; programmaticRef: MoveFlag }) {
  const map = useMap();
  useEffect(() => {
    if (!visible) return;
    programmaticRef.current = true;
    map.invalidateSize({ animate: false });
    programmaticRef.current = false;
  }, [map, visible, programmaticRef]);
  return null;
}

export default function MapView({ artists, activeId, onSelect, searchedBounds, fitKey, onSearchArea, visible }: Props) {
  const programmaticRef = useRef(false);
  const icons = useMemo(
    () => new Map(artists.map((a) => [a.id, { normal: priceIcon(a, false), active: priceIcon(a, true) }])),
    [artists],
  );

  return (
    <MapContainer center={SWEDEN_CENTER} zoom={5} className="size-full" zoomControl scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <FitToResults artists={artists} fitKey={fitKey} searchedBounds={searchedBounds} programmaticRef={programmaticRef} />
      <SearchAreaControl onSearchArea={onSearchArea} programmaticRef={programmaticRef} />
      <ResizeWhenShown visible={visible} programmaticRef={programmaticRef} />
      {artists.map((artist) => {
        const active = artist.id === activeId;
        return (
          <Marker
            key={artist.id}
            position={[artist.mapLat, artist.mapLng]}
            icon={active ? icons.get(artist.id)!.active : icons.get(artist.id)!.normal}
            zIndexOffset={active ? 1000 : 0}
            eventHandlers={{
              click: () => onSelect(artist.id),
              popupclose: () => onSelect(null),
            }}
          >
            <Popup closeButton={false} offset={[0, -8]} className="artist-popup">
              <Link href={`/artists/${artist.slug}`} className="block w-60 overflow-hidden rounded-2xl bg-card text-foreground">
                <Avatar
                  name={artist.displayName}
                  hue={artist.avatarHue}
                  imageKey={artist.imageKey}
                  className="aspect-[16/9] w-full"
                  textClassName="text-3xl"
                />
                <div className="space-y-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">{artist.displayName}</p>
                    <Rating value={artist.avgRating} count={artist.reviewCount} />
                  </div>
                  <p className="text-xs text-muted">
                    {categoryLabel(artist.category)} · {artist.city}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">{formatSek(artist.hourlyRate)}</span>
                    <span className="text-muted">/hr</span>
                  </p>
                </div>
              </Link>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
