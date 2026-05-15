# Smart Food Redistribution Platform — Working Features

**Project:** MealBridge / The Living Network  
**Stack:** Java 17 + Spring Boot 3.2.4 (Backend) · React 18 (Frontend) · PostgreSQL · Leaflet Maps · Firebase Auth  
**Last Updated:** April 2026

---

## 1. Authentication & Registration

| Feature | Details |
|---------|---------|
| **Phone OTP via Firebase** | User enters phone → Firebase sends real SMS OTP → verified on frontend |
| **Firebase Test Numbers** | Test phone numbers work on free Spark plan (no billing needed) |
| **4-Step Registration** | Phone → OTP verify → Profile details → Set 6-digit PIN |
| **PIN-based Login** | Phone + 6-digit PIN → JWT token issued |
| **Auto-login after register** | After completing registration, user is automatically logged in |
| **Role-based routing** | DONOR → `/donor`, NGO → `/ngo`, VOLUNTEER → `/volunteer`, ADMIN → `/admin` |
| **JWT authentication** | All protected endpoints require Bearer token |
| **Account suspension check** | Suspended accounts blocked at login with clear message |
| **OTP shown in backend console** | OTP always printed to Spring Boot console for dev testing |

---

## 2. Donor Features

| Feature | Details |
|---------|---------|
| **Post food donation** | Food type, quantity, prep time, expiry time, pickup location |
| **Location picker** | Search address with autocomplete OR click on satellite map to drop pin |
| **GPS current location** | "Use my current location" button uses device GPS |
| **Address geocoding** | Address → lat/lng via Nominatim (free, no API key) |
| **Profile location saved** | Donor's lat/lng stored in DB, auto-inherited by food listings |
| **Food listing validation** | Expiry must be after prep time, not in past, not > 24h old |
| **Cancel listing** | Donor can cancel their own AVAILABLE listings |
| **Donation history** | Real-time list of all listings with status badges |
| **Donor stats** | Meals shared, CO2 offset estimate, active listings count |
| **Active pickups panel** | Shows food claimed by NGOs currently in progress |
| **Mark as Delivered** | Donor confirms food received → marks DELIVERED with optional note |
| **Auto-expire listings** | Scheduler runs every 15 min, expires stale AVAILABLE listings |
| **Profile management** | Update name, organization, address with map preview |

---

## 3. NGO Features

| Feature | Details |
|---------|---------|
| **Radius selector modal** | On first load: choose 5/10/15/20/25 km radius |
| **Change radius anytime** | "Change Radius" button always visible to reselect |
| **20km radius filter** | Backend filters listings by Haversine distance from NGO's GPS |
| **Smart nearby feed** | Listings sorted by distance first, then urgency (soonest expiry) |
| **Expiry urgency highlighting** | Green (>60 min), Orange (<60 min), Red pulsing (<15 min) |
| **Claim food listing** | NGO claims → PickupRequest created automatically |
| **Reject pickup request** | NGO can reject PENDING requests → listing reverts to AVAILABLE |
| **My pickup requests** | List of all NGO's requests with status and volunteer info |
| **Live satellite map** | OpenStreetMap + Esri satellite tiles, toggle street/satellite |
| **Donor pins on map** | Color-coded markers by urgency, click for food details + Claim button |
| **Get Route & ETA** | Shows road route, distance, travel time from NGO to donor |
| **Blue route line** | Google Maps-style blue polyline following real roads (OSRM) |
| **Open in Google Maps** | One-click to open turn-by-turn navigation |
| **WebSocket live updates** | New listing notification appears instantly without page refresh |
| **Real-time stats** | Available count, active requests, deliveries completed |

---

## 4. Volunteer Features

| Feature | Details |
|---------|---------|
| **Task Market** | Browse all PENDING pickup requests available to accept |
| **Accept task** | Volunteer accepts → status changes to ASSIGNED |
| **Active task display** | Shows current pickup: food type, pickup location, NGO name |
| **Confirm Pickup** | ASSIGNED → PICKED_UP with one click |
| **Confirm Delivery** | PICKED_UP → DELIVERED with one click |
| **All assignments list** | Full history of accepted tasks with status |
| **Get Route & ETA** | Route from volunteer's location to donor pickup point |
| **Delivery count** | Sidebar shows total completed deliveries |

---

## 5. Map Features

| Feature | Details |
|---------|---------|
| **Satellite map tiles** | Esri World Imagery (free, high-res satellite) |
| **Street map tiles** | OpenStreetMap (free, detailed road map) |
| **Toggle satellite/street** | Button to switch between map modes |
| **Donor location pins** | Custom SVG markers with food emoji, color by urgency |
| **Auto-fit bounds** | Map auto-zooms to show all markers |
| **Address autocomplete** | Type address → live suggestions from Nominatim |
| **Click-to-pin** | Click anywhere on map → drops pin + reverse geocodes address |
| **Route calculation** | OSRM (free) calculates shortest road route |
| **Blue route polyline** | White border + blue line (Google Maps style) |
| **Distance label on route** | Floating label showing "X km · Y min" on the route line |
| **Distance & ETA panel** | Shows km by road + estimated travel time by car |
| **Geocoding fallback** | If OSRM fails, shows straight-line distance estimate |

---

## 6. Admin Features

| Feature | Details |
|---------|---------|
| **Live analytics dashboard** | Total meals saved, deliveries, active donors/NGOs/volunteers |
| **User management table** | All users with name, phone, role, status, join date |
| **Approve user** | Change status to ACTIVE |
| **Suspend user** | Change status to SUSPENDED |
| **Verify organization** | Mark donor/NGO organization as verified |
| **All food listings** | Table of every listing with donor, status, date |
| **All pickup requests** | Table of every pickup with NGO, volunteer, status |
| **Activity feed** | Recent registrations, listings, and pickups in real time |
| **Tab navigation** | Overview / Users / Listings / Pickups tabs |

---

## 7. Backend & System Features

| Feature | Details |
|---------|---------|
| **Role-based access control** | DONOR/NGO/VOLUNTEER/ADMIN endpoints strictly separated |
| **JWT with role claim** | Role embedded in token, no DB hit per request |
| **BCrypt PIN hashing** | 6-digit PIN stored as BCrypt hash, never plain text |
| **WebSocket notifications** | STOMP over SockJS at `/ws`, topics per role |
| **Delivery audit log** | Every status transition recorded with actor + timestamp |
| **Ratings system** | NGO rates donor 1-5 after delivery |
| **Auto-suspend on bad ratings** | Donor auto-suspended after 3+ bad ratings (score ≤ 2) |
| **Donor delivery confirmation** | Donor marks food as delivered from their dashboard |
| **Pickup rejection** | NGO rejects → listing reverts to AVAILABLE for others |
| **Global exception handler** | Structured JSON error responses for all exceptions |
| **DB migration runner** | Auto-fixes schema on startup (email/password nullable) |
| **Public analytics endpoint** | `/api/analytics/public` — no auth required, for landing page |

---

## 8. Landing Page

| Feature | Details |
|---------|---------|
| **Hero section** | Full design with CTA buttons linking to register |
| **Live stats** | Meals redistributed pulled from real DB via public API |
| **How it works** | 3-step process with images |
| **Mission section** | SDG 2 Zero Hunger content |
| **Testimonials** | Partner quotes section |
| **Footer** | Links, social icons, copyright |
| **Glassmorphism navbar** | Sticky top nav with login/register or dashboard link |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2.4, Spring Security, JWT |
| Database | PostgreSQL (Supabase) with Hibernate auto-DDL |
| Real-time | WebSocket (STOMP + SockJS) |
| Frontend | React 18, React Router v6, Axios, Tailwind CSS (CDN) |
| Maps | Leaflet + react-leaflet v4, OpenStreetMap, Esri Satellite |
| Routing | OSRM (free road routing) |
| Geocoding | Nominatim (free address search) |
| Auth OTP | Firebase Phone Auth (test numbers on free plan) |
| SMS | Firebase (requires Blaze plan for real SMS) |
