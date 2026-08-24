'use client';

import {ChangeEvent, KeyboardEvent, useState} from 'react';
import {filterCities} from '@/lib/cities';

type CityPickerProps = {
  id: string;
  label: string;
  cities: string[];
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
};

export const CityPicker = ({
  id,
  label,
  cities,
  value,
  onChange,
  placeholder,
}: CityPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = `${id}-listbox`;
  const suggestions = filterCities(cities, value);

  const selectCity = (city: string) => {
    onChange(city);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(current =>
        current < suggestions.length - 1 ? current + 1 : 0,
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(current =>
        current > 0 ? current - 1 : suggestions.length - 1,
      );
      return;
    }
    if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      event.preventDefault();
      selectCity(suggestions[activeIndex]);
      return;
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleBlur = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="field combobox">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        autoComplete="off"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required
      />
      {isOpen ? (
        <ul className="combobox-list" id={listId} role="listbox">
          {suggestions.length === 0 ? (
            <li className="combobox-empty">Nenhuma cidade encontrada</li>
          ) : (
            suggestions.map((city, index) => (
              <li
                key={city}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={
                  index === activeIndex
                    ? 'combobox-option combobox-option--active'
                    : 'combobox-option'
                }
                onMouseDown={event => {
                  event.preventDefault();
                  selectCity(city);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {city}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
};
