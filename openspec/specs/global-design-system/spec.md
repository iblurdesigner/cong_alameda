# Global Design System Specification

## Purpose

Definir los tokens de diseño, geometría, paleta de colores y patrones de componentes de la aplicación Congregación Alameda basándose en la estética minimalista Calescence.

## Requirements

### Requirement: Calescence Modern Minimalist Design System

The system SHALL enforce a modern minimalist design aesthetic ("Calescence" style) across the entire web application, including a soft neutral background (`#f3f4f8`), rounded floating cards (`24px`), dark contrast cards (`#121316`), electric neon lime (`#c4f82a`) and electric blue (`#2563eb`) accents, floating pill navigation bars, and modern typography.

#### Scenario: Displaying floating layout and rounded card surfaces
- GIVEN a user opens any page in the application
- WHEN the layout renders
- THEN the system MUST display a soft neutral canvas background (`#f3f4f8` in light mode or deep dark charcoal `#0c0e12` in dark mode)
- AND all main content cards MUST feature smooth rounded corners (`20px` to `24px`) with soft floating shadows
- AND the sidebar navigation MUST be styled as an elevated floating vertical pill rail with rounded action icons.

#### Scenario: Accent highlights and pill badges
- GIVEN interactive elements, metrics, or badges are rendered
- WHEN the component is displayed
- THEN active tabs or primary actions MUST use electric blue pills or dark high-contrast badges
- AND stat highlights or trend indicators MAY feature high-visibility lime green accents (`#c4f82a`).
