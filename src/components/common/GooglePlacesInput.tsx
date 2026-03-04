import React, { useEffect, useRef, useState } from 'react';
import { Input } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

export interface PlaceResult {
  area: string;
  community: string;
  city: string;
  placeId: string;
  fullAddress: string;
}

interface GooglePlacesInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onPlaceSelect?: (place: PlaceResult) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const GooglePlacesInput: React.FC<GooglePlacesInputProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search Dubai areas...',
  style,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value || '');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    if (typeof google === 'undefined' || !google.maps?.places) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ae' },
      types: ['geocode', 'establishment'],
      fields: ['place_id', 'address_components', 'formatted_address', 'name'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.address_components) return;

      let area = '';
      let community = '';
      let city = '';

      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes('sublocality_level_1') || types.includes('neighborhood')) {
          community = component.long_name;
        }
        if (types.includes('sublocality_level_2') || types.includes('sublocality')) {
          if (!area) area = component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1') && !city) {
          city = component.long_name;
        }
      }

      if (!area) area = community || place.name || '';
      if (!community) community = area;

      const displayValue = community || place.formatted_address || '';
      setInputValue(displayValue);
      onChange?.(displayValue);
      onPlaceSelect?.({
        area: area,
        community: community,
        city: city || 'Dubai',
        placeId: place.place_id || '',
        fullAddress: place.formatted_address || '',
      });
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [apiKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange?.(e.target.value);
  };

  // If no API key, render a plain searchable input
  if (!apiKey) {
    return (
      <Input
        prefix={<EnvironmentOutlined style={{ color: '#8c8c8c' }} />}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        style={style}
        allowClear
      />
    );
  }

  return (
    <Input
      ref={(node) => {
        inputRef.current = node?.input ?? null;
      }}
      prefix={<EnvironmentOutlined style={{ color: '#8c8c8c' }} />}
      placeholder={placeholder}
      value={inputValue}
      onChange={handleChange}
      style={style}
      allowClear
    />
  );
};

export default GooglePlacesInput;
