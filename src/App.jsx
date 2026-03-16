import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Globe, ArrowRight, RefreshCw, Calculator, CheckCircle,
  TrendingUp, Briefcase, MapPin, ChevronDown, Sparkles,
  Plane, BarChart3, Building2, Search, Info, ExternalLink,
  DollarSign, Link, Check
} from 'lucide-react';

// ---------------------------------------------------------------------------
// STATIC FX RATES — fallback if live API is unavailable (1 USD = X units)
// ---------------------------------------------------------------------------
const STATIC_FX_RATES = {
  USD:1,    CAD:1.36, MXN:17.2, GTQ:7.82, BZD:2.0,  HNL:24.7,
  NIO:36.5, CRC:530,  HTG:132,  DOP:57,   JMD:155,  TTD:6.78,
  BSD:1.0,  BBD:2.0,  CUP:24,   GYD:209,  SRD:36,   VES:36,
  COP:3960, PEN:3.71, BRL:4.95, BOB:6.91, PYG:7350, UYU:39.5,
  ARS:850,  CLP:915,
  GBP:0.79, EUR:0.92, CHF:0.90, SEK:10.5, NOK:10.7, DKK:6.90,
  ISK:138,  PLN:4.03, CZK:23.2, HUF:355,  RON:4.58, BGN:1.80,
  RSD:107,  BAM:1.80, ALL:93,   MKD:57,   MDL:17.8, UAH:38.5,
  BYN:3.25, RUB:91,   HRK:7.08, SKK:30.1,
  ILS:3.72, SAR:3.75, AED:3.67, QAR:3.64, KWD:0.307,
  BHD:0.377,OMR:0.385,JOD:0.71, LBP:89500,IQD:1310,
  IRR:42000,TRY:32.0, SYP:13000,YER:250,
  EGP:30.9, LYD:4.82, TND:3.12, DZD:134,  MAD:10.1,
  SDG:600,  SSP:650,  ETB:56,   ERN:15,   DJF:178,  SOS:570,
  KES:152,  TZS:2520, UGX:3800, RWF:1270, BIF:2850,
  GHS:12.5, NGN:1350, XOF:604,  XAF:604,  GNF:8600,
  GMD:67,   SLL:20900,LRD:190,  CVE:101,  STN:22.5,
  ZAR:18.8, NAD:18.8, BWP:13.5, LSL:18.8, SZL:18.8,
  ZWL:320,  MZN:63.7, MWK:1700, ZMW:26,   AOA:830,
  CDF:2750, KMF:453,  MGA:4500, MUR:44.5, SCR:13.5,
  KZT:450,  UZS:12300,KGS:89,   TJS:10.9, TMT:3.50,
  AFN:71,   AMD:400,  AZN:1.70, GEL:2.65, MNT:3420,
  CNY:7.24, JPY:149.5,KRW:1330, TWD:31.8, HKD:7.82,
  SGD:1.34, MYR:4.68, THB:35.8, VND:24400,PHP:56.7,
  IDR:15600,KHR:4100, MMK:2100, LAK:20700,BDT:110,
  INR:83.3, PKR:279,  LKR:315,  NPR:133,  BTN:83.3,
  MVR:15.4, KPW:900,  AUD:1.55, NZD:1.64, PGK:3.73,
  FJD:2.24, BND:1.34,
};
const FX_API_URL = 'https://open.er-api.com/v6/latest/USD';
const IP_API_URLS  = ['https://ipapi.co/json/', 'https://ipwho.is/'];
const IP_CACHE_KEY = 'comppass_ip';
const IP_CACHE_TTL = 86_400_000; // 24 hours

// ---------------------------------------------------------------------------
// DATA — world countries with estimated employer payroll burden rates
// ---------------------------------------------------------------------------
const COUNTRIES = [
  // ── North America ──
  { id:'US', name:'United States',          iso:'US', lat: 38.0, lng: -97.0, burdenRate:0.120, fixedBenefits:1400, currency:'USD', symbol:'$',   flag:'🇺🇸' },
  { id:'CA', name:'Canada',                 iso:'CA', lat: 56.1, lng:-106.3, burdenRate:0.130, fixedBenefits:1200, currency:'CAD', symbol:'C$',  flag:'🇨🇦' },
  { id:'MX', name:'Mexico',                 iso:'MX', lat: 23.6, lng:-102.6, burdenRate:0.295, fixedBenefits: 300, currency:'MXN', symbol:'MX$', flag:'🇲🇽' },
  { id:'GT', name:'Guatemala',              iso:'GT', lat: 15.8, lng: -90.2, burdenRate:0.145, fixedBenefits: 120, currency:'GTQ', symbol:'Q',   flag:'🇬🇹' },
  { id:'BZ', name:'Belize',                 iso:'BZ', lat: 17.2, lng: -88.5, burdenRate:0.100, fixedBenefits: 100, currency:'BZD', symbol:'BZ$', flag:'🇧🇿' },
  { id:'HN', name:'Honduras',               iso:'HN', lat: 15.2, lng: -86.2, burdenRate:0.145, fixedBenefits: 100, currency:'HNL', symbol:'L',   flag:'🇭🇳' },
  { id:'SV', name:'El Salvador',            iso:'SV', lat: 13.7, lng: -88.9, burdenRate:0.070, fixedBenefits: 100, currency:'USD', symbol:'$',   flag:'🇸🇻' },
  { id:'NI', name:'Nicaragua',              iso:'NI', lat: 12.9, lng: -85.2, burdenRate:0.220, fixedBenefits:  80, currency:'NIO', symbol:'C$',  flag:'🇳🇮' },
  { id:'CR', name:'Costa Rica',             iso:'CR', lat:  9.7, lng: -83.8, burdenRate:0.295, fixedBenefits: 200, currency:'CRC', symbol:'₡',   flag:'🇨🇷' },
  { id:'PA', name:'Panama',                 iso:'PA', lat:  8.5, lng: -80.8, burdenRate:0.130, fixedBenefits: 200, currency:'USD', symbol:'$',   flag:'🇵🇦' },
  { id:'CU', name:'Cuba',                   iso:'CU', lat: 21.5, lng: -79.5, burdenRate:0.150, fixedBenefits:  80, currency:'CUP', symbol:'₱',   flag:'🇨🇺' },
  { id:'HT', name:'Haiti',                  iso:'HT', lat: 18.9, lng: -72.3, burdenRate:0.100, fixedBenefits:  40, currency:'HTG', symbol:'G',   flag:'🇭🇹' },
  { id:'DO', name:'Dominican Republic',     iso:'DO', lat: 18.7, lng: -70.2, burdenRate:0.175, fixedBenefits: 150, currency:'DOP', symbol:'RD$', flag:'🇩🇴' },
  { id:'JM', name:'Jamaica',                iso:'JM', lat: 18.1, lng: -77.3, burdenRate:0.120, fixedBenefits: 100, currency:'JMD', symbol:'J$',  flag:'🇯🇲' },
  { id:'TT', name:'Trinidad & Tobago',      iso:'TT', lat: 10.7, lng: -61.2, burdenRate:0.140, fixedBenefits: 200, currency:'TTD', symbol:'TT$', flag:'🇹🇹' },
  { id:'BS', name:'Bahamas',                iso:'BS', lat: 25.0, lng: -77.4, burdenRate:0.090, fixedBenefits: 300, currency:'BSD', symbol:'$',   flag:'🇧🇸' },
  { id:'BB', name:'Barbados',               iso:'BB', lat: 13.2, lng: -59.5, burdenRate:0.100, fixedBenefits: 200, currency:'BBD', symbol:'$',   flag:'🇧🇧' },
  // ── South America ──
  { id:'CO', name:'Colombia',               iso:'CO', lat:  4.6, lng: -74.3, burdenRate:0.250, fixedBenefits: 200, currency:'COP', symbol:'$',   flag:'🇨🇴' },
  { id:'VE', name:'Venezuela',              iso:'VE', lat:  8.0, lng: -66.6, burdenRate:0.250, fixedBenefits: 100, currency:'VES', symbol:'Bs',  flag:'🇻🇪' },
  { id:'GY', name:'Guyana',                 iso:'GY', lat:  4.9, lng: -58.9, burdenRate:0.120, fixedBenefits: 100, currency:'GYD', symbol:'G$',  flag:'🇬🇾' },
  { id:'SR', name:'Suriname',               iso:'SR', lat:  3.9, lng: -56.0, burdenRate:0.150, fixedBenefits: 100, currency:'SRD', symbol:'$',   flag:'🇸🇷' },
  { id:'EC', name:'Ecuador',                iso:'EC', lat: -1.8, lng: -78.2, burdenRate:0.200, fixedBenefits: 200, currency:'USD', symbol:'$',   flag:'🇪🇨' },
  { id:'PE', name:'Peru',                   iso:'PE', lat: -9.2, lng: -75.0, burdenRate:0.250, fixedBenefits: 150, currency:'PEN', symbol:'S/',  flag:'🇵🇪' },
  { id:'BR', name:'Brazil',                 iso:'BR', lat:-14.2, lng: -51.9, burdenRate:0.350, fixedBenefits: 300, currency:'BRL', symbol:'R$',  flag:'🇧🇷' },
  { id:'BO', name:'Bolivia',                iso:'BO', lat:-16.3, lng: -63.6, burdenRate:0.250, fixedBenefits: 100, currency:'BOB', symbol:'Bs',  flag:'🇧🇴' },
  { id:'PY', name:'Paraguay',               iso:'PY', lat:-23.4, lng: -58.4, burdenRate:0.170, fixedBenefits: 100, currency:'PYG', symbol:'₲',   flag:'🇵🇾' },
  { id:'UY', name:'Uruguay',                iso:'UY', lat:-32.5, lng: -55.8, burdenRate:0.285, fixedBenefits: 300, currency:'UYU', symbol:'$U',  flag:'🇺🇾' },
  { id:'AR', name:'Argentina',              iso:'AR', lat:-38.4, lng: -63.6, burdenRate:0.270, fixedBenefits: 200, currency:'ARS', symbol:'$',   flag:'🇦🇷' },
  { id:'CL', name:'Chile',                  iso:'CL', lat:-35.7, lng: -71.5, burdenRate:0.115, fixedBenefits: 200, currency:'CLP', symbol:'$',   flag:'🇨🇱' },
  // ── Western Europe ──
  { id:'GB', name:'United Kingdom',         iso:'GB', lat: 55.4, lng:  -3.4, burdenRate:0.138, fixedBenefits:1100, currency:'GBP', symbol:'£',   flag:'🇬🇧' },
  { id:'IE', name:'Ireland',                iso:'IE', lat: 53.4, lng:  -8.0, burdenRate:0.109, fixedBenefits:1200, currency:'EUR', symbol:'€',   flag:'🇮🇪' },
  { id:'FR', name:'France',                 iso:'FR', lat: 46.2, lng:   2.2, burdenRate:0.450, fixedBenefits: 900, currency:'EUR', symbol:'€',   flag:'🇫🇷' },
  { id:'DE', name:'Germany',                iso:'DE', lat: 51.2, lng:  10.5, burdenRate:0.210, fixedBenefits:1000, currency:'EUR', symbol:'€',   flag:'🇩🇪' },
  { id:'NL', name:'Netherlands',            iso:'NL', lat: 52.1, lng:   5.3, burdenRate:0.190, fixedBenefits:1050, currency:'EUR', symbol:'€',   flag:'🇳🇱' },
  { id:'BE', name:'Belgium',                iso:'BE', lat: 50.5, lng:   4.5, burdenRate:0.275, fixedBenefits:1000, currency:'EUR', symbol:'€',   flag:'🇧🇪' },
  { id:'LU', name:'Luxembourg',             iso:'LU', lat: 49.8, lng:   6.1, burdenRate:0.235, fixedBenefits:1200, currency:'EUR', symbol:'€',   flag:'🇱🇺' },
  { id:'CH', name:'Switzerland',            iso:'CH', lat: 46.8, lng:   8.2, burdenRate:0.145, fixedBenefits:1500, currency:'CHF', symbol:'Fr',  flag:'🇨🇭' },
  { id:'AT', name:'Austria',                iso:'AT', lat: 47.5, lng:  14.6, burdenRate:0.215, fixedBenefits:1000, currency:'EUR', symbol:'€',   flag:'🇦🇹' },
  { id:'ES', name:'Spain',                  iso:'ES', lat: 40.5, lng:  -3.7, burdenRate:0.305, fixedBenefits: 900, currency:'EUR', symbol:'€',   flag:'🇪🇸' },
  { id:'PT', name:'Portugal',               iso:'PT', lat: 39.4, lng:  -8.2, burdenRate:0.235, fixedBenefits: 700, currency:'EUR', symbol:'€',   flag:'🇵🇹' },
  { id:'IT', name:'Italy',                  iso:'IT', lat: 41.9, lng:  12.6, burdenRate:0.310, fixedBenefits: 950, currency:'EUR', symbol:'€',   flag:'🇮🇹' },
  { id:'DK', name:'Denmark',                iso:'DK', lat: 56.3, lng:   9.5, burdenRate:0.010, fixedBenefits:1300, currency:'DKK', symbol:'kr',  flag:'🇩🇰' },
  { id:'SE', name:'Sweden',                 iso:'SE', lat: 60.1, lng:  18.6, burdenRate:0.315, fixedBenefits:1200, currency:'SEK', symbol:'kr',  flag:'🇸🇪' },
  { id:'NO', name:'Norway',                 iso:'NO', lat: 60.5, lng:   8.5, burdenRate:0.141, fixedBenefits:1400, currency:'NOK', symbol:'kr',  flag:'🇳🇴' },
  { id:'FI', name:'Finland',                iso:'FI', lat: 61.9, lng:  25.7, burdenRate:0.200, fixedBenefits:1100, currency:'EUR', symbol:'€',   flag:'🇫🇮' },
  { id:'IS', name:'Iceland',                iso:'IS', lat: 64.9, lng: -18.2, burdenRate:0.150, fixedBenefits:1200, currency:'ISK', symbol:'kr',  flag:'🇮🇸' },
  { id:'MT', name:'Malta',                  iso:'MT', lat: 35.9, lng:  14.4, burdenRate:0.100, fixedBenefits: 700, currency:'EUR', symbol:'€',   flag:'🇲🇹' },
  { id:'CY', name:'Cyprus',                 iso:'CY', lat: 35.1, lng:  33.4, burdenRate:0.080, fixedBenefits: 700, currency:'EUR', symbol:'€',   flag:'🇨🇾' },
  { id:'GR', name:'Greece',                 iso:'GR', lat: 39.1, lng:  21.8, burdenRate:0.255, fixedBenefits: 800, currency:'EUR', symbol:'€',   flag:'🇬🇷' },
  // ── Central & Eastern Europe ──
  { id:'PL', name:'Poland',                 iso:'PL', lat: 51.9, lng:  19.1, burdenRate:0.205, fixedBenefits: 600, currency:'PLN', symbol:'zł',  flag:'🇵🇱' },
  { id:'CZ', name:'Czech Republic',         iso:'CZ', lat: 49.8, lng:  15.5, burdenRate:0.338, fixedBenefits: 700, currency:'CZK', symbol:'Kč',  flag:'🇨🇿' },
  { id:'SK', name:'Slovakia',               iso:'SK', lat: 48.7, lng:  19.7, burdenRate:0.352, fixedBenefits: 600, currency:'EUR', symbol:'€',   flag:'🇸🇰' },
  { id:'HU', name:'Hungary',                iso:'HU', lat: 47.2, lng:  19.5, burdenRate:0.145, fixedBenefits: 550, currency:'HUF', symbol:'Ft',  flag:'🇭🇺' },
  { id:'RO', name:'Romania',                iso:'RO', lat: 45.9, lng:  25.0, burdenRate:0.025, fixedBenefits: 400, currency:'RON', symbol:'lei', flag:'🇷🇴' },
  { id:'BG', name:'Bulgaria',               iso:'BG', lat: 42.7, lng:  25.5, burdenRate:0.235, fixedBenefits: 300, currency:'BGN', symbol:'лв',  flag:'🇧🇬' },
  { id:'HR', name:'Croatia',                iso:'HR', lat: 45.1, lng:  15.2, burdenRate:0.185, fixedBenefits: 500, currency:'EUR', symbol:'€',   flag:'🇭🇷' },
  { id:'SI', name:'Slovenia',               iso:'SI', lat: 46.2, lng:  14.8, burdenRate:0.165, fixedBenefits: 700, currency:'EUR', symbol:'€',   flag:'🇸🇮' },
  { id:'RS', name:'Serbia',                 iso:'RS', lat: 44.0, lng:  21.0, burdenRate:0.185, fixedBenefits: 300, currency:'RSD', symbol:'din', flag:'🇷🇸' },
  { id:'BA', name:'Bosnia & Herzegovina',   iso:'BA', lat: 44.2, lng:  17.9, burdenRate:0.200, fixedBenefits: 250, currency:'BAM', symbol:'KM',  flag:'🇧🇦' },
  { id:'AL', name:'Albania',                iso:'AL', lat: 41.2, lng:  20.2, burdenRate:0.155, fixedBenefits: 200, currency:'ALL', symbol:'L',   flag:'🇦🇱' },
  { id:'MK', name:'North Macedonia',        iso:'MK', lat: 41.6, lng:  21.7, burdenRate:0.170, fixedBenefits: 200, currency:'MKD', symbol:'den', flag:'🇲🇰' },
  { id:'ME', name:'Montenegro',             iso:'ME', lat: 42.7, lng:  19.4, burdenRate:0.155, fixedBenefits: 400, currency:'EUR', symbol:'€',   flag:'🇲🇪' },
  { id:'XK', name:'Kosovo',                 iso:'XK', lat: 42.6, lng:  20.9, burdenRate:0.145, fixedBenefits: 200, currency:'EUR', symbol:'€',   flag:'🇽🇰' },
  { id:'MD', name:'Moldova',                iso:'MD', lat: 47.4, lng:  28.4, burdenRate:0.235, fixedBenefits: 150, currency:'MDL', symbol:'L',   flag:'🇲🇩' },
  { id:'UA', name:'Ukraine',                iso:'UA', lat: 48.4, lng:  31.2, burdenRate:0.225, fixedBenefits: 200, currency:'UAH', symbol:'₴',   flag:'🇺🇦' },
  { id:'BY', name:'Belarus',                iso:'BY', lat: 53.7, lng:  28.0, burdenRate:0.340, fixedBenefits: 200, currency:'BYN', symbol:'Br',  flag:'🇧🇾' },
  { id:'LT', name:'Lithuania',              iso:'LT', lat: 55.2, lng:  23.9, burdenRate:0.052, fixedBenefits: 600, currency:'EUR', symbol:'€',   flag:'🇱🇹' },
  { id:'LV', name:'Latvia',                 iso:'LV', lat: 56.9, lng:  24.6, burdenRate:0.238, fixedBenefits: 550, currency:'EUR', symbol:'€',   flag:'🇱🇻' },
  { id:'EE', name:'Estonia',                iso:'EE', lat: 58.6, lng:  25.0, burdenRate:0.334, fixedBenefits: 600, currency:'EUR', symbol:'€',   flag:'🇪🇪' },
  // ── Middle East ──
  { id:'IL', name:'Israel',                 iso:'IL', lat: 31.0, lng:  35.0, burdenRate:0.290, fixedBenefits: 250, currency:'ILS', symbol:'₪',   flag:'🇮🇱' },
  { id:'SA', name:'Saudi Arabia',           iso:'SA', lat: 24.7, lng:  46.7, burdenRate:0.120, fixedBenefits: 600, currency:'SAR', symbol:'﷼',   flag:'🇸🇦' },
  { id:'AE', name:'United Arab Emirates',   iso:'AE', lat: 24.5, lng:  54.4, burdenRate:0.125, fixedBenefits: 700, currency:'AED', symbol:'د.إ', flag:'🇦🇪' },
  { id:'QA', name:'Qatar',                  iso:'QA', lat: 25.4, lng:  51.2, burdenRate:0.000, fixedBenefits: 800, currency:'QAR', symbol:'﷼',   flag:'🇶🇦' },
  { id:'KW', name:'Kuwait',                 iso:'KW', lat: 29.3, lng:  47.5, burdenRate:0.115, fixedBenefits: 600, currency:'KWD', symbol:'د.ك', flag:'🇰🇼' },
  { id:'BH', name:'Bahrain',                iso:'BH', lat: 26.0, lng:  50.5, burdenRate:0.120, fixedBenefits: 500, currency:'BHD', symbol:'BD',  flag:'🇧🇭' },
  { id:'OM', name:'Oman',                   iso:'OM', lat: 21.5, lng:  55.9, burdenRate:0.115, fixedBenefits: 500, currency:'OMR', symbol:'﷼',   flag:'🇴🇲' },
  { id:'JO', name:'Jordan',                 iso:'JO', lat: 30.6, lng:  36.2, burdenRate:0.140, fixedBenefits: 300, currency:'JOD', symbol:'JD',  flag:'🇯🇴' },
  { id:'LB', name:'Lebanon',                iso:'LB', lat: 33.9, lng:  35.5, burdenRate:0.220, fixedBenefits: 200, currency:'LBP', symbol:'£',   flag:'🇱🇧' },
  { id:'IQ', name:'Iraq',                   iso:'IQ', lat: 33.2, lng:  43.7, burdenRate:0.120, fixedBenefits: 150, currency:'IQD', symbol:'ع.د', flag:'🇮🇶' },
  { id:'IR', name:'Iran',                   iso:'IR', lat: 32.4, lng:  53.7, burdenRate:0.230, fixedBenefits: 200, currency:'IRR', symbol:'﷼',   flag:'🇮🇷' },
  { id:'TR', name:'Turkey',                 iso:'TR', lat: 38.9, lng:  35.2, burdenRate:0.225, fixedBenefits: 500, currency:'TRY', symbol:'₺',   flag:'🇹🇷' },
  { id:'SY', name:'Syria',                  iso:'SY', lat: 35.0, lng:  38.0, burdenRate:0.140, fixedBenefits: 100, currency:'SYP', symbol:'£',   flag:'🇸🇾' },
  { id:'YE', name:'Yemen',                  iso:'YE', lat: 15.6, lng:  48.5, burdenRate:0.090, fixedBenefits:  80, currency:'YER', symbol:'﷼',   flag:'🇾🇪' },
  // ── Africa — North ──
  { id:'EG', name:'Egypt',                  iso:'EG', lat: 26.8, lng:  30.8, burdenRate:0.270, fixedBenefits: 300, currency:'EGP', symbol:'£',   flag:'🇪🇬' },
  { id:'LY', name:'Libya',                  iso:'LY', lat: 26.3, lng:  17.2, burdenRate:0.115, fixedBenefits: 200, currency:'LYD', symbol:'LD',  flag:'🇱🇾' },
  { id:'TN', name:'Tunisia',                iso:'TN', lat: 33.9, lng:   9.6, burdenRate:0.230, fixedBenefits: 250, currency:'TND', symbol:'DT',  flag:'🇹🇳' },
  { id:'DZ', name:'Algeria',                iso:'DZ', lat: 28.0, lng:   2.6, burdenRate:0.250, fixedBenefits: 200, currency:'DZD', symbol:'DA',  flag:'🇩🇿' },
  { id:'MA', name:'Morocco',                iso:'MA', lat: 31.8, lng:  -7.1, burdenRate:0.215, fixedBenefits: 250, currency:'MAD', symbol:'MAD', flag:'🇲🇦' },
  // ── Africa — Sub-Saharan ──
  { id:'SD', name:'Sudan',                  iso:'SD', lat: 12.9, lng:  30.2, burdenRate:0.170, fixedBenefits:  80, currency:'SDG', symbol:'SDG', flag:'🇸🇩' },
  { id:'SS', name:'South Sudan',            iso:'SS', lat:  6.9, lng:  31.3, burdenRate:0.100, fixedBenefits:  60, currency:'SSP', symbol:'SSP', flag:'🇸🇸' },
  { id:'ET', name:'Ethiopia',               iso:'ET', lat:  8.6, lng:  39.6, burdenRate:0.110, fixedBenefits:  80, currency:'ETB', symbol:'Br',  flag:'🇪🇹' },
  { id:'ER', name:'Eritrea',                iso:'ER', lat: 15.2, lng:  39.8, burdenRate:0.110, fixedBenefits:  60, currency:'ERN', symbol:'Nfk', flag:'🇪🇷' },
  { id:'DJ', name:'Djibouti',               iso:'DJ', lat: 11.8, lng:  42.6, burdenRate:0.120, fixedBenefits: 100, currency:'DJF', symbol:'Fdj', flag:'🇩🇯' },
  { id:'SO', name:'Somalia',                iso:'SO', lat:  6.1, lng:  46.2, burdenRate:0.080, fixedBenefits:  40, currency:'SOS', symbol:'Sh',  flag:'🇸🇴' },
  { id:'KE', name:'Kenya',                  iso:'KE', lat: -0.0, lng:  37.9, burdenRate:0.150, fixedBenefits: 150, currency:'KES', symbol:'KSh', flag:'🇰🇪' },
  { id:'TZ', name:'Tanzania',               iso:'TZ', lat: -6.4, lng:  34.9, burdenRate:0.150, fixedBenefits: 100, currency:'TZS', symbol:'TSh', flag:'🇹🇿' },
  { id:'UG', name:'Uganda',                 iso:'UG', lat:  1.4, lng:  32.3, burdenRate:0.100, fixedBenefits:  80, currency:'UGX', symbol:'USh', flag:'🇺🇬' },
  { id:'RW', name:'Rwanda',                 iso:'RW', lat: -1.9, lng:  29.9, burdenRate:0.090, fixedBenefits:  80, currency:'RWF', symbol:'RF',  flag:'🇷🇼' },
  { id:'BI', name:'Burundi',                iso:'BI', lat: -3.4, lng:  30.0, burdenRate:0.080, fixedBenefits:  50, currency:'BIF', symbol:'Fr',  flag:'🇧🇮' },
  { id:'GH', name:'Ghana',                  iso:'GH', lat:  7.9, lng:  -1.0, burdenRate:0.130, fixedBenefits: 120, currency:'GHS', symbol:'₵',   flag:'🇬🇭' },
  { id:'NG', name:'Nigeria',                iso:'NG', lat:  9.1, lng:   8.7, burdenRate:0.120, fixedBenefits: 150, currency:'NGN', symbol:'₦',   flag:'🇳🇬' },
  { id:'SN', name:'Senegal',                iso:'SN', lat: 14.5, lng: -14.5, burdenRate:0.200, fixedBenefits: 150, currency:'XOF', symbol:'CFA', flag:'🇸🇳' },
  { id:'CI', name:"Côte d'Ivoire",          iso:'CI', lat:  7.5, lng:  -5.5, burdenRate:0.200, fixedBenefits: 120, currency:'XOF', symbol:'CFA', flag:'🇨🇮' },
  { id:'CM', name:'Cameroon',               iso:'CM', lat:  4.0, lng:  12.4, burdenRate:0.185, fixedBenefits: 100, currency:'XAF', symbol:'CFA', flag:'🇨🇲' },
  { id:'GN', name:'Guinea',                 iso:'GN', lat: 11.0, lng: -10.9, burdenRate:0.180, fixedBenefits:  80, currency:'GNF', symbol:'Fr',  flag:'🇬🇳' },
  { id:'GM', name:'Gambia',                 iso:'GM', lat: 13.4, lng: -15.3, burdenRate:0.100, fixedBenefits:  60, currency:'GMD', symbol:'D',   flag:'🇬🇲' },
  { id:'SL', name:'Sierra Leone',           iso:'SL', lat:  8.5, lng: -11.8, burdenRate:0.100, fixedBenefits:  60, currency:'SLL', symbol:'Le',  flag:'🇸🇱' },
  { id:'LR', name:'Liberia',                iso:'LR', lat:  6.4, lng:  -9.4, burdenRate:0.090, fixedBenefits:  60, currency:'LRD', symbol:'$',   flag:'🇱🇷' },
  { id:'CV', name:'Cape Verde',             iso:'CV', lat: 15.1, lng: -23.6, burdenRate:0.160, fixedBenefits: 120, currency:'CVE', symbol:'$',   flag:'🇨🇻' },
  { id:'ST', name:'São Tomé & Príncipe',    iso:'ST', lat:  0.2, lng:   6.6, burdenRate:0.150, fixedBenefits: 100, currency:'STN', symbol:'Db',  flag:'🇸🇹' },
  { id:'ZA', name:'South Africa',           iso:'ZA', lat:-28.5, lng:  25.0, burdenRate:0.030, fixedBenefits: 500, currency:'ZAR', symbol:'R',   flag:'🇿🇦' },
  { id:'NA', name:'Namibia',                iso:'NA', lat:-22.9, lng:  18.5, burdenRate:0.010, fixedBenefits: 300, currency:'NAD', symbol:'$',   flag:'🇳🇦' },
  { id:'BW', name:'Botswana',               iso:'BW', lat:-22.3, lng:  24.7, burdenRate:0.015, fixedBenefits: 250, currency:'BWP', symbol:'P',   flag:'🇧🇼' },
  { id:'LS', name:'Lesotho',                iso:'LS', lat:-29.6, lng:  28.2, burdenRate:0.030, fixedBenefits: 100, currency:'LSL', symbol:'L',   flag:'🇱🇸' },
  { id:'SZ', name:'Eswatini',               iso:'SZ', lat:-26.5, lng:  31.5, burdenRate:0.030, fixedBenefits: 100, currency:'SZL', symbol:'L',   flag:'🇸🇿' },
  { id:'ZW', name:'Zimbabwe',               iso:'ZW', lat:-20.0, lng:  30.0, burdenRate:0.040, fixedBenefits: 100, currency:'ZWL', symbol:'$',   flag:'🇿🇼' },
  { id:'MZ', name:'Mozambique',             iso:'MZ', lat:-18.7, lng:  35.5, burdenRate:0.040, fixedBenefits:  80, currency:'MZN', symbol:'MT',  flag:'🇲🇿' },
  { id:'MW', name:'Malawi',                 iso:'MW', lat:-13.3, lng:  34.3, burdenRate:0.050, fixedBenefits:  60, currency:'MWK', symbol:'MK',  flag:'🇲🇼' },
  { id:'ZM', name:'Zambia',                 iso:'ZM', lat:-13.1, lng:  27.8, burdenRate:0.050, fixedBenefits:  80, currency:'ZMW', symbol:'ZK',  flag:'🇿🇲' },
  { id:'AO', name:'Angola',                 iso:'AO', lat:-11.2, lng:  17.9, burdenRate:0.080, fixedBenefits: 100, currency:'AOA', symbol:'Kz',  flag:'🇦🇴' },
  { id:'CD', name:'DR Congo',               iso:'CD', lat: -4.0, lng:  21.8, burdenRate:0.090, fixedBenefits:  80, currency:'CDF', symbol:'FC',  flag:'🇨🇩' },
  { id:'CG', name:'Republic of Congo',      iso:'CG', lat: -0.2, lng:  15.8, burdenRate:0.180, fixedBenefits:  80, currency:'XAF', symbol:'CFA', flag:'🇨🇬' },
  { id:'KM', name:'Comoros',                iso:'KM', lat:-11.6, lng:  43.3, burdenRate:0.090, fixedBenefits:  80, currency:'KMF', symbol:'CF',  flag:'🇰🇲' },
  { id:'MG', name:'Madagascar',             iso:'MG', lat:-18.8, lng:  46.9, burdenRate:0.130, fixedBenefits:  80, currency:'MGA', symbol:'Ar',  flag:'🇲🇬' },
  { id:'MU', name:'Mauritius',              iso:'MU', lat:-20.3, lng:  57.6, burdenRate:0.060, fixedBenefits: 300, currency:'MUR', symbol:'Rs',  flag:'🇲🇺' },
  { id:'SC', name:'Seychelles',             iso:'SC', lat: -4.7, lng:  55.5, burdenRate:0.050, fixedBenefits: 400, currency:'SCR', symbol:'Rs',  flag:'🇸🇨' },
  // ── Central Asia ──
  { id:'KZ', name:'Kazakhstan',             iso:'KZ', lat: 48.0, lng:  66.9, burdenRate:0.110, fixedBenefits: 300, currency:'KZT', symbol:'₸',   flag:'🇰🇿' },
  { id:'UZ', name:'Uzbekistan',             iso:'UZ', lat: 41.4, lng:  64.6, burdenRate:0.250, fixedBenefits: 100, currency:'UZS', symbol:'soʻm',flag:'🇺🇿' },
  { id:'KG', name:'Kyrgyzstan',             iso:'KG', lat: 41.2, lng:  74.8, burdenRate:0.175, fixedBenefits: 100, currency:'KGS', symbol:'лв',  flag:'🇰🇬' },
  { id:'TJ', name:'Tajikistan',             iso:'TJ', lat: 38.9, lng:  71.3, burdenRate:0.250, fixedBenefits:  80, currency:'TJS', symbol:'SM',  flag:'🇹🇯' },
  { id:'TM', name:'Turkmenistan',           iso:'TM', lat: 39.0, lng:  59.6, burdenRate:0.200, fixedBenefits: 100, currency:'TMT', symbol:'T',   flag:'🇹🇲' },
  { id:'AF', name:'Afghanistan',            iso:'AF', lat: 33.9, lng:  67.7, burdenRate:0.080, fixedBenefits:  60, currency:'AFN', symbol:'؋',   flag:'🇦🇫' },
  { id:'AM', name:'Armenia',                iso:'AM', lat: 40.1, lng:  45.0, burdenRate:0.075, fixedBenefits: 200, currency:'AMD', symbol:'֏',   flag:'🇦🇲' },
  { id:'AZ', name:'Azerbaijan',             iso:'AZ', lat: 40.1, lng:  47.6, burdenRate:0.220, fixedBenefits: 200, currency:'AZN', symbol:'₼',   flag:'🇦🇿' },
  { id:'GE', name:'Georgia',                iso:'GE', lat: 42.3, lng:  43.4, burdenRate:0.020, fixedBenefits: 150, currency:'GEL', symbol:'₾',   flag:'🇬🇪' },
  { id:'MN', name:'Mongolia',               iso:'MN', lat: 46.9, lng: 103.8, burdenRate:0.205, fixedBenefits: 100, currency:'MNT', symbol:'₮',   flag:'🇲🇳' },
  // ── Asia-Pacific ──
  { id:'CN', name:'China',                  iso:'CN', lat: 35.9, lng: 104.2, burdenRate:0.320, fixedBenefits: 500, currency:'CNY', symbol:'¥',   flag:'🇨🇳' },
  { id:'JP', name:'Japan',                  iso:'JP', lat: 36.2, lng: 138.3, burdenRate:0.165, fixedBenefits:1100, currency:'JPY', symbol:'¥',   flag:'🇯🇵' },
  { id:'KR', name:'South Korea',            iso:'KR', lat: 36.0, lng: 127.8, burdenRate:0.108, fixedBenefits: 700, currency:'KRW', symbol:'₩',   flag:'🇰🇷' },
  { id:'TW', name:'Taiwan',                 iso:'TW', lat: 23.7, lng: 120.9, burdenRate:0.165, fixedBenefits: 600, currency:'TWD', symbol:'NT$', flag:'🇹🇼' },
  { id:'HK', name:'Hong Kong',              iso:'HK', lat: 22.4, lng: 114.1, burdenRate:0.050, fixedBenefits: 800, currency:'HKD', symbol:'HK$', flag:'🇭🇰' },
  { id:'SG', name:'Singapore',              iso:'SG', lat:  1.4, lng: 103.8, burdenRate:0.170, fixedBenefits: 900, currency:'SGD', symbol:'S$',  flag:'🇸🇬' },
  { id:'MY', name:'Malaysia',               iso:'MY', lat:  4.2, lng: 108.0, burdenRate:0.130, fixedBenefits: 400, currency:'MYR', symbol:'RM',  flag:'🇲🇾' },
  { id:'TH', name:'Thailand',               iso:'TH', lat: 15.9, lng: 100.9, burdenRate:0.050, fixedBenefits: 300, currency:'THB', symbol:'฿',   flag:'🇹🇭' },
  { id:'VN', name:'Vietnam',                iso:'VN', lat: 14.1, lng: 108.3, burdenRate:0.235, fixedBenefits: 200, currency:'VND', symbol:'₫',   flag:'🇻🇳' },
  { id:'PH', name:'Philippines',            iso:'PH', lat: 12.9, lng: 121.8, burdenRate:0.115, fixedBenefits: 150, currency:'PHP', symbol:'₱',   flag:'🇵🇭' },
  { id:'ID', name:'Indonesia',              iso:'ID', lat: -2.5, lng: 118.0, burdenRate:0.105, fixedBenefits: 200, currency:'IDR', symbol:'Rp',  flag:'🇮🇩' },
  { id:'KH', name:'Cambodia',               iso:'KH', lat: 12.6, lng: 104.9, burdenRate:0.140, fixedBenefits: 100, currency:'KHR', symbol:'KHR', flag:'🇰🇭' },
  { id:'MM', name:'Myanmar',                iso:'MM', lat: 17.1, lng:  96.1, burdenRate:0.100, fixedBenefits:  80, currency:'MMK', symbol:'K',   flag:'🇲🇲' },
  { id:'LA', name:'Laos',                   iso:'LA', lat: 17.9, lng: 102.5, burdenRate:0.150, fixedBenefits:  80, currency:'LAK', symbol:'₭',   flag:'🇱🇦' },
  { id:'BD', name:'Bangladesh',             iso:'BD', lat: 23.7, lng:  90.4, burdenRate:0.100, fixedBenefits: 100, currency:'BDT', symbol:'৳',   flag:'🇧🇩' },
  { id:'IN', name:'India',                  iso:'IN', lat: 20.6, lng:  79.0, burdenRate:0.120, fixedBenefits: 150, currency:'INR', symbol:'₹',   flag:'🇮🇳' },
  { id:'PK', name:'Pakistan',               iso:'PK', lat: 30.4, lng:  69.3, burdenRate:0.120, fixedBenefits: 100, currency:'PKR', symbol:'Rs',  flag:'🇵🇰' },
  { id:'LK', name:'Sri Lanka',              iso:'LK', lat:  7.9, lng:  80.8, burdenRate:0.120, fixedBenefits: 100, currency:'LKR', symbol:'Rs',  flag:'🇱🇰' },
  { id:'NP', name:'Nepal',                  iso:'NP', lat: 28.4, lng:  84.1, burdenRate:0.120, fixedBenefits:  80, currency:'NPR', symbol:'Rs',  flag:'🇳🇵' },
  { id:'BT', name:'Bhutan',                 iso:'BT', lat: 27.5, lng:  90.4, burdenRate:0.140, fixedBenefits: 100, currency:'BTN', symbol:'Nu',  flag:'🇧🇹' },
  { id:'MV', name:'Maldives',               iso:'MV', lat:  3.2, lng:  73.2, burdenRate:0.070, fixedBenefits: 300, currency:'MVR', symbol:'Rf',  flag:'🇲🇻' },
  { id:'AU', name:'Australia',              iso:'AU', lat:-25.3, lng: 133.8, burdenRate:0.125, fixedBenefits:1300, currency:'AUD', symbol:'A$',  flag:'🇦🇺' },
  { id:'NZ', name:'New Zealand',            iso:'NZ', lat:-40.9, lng: 172.7, burdenRate:0.040, fixedBenefits: 300, currency:'NZD', symbol:'NZ$', flag:'🇳🇿' },
  { id:'PG', name:'Papua New Guinea',       iso:'PG', lat: -6.3, lng: 143.9, burdenRate:0.100, fixedBenefits: 150, currency:'PGK', symbol:'K',   flag:'🇵🇬' },
  { id:'FJ', name:'Fiji',                   iso:'FJ', lat:-17.7, lng: 178.1, burdenRate:0.080, fixedBenefits: 150, currency:'FJD', symbol:'FJ$', flag:'🇫🇯' },
  { id:'TL', name:'Timor-Leste',            iso:'TL', lat: -8.9, lng: 125.7, burdenRate:0.030, fixedBenefits:  80, currency:'USD', symbol:'$',   flag:'🇹🇱' },
  { id:'BN', name:'Brunei',                 iso:'BN', lat:  4.5, lng: 114.7, burdenRate:0.100, fixedBenefits: 400, currency:'BND', symbol:'$',   flag:'🇧🇳' },
  { id:'KP', name:'North Korea',            iso:'KP', lat: 40.3, lng: 127.5, burdenRate:0.200, fixedBenefits:  80, currency:'KPW', symbol:'₩',   flag:'🇰🇵' },
];

const COUNTRIES_SORTED = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
// burdenPct = employer burden as a percentage (e.g. 12.0 for 12%)
// benefitsAnnual = annual fixed benefits cost in local currency
function calcCosts(country, baseSalary, bonusPct, equityAnnual, burdenPct, benefitsAnnual) {
  if (!country) return null;
  const bonus    = baseSalary * (bonusPct / 100);
  const burden   = baseSalary * (burdenPct / 100);
  const benefits = benefitsAnnual;
  const total    = baseSalary + bonus + equityAnnual + burden + benefits;
  return { base: baseSalary, bonus, burden, benefits, equity: equityAnnual, total };
}

function calcNeutralDest(flc, dest, bonusParam, equityAnnual, isFlatBonus = false, burdenPct, benefitsAnnual) {
  if (!dest || !flc) return null;
  const burdenRate = burdenPct / 100;
  const benefits   = benefitsAnnual;
  if (isFlatBonus) {
    const denom  = 1 + burdenRate;
    const base   = (flc - bonusParam - benefits - equityAnnual) / denom;
    const burden = base * burdenRate;
    const total  = base + bonusParam + burden + benefits + equityAnnual;
    return { base, bonus: bonusParam, burden, benefits, equity: equityAnnual, total };
  }
  const denom  = 1 + (bonusParam / 100) + burdenRate;
  const base   = (flc - benefits - equityAnnual) / denom;
  const bonus  = base * (bonusParam / 100);
  const burden = base * burdenRate;
  const total  = base + bonus + burden + benefits + equityAnnual;
  return { base, bonus, burden, benefits, equity: equityAnnual, total };
}

// Format an FX rate for display (e.g. "0.8732 EUR", "149.50 JPY")
function formatFx(rate, currency) {
  if (!rate) return `— ${currency}`;
  const fmt = rate >= 100 ? Math.round(rate).toString()
    : rate >= 1 ? rate.toFixed(2)
    : rate.toFixed(4);
  return `${fmt} ${currency}`;
}


// ---------------------------------------------------------------------------
// SOURCE TOOLTIPS  (JSX constants used inside InfoTip)
// ---------------------------------------------------------------------------
const BURDEN_TIP = (
  <span className="leading-relaxed">
    Employer-side payroll taxes & mandatory social contributions.{' '}
    <span className="text-slate-500">Sources:</span>{' '}
    <a href="https://www.oecd.org/tax/taxing-wages-20725124.htm" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">OECD Taxing Wages</a>,{' '}
    <a href="https://kpmg.com/gh/en/home/services/tax/tax-tools-and-resources/tax-rates-online/social-security-employer-tax-rates-table.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">KPMG Social Security</a>.{' '}
    <span className="text-amber-400/80">Override</span> with your actual rate if known.
  </span>
);

const BENEFITS_TIP = (
  <span className="leading-relaxed">
    Mandatory statutory benefits (pension, healthcare, severance).{' '}
    <span className="text-slate-500">Sources:</span>{' '}
    <a href="https://www.ilo.org/topics-and-sectors/wages" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">ILO Working Conditions</a>,{' '}
    <a href="https://www.mercer.com/solutions/talent-and-rewards/rewards-strategy/global-compensation-and-benefits-data/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">Mercer Benefits</a>.{' '}
    <span className="text-amber-400/80">Override</span> with your actual figures.
  </span>
);

// ---------------------------------------------------------------------------
// SMALL UI PRIMITIVES
// ---------------------------------------------------------------------------

// Hover tooltip — uses delay so links inside are clickable
function InfoTip({ children }) {
  const [show, setShow]   = useState(false);
  const hideTimer = useRef(null);
  const open  = () => { clearTimeout(hideTimer.current); setShow(true); };
  const close = () => { hideTimer.current = setTimeout(() => setShow(false), 150); };
  return (
    <span className="relative inline-flex">
      <button onMouseEnter={open} onMouseLeave={close} tabIndex={-1}
        className="text-slate-600 hover:text-slate-400 transition-colors ml-0.5 align-middle">
        <Info className="w-3 h-3" />
      </button>
      {show && (
        <span onMouseEnter={open} onMouseLeave={close}
          className="absolute bottom-5 left-0 z-50 w-72 bg-space-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 leading-relaxed shadow-2xl">
          {children}
        </span>
      )}
    </span>
  );
}

// IP-detection badge — shown next to Origin label
function IpTip({ data }) {
  const [show, setShow] = useState(false);
  const hideTimer = useRef(null);
  const open  = () => { clearTimeout(hideTimer.current); setShow(true); };
  const close = () => { hideTimer.current = setTimeout(() => setShow(false), 150); };
  return (
    <span className="relative inline-flex">
      <button onMouseEnter={open} onMouseLeave={close} tabIndex={-1}
        className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 text-[9px] font-bold flex items-center justify-center transition-colors">
        ?
      </button>
      {show && (
        <span onMouseEnter={open} onMouseLeave={close}
          className="absolute top-5 left-0 z-50 w-60 bg-space-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 leading-relaxed shadow-2xl whitespace-nowrap">
          <span className="text-slate-200 font-semibold block mb-1.5">📍 Auto-detected from IP</span>
          {data.ip      && <span className="block text-slate-500">IP: <span className="text-slate-400 font-mono">{data.ip}</span></span>}
          {data.city    && <span className="block text-slate-500">City: <span className="text-slate-400">{data.city}</span></span>}
          {data.region  && <span className="block text-slate-500">Region: <span className="text-slate-400">{data.region}</span></span>}
          {data.country_name && <span className="block text-slate-500">Country: <span className="text-slate-400">{data.country_name}</span></span>}
          {data.org     && <span className="block text-[9px] text-slate-600 mt-1 truncate">{data.org}</span>}
        </span>
      )}
    </span>
  );
}

// Two-option toggle (Yr/Mo, %/Amt, C.N/Sav …)
function ModeToggle({ value, opts, onChange, small = false }) {
  const [tip, setTip] = useState(null);
  return (
    <div className={`relative flex bg-space-950 border border-slate-700 rounded-lg p-0.5 gap-0.5 ${small ? 'w-fit' : ''}`}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          onMouseEnter={o.title ? () => setTip(o.title) : undefined}
          onMouseLeave={o.title ? () => setTip(null)   : undefined}
          className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-all ${
            value === o.value ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'
          }`}>
          {o.label}
        </button>
      ))}
      {/* In-app styled tooltip — appears immediately, no browser default */}
      {tip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap bg-space-900 border border-slate-700 text-slate-300 text-[10px] font-medium px-2.5 py-1 rounded-lg shadow-xl">
          {tip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" style={{marginTop:'-1px'}} />
        </div>
      )}
    </div>
  );
}

// Overrideable percentage input (e.g. employer burden %)
function OverridePct({ value, onChange, defaultVal, label, tip }) {
  const isChanged = Math.abs(value - defaultVal) > 0.05;
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider flex items-center gap-0.5">
            {label}{tip && <InfoTip>{tip}</InfoTip>}
          </label>
          {isChanged && (
            <button onClick={() => onChange(defaultVal)} title="Reset to country default"
              className="text-[10px] text-slate-600 hover:text-amber-400 transition-colors">↺ reset</button>
          )}
        </div>
      )}
      <div className="relative">
        <input type="number" min={0} max={100} step={0.1} value={value.toFixed(1)}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full bg-space-900 border rounded-lg py-2 px-3 pr-7 text-sm font-mono outline-none transition-all
            ${isChanged ? 'border-amber-500/50 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'}`}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">%</span>
      </div>
    </div>
  );
}

// Overrideable amount input (e.g. fixed benefits /yr)
function OverrideAmt({ value, onChange, defaultVal, symbol, label, tip }) {
  const isChanged = Math.abs(value - defaultVal) > 1;
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider flex items-center gap-0.5">
            {label}{tip && <InfoTip>{tip}</InfoTip>}
          </label>
          {isChanged && (
            <button onClick={() => onChange(defaultVal)} title="Reset to country default"
              className="text-[10px] text-slate-600 hover:text-amber-400 transition-colors">↺ reset</button>
          )}
        </div>
      )}
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">{symbol}</span>
        <input type="text" value={value.toLocaleString()}
          onChange={e => { const v = e.target.value.replace(/\D/g,''); onChange(v ? Number(v) : 0); }}
          className={`w-full bg-space-900 border rounded-lg py-2 pl-6 pr-3 text-sm font-mono outline-none transition-all
            ${isChanged ? 'border-amber-500/50 text-amber-300' : 'border-slate-700 text-slate-300 hover:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'}`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GLOBE
// ---------------------------------------------------------------------------
function GlobeSection({ origin, destination, onCountryClick }) {
  const containerRef = useRef(null);
  const globeRef     = useRef(null);
  const resumeTimer  = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !window.Globe) return;
    const el = containerRef.current;
    const g = window.Globe({ animateIn: true })(el);

    // Explicitly size to container to avoid globe.gl using window dimensions
    if (el.offsetWidth > 0) g.width(el.offsetWidth).height(el.offsetHeight);

    g.globeImageUrl('/textures/earth-night.jpg')
     .bumpImageUrl('/textures/earth-topology.png')
     .backgroundImageUrl('/textures/night-sky.png')
     .atmosphereColor('#3b82f6')
     .atmosphereAltitude(0.18)
     .showGraticules(false);

    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.3;
    g.controls().enableZoom = true;
    g.controls().minDistance = 200;
    g.controls().maxDistance = 700;
    g.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);

    const pauseRotation = () => {
      g.controls().autoRotate = false;
      clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => { g.controls().autoRotate = true; }, 3000);
    };
    el.addEventListener('pointerdown', pauseRotation);

    // Keep canvas in sync if container is resized
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && globeRef.current) globeRef.current.width(width).height(height);
    });
    ro.observe(el);

    fetch('/countries.geojson')
      .then(r => r.json())
      .then(data => {
        g.polygonsData(data.features.filter(f => f.properties.ISO_A2 !== 'AQ'))
         .polygonGeoJsonGeometry(f => f.geometry)
         .polygonCapColor(() => 'rgba(255,255,255,0.03)')
         .polygonSideColor(() => 'rgba(100,120,220,0.06)')
         .polygonStrokeColor(() => 'rgba(148,163,184,0.15)')
         .polygonAltitude(0.01)
         .polygonLabel(f => `<div style="background:rgba(8,13,26,0.9);border:1px solid #334155;border-radius:6px;padding:4px 10px;font-family:Inter,sans-serif;font-size:12px;color:#cbd5e1;">${f.properties.ADMIN}</div>`)
         .onPolygonHover(hov => {
           g.polygonAltitude(f => f === hov ? 0.06 : 0.01);
           g.polygonCapColor(f => f === hov ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.03)');
         })
         .onPolygonClick(f => {
           const iso      = f.properties.ISO_A2;
           const adminName = f.properties.ADMIN || f.properties.NAME || '';
           // Primary: ISO_A2 match; fallback: name match (handles France, Norway, etc. where ISO_A2='-99')
           const country =
             (iso && iso !== '-99' ? COUNTRIES.find(c => c.iso === iso) : null)
             ?? COUNTRIES.find(c => c.name.toLowerCase() === adminName.toLowerCase());
           if (country) onCountryClick(country);
         });
      })
      .catch(console.error);

    g.pointsData([])
     .pointLat(d => d.lat)
     .pointLng(d => d.lng)
     .pointColor(d => d._isOrigin ? '#a5b4fc' : '#6ee7b7')
     .pointAltitude(0.04)
     .pointRadius(0.65)
     .pointLabel(d => `<div style="background:rgba(8,13,26,0.92);border:1px solid #3b82f640;border-radius:8px;padding:6px 10px;font-family:Inter,sans-serif;font-size:12px;color:#93c5fd;font-weight:600;">${d.flag} ${d.name}</div>`);

    globeRef.current = g;
    setReady(true);
    return () => {
      el.removeEventListener('pointerdown', pauseRotation);
      clearTimeout(resumeTimer.current);
      ro.disconnect();
      globeRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !ready) return;
    const pts = [
      origin      ? { ...origin,      _isOrigin: true  } : null,
      destination ? { ...destination, _isOrigin: false } : null,
    ].filter(Boolean);
    g.pointsData(pts).pointColor(d => d._isOrigin ? '#a5b4fc' : '#6ee7b7');
    g.polygonCapColor(f => {
      const iso = f.properties.ISO_A2;
      if (origin      && iso === origin.iso)      return 'rgba(99,102,241,0.45)';
      if (destination && iso === destination.iso) return 'rgba(16,185,129,0.45)';
      return 'rgba(255,255,255,0.03)';
    })
    .polygonAltitude(f => {
      const iso = f.properties.ISO_A2;
      if ((origin && iso === origin.iso) || (destination && iso === destination.iso)) return 0.05;
      return 0.01;
    });
  }, [origin?.id, destination?.id, ready]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !ready || !origin || destination) return;
    g.controls().autoRotate = false;
    g.pointOfView({ lat: origin.lat, lng: origin.lng, altitude: 2.2 }, 1200);
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { g.controls().autoRotate = true; }, 5000);
  }, [origin?.id, ready]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !ready) return;
    if (!origin || !destination) { g.arcsData([]); g.ringsData([]); return; }
    g.arcsData([{ startLat: origin.lat, startLng: origin.lng, endLat: destination.lat, endLng: destination.lng }])
     .arcColor(() => ['#818cf8', '#34d399'])
     .arcAltitude(null).arcStroke(0.6)
     .arcDashLength(0.35).arcDashGap(0.65).arcDashInitialGap(0.1).arcDashAnimateTime(2200);
    g.ringsData([{ lat: destination.lat, lng: destination.lng }])
     .ringLat(d => d.lat).ringLng(d => d.lng)
     .ringColor(() => t => `rgba(52,211,153,${1 - t})`)
     .ringMaxRadius(4).ringPropagationSpeed(2.5).ringRepeatPeriod(900);
    const midLat  = (origin.lat + destination.lat) / 2;
    const midLng  = (origin.lng + destination.lng) / 2;
    const distDeg = Math.sqrt((destination.lat-origin.lat)**2 + (destination.lng-origin.lng)**2);
    const alt     = Math.max(1.6, Math.min(3.8, distDeg / 28));
    g.controls().autoRotate = false;
    g.pointOfView({ lat: midLat, lng: midLng, altitude: alt }, 1600);
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => { g.controls().autoRotate = true; }, 7000);
  }, [origin?.id, destination?.id, ready]);

  return (
    <div className="relative w-full h-full bg-space-950 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />

      {!origin && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-space-900/90 backdrop-blur border border-blue-500/30 text-blue-400 px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg animate-pulse flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Spin the globe · click a country to set origin
          </div>
        </div>
      )}
      {origin && !destination && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-space-900/90 backdrop-blur border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg animate-pulse flex items-center gap-2">
            <Plane className="w-3.5 h-3.5" /> Now click the destination country
          </div>
        </div>
      )}
      {origin && destination && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-space-900/90 backdrop-blur border border-indigo-500/30 text-indigo-300 px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" /> Transfer modeled — scroll for results
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BONUS INPUT (% or flat amount toggle)
// ---------------------------------------------------------------------------
function BonusInput({ mode, onModeChange, pct, onPctChange, flat, onFlatChange, symbol, baseSalary }) {
  const derivedPct  = baseSalary > 0 ? (flat / baseSalary * 100).toFixed(1) : '0';
  const derivedFlat = Math.round(baseSalary * (pct / 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Bonus</label>
        <ModeToggle value={mode} opts={[{value:'pct',label:'%'},{value:'amount',label:'Amt'}]} onChange={onModeChange} small />
      </div>
      {mode === 'pct' ? (
        <div className="relative">
          <input type="number" min="0" max="500" step="0.5" value={pct}
            onChange={e => onPctChange(Number(e.target.value))}
            className="w-full bg-space-900 border border-slate-700 rounded-lg py-2 px-3 pr-7 text-sm text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
          {baseSalary > 0 && <p className="text-[9px] text-slate-600 mt-0.5 pl-0.5">{symbol}{derivedFlat.toLocaleString()} / yr</p>}
        </div>
      ) : (
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{symbol}</span>
          <input type="text" value={flat.toLocaleString()}
            onChange={e => { const v = e.target.value.replace(/\D/g,''); onFlatChange(v ? Number(v) : 0); }}
            className="w-full bg-space-900 border border-slate-700 rounded-lg py-2 pl-6 pr-3 text-sm text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
          />
          {baseSalary > 0 && <p className="text-[9px] text-slate-600 mt-0.5 pl-0.5">{derivedPct}% of base</p>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SIDE-BY-SIDE COMPARISON TABLE
// ---------------------------------------------------------------------------
function ComparisonTable({
  origin, originCosts, destination, destCosts,
  salaryMode, destSalaryMode, effectiveBonusPct, destDisplayBonusPct,
  fxRates, fxApiOk, originBurden, destBurden,
}) {
  const originFxRate = fxRates?.[origin.currency];
  const destFxRate   = fxRates?.[destination.currency];
  const originUSD    = originFxRate ? originCosts.total / originFxRate : null;
  const destUSD      = destFxRate   ? destCosts.total   / destFxRate   : null;

  const rows = [
    {
      label: 'Base /yr',
      ov: <span className="font-mono text-slate-200 text-sm">{origin.symbol}{Math.round(originCosts.base).toLocaleString()}</span>,
      dv: <span className="font-mono text-emerald-300 font-bold text-sm">{destination.symbol}{Math.round(destCosts.base).toLocaleString()}<span className="text-[9px] text-emerald-700 ml-1">calc.</span></span>,
    },
    {
      label: 'Base /mo',
      ov: <span className="font-mono text-slate-400 text-xs">{origin.symbol}{Math.round(originCosts.base / 12).toLocaleString()}</span>,
      dv: <span className="font-mono text-emerald-400/60 text-xs">{destination.symbol}{Math.round(destCosts.base / 12).toLocaleString()}</span>,
    },
    {
      label: 'Bonus',
      ov: <span className="text-slate-400 text-xs">{origin.symbol}{Math.round(originCosts.bonus).toLocaleString()} <span className="text-slate-600">({effectiveBonusPct.toFixed(1)}%)</span></span>,
      dv: <span className="text-slate-400 text-xs">{destination.symbol}{Math.round(destCosts.bonus).toLocaleString()} <span className="text-slate-600">({destDisplayBonusPct.toFixed(1)}%)</span></span>,
    },
    {
      label: 'Annual Equity',
      ov: <span className="text-slate-400 text-xs">{origin.symbol}{Math.round(originCosts.equity).toLocaleString()}</span>,
      dv: <span className="text-slate-400 text-xs">{destination.symbol}{Math.round(destCosts.equity).toLocaleString()}</span>,
    },
    {
      label: <span className="flex items-center gap-0.5">Empl. Burden <span className="text-slate-600 text-[9px]">({originBurden.toFixed(1)}% / {destBurden.toFixed(1)}%)</span></span>,
      sub: true,
      ov: <span className="text-rose-400/70 text-xs">+ {origin.symbol}{Math.round(originCosts.burden).toLocaleString()}</span>,
      dv: <span className="text-rose-400/70 text-xs">+ {destination.symbol}{Math.round(destCosts.burden).toLocaleString()}</span>,
    },
    {
      label: 'Fixed Benefits',
      sub: true,
      ov: <span className="text-rose-400/70 text-xs">+ {origin.symbol}{Math.round(originCosts.benefits).toLocaleString()}</span>,
      dv: <span className="text-rose-400/70 text-xs">+ {destination.symbol}{Math.round(destCosts.benefits).toLocaleString()}</span>,
    },
  ];

  const cellCls = 'px-3 py-2 border-l border-slate-700/20 text-sm';

  return (
    <div className="bg-space-800/60 border border-slate-700/50 rounded-2xl overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="grid grid-cols-[130px_1fr_1fr] bg-space-900/70 border-b border-slate-700/50">
        <div className="px-3 py-2.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-600 font-bold">
          <BarChart3 className="w-3 h-3" /> Breakdown
        </div>
        <div className="px-3 py-2.5 border-l border-slate-700/40">
          <div className="flex items-center gap-1.5">
            <span className={`fi fi-${origin.iso.toLowerCase()}`} style={{width:'14px',height:'11px',borderRadius:'2px',flexShrink:0}} />
            <span className="text-blue-300 font-semibold text-xs truncate">{origin.name}</span>
            <span className="text-[9px] font-mono text-slate-600 ml-auto shrink-0">{origin.currency}</span>
          </div>
        </div>
        <div className="px-3 py-2.5 border-l border-slate-700/40">
          <div className="flex items-center gap-1.5">
            <span className={`fi fi-${destination.iso.toLowerCase()}`} style={{width:'14px',height:'11px',borderRadius:'2px',flexShrink:0}} />
            <span className="text-emerald-300 font-semibold text-xs truncate">{destination.name}</span>
            <span className="text-[9px] font-mono text-slate-600 ml-auto shrink-0">{destination.currency}</span>
          </div>
        </div>
      </div>

      {/* Data rows */}
      {rows.map((r, i) => (
        <div key={i} className={`grid grid-cols-[130px_1fr_1fr] border-b border-slate-700/15`}>
          <div className={`px-3 py-2 text-xs flex items-center ${r.sub ? 'text-slate-500 pl-4' : 'text-slate-400 font-medium'}`}>{r.label}</div>
          <div className={cellCls}>{r.ov}</div>
          <div className={cellCls}>{r.dv}</div>
        </div>
      ))}

      {/* Divider */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500/25 via-slate-600/40 to-emerald-500/25" />

      {/* Total Annual Cost */}
      <div className="grid grid-cols-[130px_1fr_1fr] bg-space-900/40 border-b border-slate-700/30">
        <div className="px-3 py-2.5 text-xs text-slate-300 font-bold flex items-center">Total Annual</div>
        <div className="px-3 py-2.5 border-l border-slate-700/30 font-mono font-bold text-white">{origin.symbol}{Math.round(originCosts.total).toLocaleString()}</div>
        <div className="px-3 py-2.5 border-l border-slate-700/30 font-mono font-bold text-white">{destination.symbol}{Math.round(destCosts.total).toLocaleString()}</div>
      </div>

      {/* FX Rate */}
      <div className="grid grid-cols-[130px_1fr_1fr] border-b border-slate-700/15">
        <div className="px-3 py-2 text-[10px] uppercase text-slate-600 font-bold flex items-center">FX Rate</div>
        <div className={`${cellCls} text-xs text-slate-500 flex items-center gap-1`}>
          1 USD = {formatFx(originFxRate, origin.currency)}
          <a href={FX_API_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600/60 hover:text-blue-400 ml-0.5">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-[9px] text-slate-700">{fxApiOk ? 'live' : 'est.'}</span>
        </div>
        <div className={`${cellCls} text-xs text-slate-500 flex items-center gap-1`}>
          1 USD = {formatFx(destFxRate, destination.currency)}
          <a href={FX_API_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600/60 hover:text-blue-400 ml-0.5">
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span className="text-[9px] text-slate-700">{fxApiOk ? 'live' : 'est.'}</span>
        </div>
      </div>

      {/* Total USD */}
      {originUSD && destUSD && (
        <div className="grid grid-cols-[130px_1fr_1fr] bg-emerald-900/10">
          <div className="px-3 py-2.5 text-xs text-emerald-400 font-bold flex items-center gap-1">
            <DollarSign className="w-3 h-3" />Total (USD)
          </div>
          <div className="px-3 py-2.5 border-l border-emerald-700/20 font-mono font-bold text-emerald-300">${Math.round(originUSD).toLocaleString()}</div>
          <div className="px-3 py-2.5 border-l border-emerald-700/20 font-mono font-bold text-emerald-300">${Math.round(destUSD).toLocaleString()} <span className="text-emerald-600">✓</span></div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEARCHABLE COUNTRY COMBOBOX
// ---------------------------------------------------------------------------
function CountrySearch({ label, value, onChange, placeholder, accentColor = 'blue', labelExtra }) {
  const [query, setQuery]  = useState('');
  const [open,  setOpen]   = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES_SORTED;
    const q = query.toLowerCase();
    return COUNTRIES_SORTED.filter(c => c.name.toLowerCase().includes(q));
  }, [query]);

  const ring = accentColor === 'green'
    ? 'focus:border-emerald-500 focus:ring-emerald-500/20'
    : 'focus:border-blue-500 focus:ring-blue-500/20';

  return (
    <div ref={wrapperRef}>
      <div className="flex items-center gap-1 mb-1.5">
        <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">{label}</label>
        {labelExtra}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        {value && !open && (
          <span
            className={`fi fi-${value.iso.toLowerCase()} pointer-events-none absolute`}
            style={{ left: '2.2rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '14px', borderRadius: '2px', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
          />
        )}
        <input
          type="text"
          value={open ? query : (value ? value.name : '')}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          className={`w-full bg-space-900 border border-slate-700 rounded-xl py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${ring} ${value && !open ? 'pl-14' : 'pl-9'} pr-8`}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-space-900 border border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
            {filtered.length > 0 ? filtered.map(c => (
              <div
                key={c.id}
                onMouseDown={e => { e.preventDefault(); onChange(c); setOpen(false); setQuery(''); }}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-space-800 ${value?.id === c.id ? 'text-blue-400 bg-space-800/60' : 'text-slate-200'}`}
              >
                <span className={`fi fi-${c.iso.toLowerCase()} shrink-0`}
                  style={{ width: '20px', height: '15px', borderRadius: '3px', display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
                />
                <span className="inline-flex items-center justify-center w-7 h-5 rounded bg-slate-700/80 text-[9px] font-bold text-slate-400 font-mono shrink-0">
                  {c.iso}
                </span>
                <span className="flex-1">{c.name}</span>
                <span className="text-xs text-slate-600 font-mono">{c.currency}</span>
              </div>
            )) : (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">No countries found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COST BREAKDOWN CHART  (pure SVG, no extra deps)
// ---------------------------------------------------------------------------
function CostBreakdownChart({ origin, destination, originCosts, destCosts, fxRates }) {
  const [hovered, setHovered] = useState(null); // { barIdx, segKey }
  const [tip, setTip]         = useState(null); // { x, y, label, usd, local, symbol, pct }
  const containerRef = useRef(null);

  const oRate = fxRates[origin.currency]      || 1;
  const dRate = fxRates[destination.currency] || 1;

  const SEGS = [
    { key: 'benefits', label: 'Fixed Benefits', fill: '#2dd4bf' },
    { key: 'burden',   label: 'Empl. Burden',   fill: '#f87171' },
    { key: 'equity',   label: 'Annual Equity',   fill: '#fbbf24' },
    { key: 'bonus',    label: 'Bonus',           fill: '#a78bfa' },
    { key: 'base',     label: 'Base Salary',     fill: '#60a5fa' },
  ];

  const bars = [
    { label: origin.name,      flag: origin.flag,      symbol: origin.symbol,      costs: originCosts, rate: oRate, accent: '#3b82f6' },
    { label: destination.name, flag: destination.flag, symbol: destination.symbol, costs: destCosts,   rate: dRate, accent: '#10b981' },
  ];

  const toUSD = (costs, rate) => ({
    base:     costs.base     / rate,
    bonus:    costs.bonus    / rate,
    equity:   costs.equity   / rate,
    burden:   costs.burden   / rate,
    benefits: costs.benefits / rate,
    total:    costs.total    / rate,
  });

  const barsUSD = bars.map(b => ({ ...b, usd: toUSD(b.costs, b.rate) }));
  const maxTotal = Math.max(...barsUSD.map(b => b.usd.total));

  // SVG layout — narrower bars
  const svgW = 260, svgH = 200;
  const padL = 46, padR = 10, padT = 20, padB = 28;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const barW = 54;
  const b1x  = padL + (chartW / 2 - barW) / 2;
  const b2x  = padL + chartW / 2 + (chartW / 2 - barW) / 2;
  const barXs = [b1x, b2x];

  const scale = maxTotal > 0 ? chartH / maxTotal : 0;

  // Gridlines
  const gridCount = 4;
  const rawStep = maxTotal / gridCount;
  const mag  = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = Math.ceil(rawStep / mag) * mag;
  const gridLines = Array.from({ length: gridCount }, (_, i) => step * (i + 1)).filter(v => v <= maxTotal * 1.05);

  const fmtUSD   = v => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v/1000)}K` : `$${Math.round(v)}`;
  const fmtLocal = (v, symbol) => {
    if (v >= 1e6)  return `${symbol}${(v/1e6).toFixed(1)}M`;
    if (v >= 1000) return `${symbol}${Math.round(v/1000)}K`;
    return `${symbol}${Math.round(v)}`;
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev);
  };

  return (
    <div className="bg-space-800/60 border border-slate-700/50 rounded-2xl p-4 animate-fade-in-up">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
        <BarChart3 className="w-3 h-3 text-blue-400" /> Cost Breakdown (USD)
      </h3>
      <div ref={containerRef} className="relative" onMouseMove={handleMouseMove} onMouseLeave={() => { setHovered(null); setTip(null); }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          {/* Gridlines */}
          {gridLines.map((v, i) => {
            const gy = padT + chartH - v * scale;
            return (
              <g key={i}>
                <line x1={padL} y1={gy} x2={svgW - padR} y2={gy} stroke="#1e293b" strokeWidth="0.75" />
                <text x={padL - 4} y={gy + 3.5} textAnchor="end" fontSize={5.5} fill="#334155">{fmtUSD(v)}</text>
              </g>
            );
          })}
          {/* Baseline */}
          <line x1={padL} y1={padT + chartH} x2={svgW - padR} y2={padT + chartH} stroke="#334155" strokeWidth="1" />

          {/* Bars */}
          {barsUSD.map((bar, bi) => {
            let yOff = padT + chartH;
            const bx = barXs[bi];
            return (
              <g key={bi}>
                {SEGS.map((seg) => {
                  const val = bar.usd[seg.key];
                  const h   = Math.max(0, val * scale);
                  yOff -= h;
                  const isHov = hovered?.barIdx === bi && hovered?.segKey === seg.key;
                  const dimmed = hovered && hovered.barIdx === bi && !isHov;
                  return (
                    <rect key={seg.key}
                      x={bx} y={yOff} width={barW} height={h}
                      fill={seg.fill} fillOpacity={dimmed ? 0.2 : 0.8}
                      style={{ cursor: 'crosshair', transition: 'fill-opacity 0.15s' }}
                      onMouseEnter={(e) => {
                        setHovered({ barIdx: bi, segKey: seg.key });
                        if (containerRef.current) {
                          const r = containerRef.current.getBoundingClientRect();
                          setTip({
                            x: e.clientX - r.left, y: e.clientY - r.top,
                            label: seg.label, usd: val,
                            local: bar.costs[seg.key], symbol: bar.symbol,
                            pct: bar.usd.total > 0 ? val / bar.usd.total * 100 : 0,
                          });
                        }
                      }}
                      onMouseLeave={() => { setHovered(null); setTip(null); }}
                    />
                  );
                })}
                {/* Country label — name only, no flag/ISO prefix */}
                <text x={bx + barW / 2} y={padT + chartH + 15} textAnchor="middle" fontSize={6.5} fill={bi === 0 ? '#93c5fd' : '#6ee7b7'} fontWeight="600">
                  {bar.label.split(' ').slice(0, 2).join(' ')}
                </text>
                {/* Total above bar */}
                <text x={bx + barW / 2} y={padT + chartH - bar.usd.total * scale - 4} textAnchor="middle" fontSize={6} fill="#94a3b8" fontWeight="bold">
                  {fmtUSD(bar.usd.total)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {tip && (
          <div className="pointer-events-none absolute z-10 bg-space-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] shadow-xl"
            style={{ left: tip.x + 10, top: tip.y - 36 }}>
            <div className="text-slate-300 font-semibold mb-0.5">{tip.label}</div>
            <div className="text-emerald-300 font-mono">{fmtUSD(tip.usd)} <span className="text-slate-500">({tip.pct.toFixed(1)}%)</span></div>
            <div className="text-slate-400 font-mono text-[10px]">{fmtLocal(tip.local, tip.symbol)}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
        {[...SEGS].reverse().map(s => (
          <div key={s.key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: s.fill, opacity: 0.8 }} />
            <span className="text-[9px] text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SAVINGS PLANNER  (workforce planning + multi-year TCO + savings viz)
// ---------------------------------------------------------------------------
function SavingsBarChart({ yearData }) {
  const maxVal = Math.max(...yearData.flatMap(d => [d.originUSD, d.destUSD]), 1);
  const svgW = 380, svgH = 195;
  const padL = 52, padR = 14, padT = 22, padB = 28;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const scale  = chartH / maxVal;
  const groupW = chartW / 3;
  const barW   = 32, halfGap = 5;

  const step = Math.pow(10, Math.floor(Math.log10(maxVal / 4)));
  const nStep = Math.ceil(maxVal / 4 / step) * step;
  const gridLines = [1, 2, 3, 4].map(i => i * nStep).filter(v => v <= maxVal * 1.1);

  const fmtV = v => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${Math.round(v/1000)}K`;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      {/* Gridlines */}
      {gridLines.map((v, i) => {
        const gy = padT + chartH - v * scale;
        return (
          <g key={i}>
            <line x1={padL} y1={gy} x2={svgW - padR} y2={gy} stroke="#1e293b" strokeWidth="0.75" />
            <text x={padL - 4} y={gy + 3.5} textAnchor="end" fontSize={9} fill="#334155">{fmtV(v)}</text>
          </g>
        );
      })}
      {/* Baseline */}
      <line x1={padL} y1={padT + chartH} x2={svgW - padR} y2={padT + chartH} stroke="#334155" strokeWidth="1" />

      {/* Bar groups */}
      {yearData.map((d, gi) => {
        const gCx   = padL + (gi + 0.5) * groupW;
        const oBx   = gCx - barW - halfGap;
        const dBx   = gCx + halfGap;
        const oH    = Math.max(1, d.originUSD * scale);
        const dH    = Math.max(1, d.destUSD   * scale);
        const oY    = padT + chartH - oH;
        const dY    = padT + chartH - dH;
        const hasSav = d.savings > 100;
        return (
          <g key={gi}>
            {/* Origin bar */}
            <rect x={oBx} y={oY} width={barW} height={oH} fill="#3b82f6" fillOpacity="0.72" rx="3" />
            {/* Dest bar */}
            <rect x={dBx} y={dY} width={barW} height={dH} fill="#10b981" fillOpacity="0.72" rx="3" />
            {/* Savings bracket */}
            {hasSav && (
              <>
                <line x1={dBx + barW + 4} y1={dY + 1} x2={dBx + barW + 4} y2={oY - 1} stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
                <line x1={dBx + barW + 2} y1={dY + 1} x2={dBx + barW + 6} y2={dY + 1} stroke="#34d399" strokeWidth="1.5" />
                <line x1={dBx + barW + 2} y1={oY - 1} x2={dBx + barW + 6} y2={oY - 1} stroke="#34d399" strokeWidth="1.5" />
                <text x={dBx + barW + 10} y={(dY + oY) / 2 + 3.5} fontSize={8.5} fill="#34d399" fontWeight="bold">{fmtV(d.savings)}</text>
              </>
            )}
            {/* Value labels */}
            <text x={oBx + barW / 2} y={oY - 4} textAnchor="middle" fontSize={8} fill="#93c5fd">{fmtV(d.originUSD)}</text>
            <text x={dBx + barW / 2} y={dY - 4} textAnchor="middle" fontSize={8} fill="#6ee7b7">{fmtV(d.destUSD)}</text>
            {/* Year label */}
            <text x={gCx} y={svgH - 6} textAnchor="middle" fontSize={10} fill="#475569">Year {d.year}</text>
          </g>
        );
      })}

      {/* Legend */}
      <rect x={padL + 4}  y={svgH - 26} width={10} height={8} fill="#3b82f6" fillOpacity="0.72" rx="2" />
      <text x={padL + 17} y={svgH - 19} fontSize={9} fill="#64748b">Origin</text>
      <rect x={padL + 65} y={svgH - 26} width={10} height={8} fill="#10b981" fillOpacity="0.72" rx="2" />
      <text x={padL + 78} y={svgH - 19} fontSize={9} fill="#64748b">Destination</text>
      <line x1={padL + 150} y1={svgH - 22} x2={padL + 160} y2={svgH - 22} stroke="#34d399" strokeWidth="1.5" />
      <text x={padL + 163} y={svgH - 19} fontSize={9} fill="#64748b">Savings</text>
    </svg>
  );
}

function SavingsPlanner({ origin, destination, originCosts, destCosts, fxRates, headcount, annualGrowth }) {
  const oRate = fxRates[origin.currency]      || 1;
  const dRate = fxRates[destination.currency] || 1;
  const originUSDpp = originCosts.total / oRate;
  const destUSDpp   = destCosts.total   / dRate;
  const savingsPerPerson = originUSDpp - destUSDpp;
  const totalSavingsYr   = savingsPerPerson * headcount;
  const isSaving = totalSavingsYr > 0;

  const yearData = [1, 2, 3].map(yr => {
    const g = Math.pow(1 + annualGrowth / 100, yr - 1);
    return {
      year: yr,
      originUSD: originUSDpp * headcount * g,
      destUSD:   destUSDpp   * headcount * g,
      savings:   (originUSDpp - destUSDpp) * headcount * g,
    };
  });
  const total3yr = yearData.reduce((sum, d) => sum + d.savings, 0);

  const fmtUSD = v => `$${Math.abs(Math.round(v)).toLocaleString()}`;

  return (
    <div className="space-y-3">
      {/* Hero callout */}
      <div className={`rounded-2xl p-5 border text-center ${isSaving ? 'bg-emerald-900/15 border-emerald-700/30' : 'bg-rose-900/15 border-rose-700/30'}`}>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{isSaving ? 'Annual Savings' : 'Annual Premium'} · per person</p>
        <p className={`font-mono font-black text-4xl tabular-nums mb-1 ${isSaving ? 'text-emerald-300' : 'text-rose-300'}`}>
          {isSaving ? '' : '+'}{fmtUSD(savingsPerPerson)}
          <span className="text-lg font-semibold text-slate-500 ml-1">/yr</span>
        </p>
        {headcount > 1 && (
          <p className="text-sm text-slate-400 mt-2">
            × {headcount} people =
            <span className={`font-mono font-bold ml-2 text-base ${isSaving ? 'text-emerald-200' : 'text-rose-200'}`}>
              {isSaving ? '' : '+'}{fmtUSD(totalSavingsYr)}/yr
            </span>
          </p>
        )}
      </div>

      {/* Bar chart */}
      <div className="bg-space-800/40 border border-slate-700/40 rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-blue-400" /> Multi-Year Projection ({headcount} {headcount === 1 ? 'person' : 'people'}, {annualGrowth}%/yr growth)
        </p>
        <SavingsBarChart yearData={yearData} />
      </div>

      {/* 3-year cumulative row */}
      <div className="grid grid-cols-4 gap-2">
        {yearData.map(d => (
          <div key={d.year} className="bg-space-800/40 border border-slate-700/30 rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Year {d.year}</p>
            <p className={`font-mono font-semibold text-sm tabular-nums ${d.savings > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {d.savings > 0 ? '' : '+'}{fmtUSD(d.savings)}
            </p>
          </div>
        ))}
        <div className={`rounded-xl p-2.5 text-center border ${isSaving ? 'bg-emerald-900/25 border-emerald-700/40' : 'bg-rose-900/25 border-rose-700/40'}`}>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">3-yr Total</p>
          <p className={`font-mono font-black text-sm tabular-nums ${isSaving ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isSaving ? '' : '+'}{fmtUSD(total3yr)}
          </p>
        </div>
      </div>

      {/* Savings breakdown */}
      <div className="bg-space-800/40 border border-slate-700/30 rounded-xl overflow-hidden">
        <div className="px-3 py-2 bg-space-900/40 border-b border-slate-700/30">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Savings Breakdown (per person/yr)</span>
        </div>
        {[
          { label: 'Base salary delta',   val: (originCosts.base - destCosts.base) / oRate * oRate - (originCosts.base - destCosts.base / dRate * oRate), usd: originCosts.base / oRate - destCosts.base / dRate },
          { label: 'Employer burden delta', usd: originCosts.burden / oRate - destCosts.burden / dRate },
          { label: 'Fixed benefits delta',  usd: originCosts.benefits / oRate - destCosts.benefits / dRate },
          { label: 'Bonus delta',           usd: originCosts.bonus / oRate - destCosts.bonus / dRate },
        ].map(({ label, usd }) => (
          <div key={label} className="flex justify-between items-center px-3 py-1.5 border-b border-slate-700/15">
            <span className="text-xs text-slate-500">{label}</span>
            <span className={`font-mono text-xs ${usd > 0 ? 'text-emerald-400' : usd < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
              {usd > 0 ? '-' : usd < 0 ? '+' : ''}{fmtUSD(Math.abs(usd))}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center px-3 py-2 bg-space-900/30">
          <span className="text-xs text-slate-300 font-bold">Total per person/yr</span>
          <span className={`font-mono text-sm font-bold ${isSaving ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isSaving ? '-' : '+'}{fmtUSD(Math.abs(savingsPerPerson))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------
export default function App() {
  // ── Location ──
  const [origin,      setOriginState]      = useState(null);
  const [destination, setDestinationState] = useState(null);
  const [ipData,      setIpData]           = useState(null);

  // ── Origin inputs ──
  const [baseSalary,  setBaseSalary]  = useState(120000);
  const [salaryMode,  setSalaryMode]  = useState('annual');
  const [bonusMode,   setBonusMode]   = useState('pct');
  const [bonusPct,    setBonusPct]    = useState(15);
  const [bonusFlat,   setBonusFlat]   = useState(18000);
  const [equity,      setEquity]      = useState(0);

  // ── Origin overrides ──
  const [originBurden,   setOriginBurden]   = useState(12.0);   // % (default for US)
  const [originBenefits, setOriginBenefits] = useState(16800);  // annual (1400*12)

  // ── Destination overrides ──
  const [destBonusMode,   setDestBonusMode]   = useState('pct');
  const [destBonusPct,    setDestBonusPct]    = useState(15);
  const [destBonusFlat,   setDestBonusFlat]   = useState(0);
  const [destEquity,      setDestEquity]      = useState(0);
  const [destSalaryMode,  setDestSalaryMode]  = useState('annual');
  const [destBurden,      setDestBurden]      = useState(12.0);
  const [destBenefits,    setDestBenefits]    = useState(16800);

  // ── Workforce planning ──
  const [headcount,              setHeadcount]              = useState(1);
  const [annualGrowth,           setAnnualGrowth]           = useState(3.0);
  const [savingsMode,            setSavingsMode]            = useState(false);
  const [destBaseSalaryOverride, setDestBaseSalaryOverride] = useState(null);

  // ── Share button ──
  const [copied, setCopied] = useState(false);
  const urlWriteTimer = useRef(null);
  const urlLoaded     = useRef(false);

  // ── FX rates ──
  const [fxRates, setFxRates] = useState(STATIC_FX_RATES);
  const [fxApiOk, setFxApiOk] = useState(false);

  // ── Restore state from URL params (runs once on mount, before IP detection) ──
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (!p.has('oc')) return;
    const oc = COUNTRIES.find(c => c.iso === p.get('oc'));
    if (!oc) return;
    setOriginState(oc);
    setOriginBurden(parseFloat(p.get('ob'))  || oc.burdenRate * 100);
    setOriginBenefits(parseInt(p.get('obf'), 10) || oc.fixedBenefits * 12);
    const bs = parseInt(p.get('bs'), 10);
    if (bs > 0) setBaseSalary(bs);
    const bm = p.get('bm');
    if (bm === 'amt') { setBonusMode('amount'); setBonusFlat(parseFloat(p.get('bp')) || 0); }
    else { setBonusMode('pct'); setBonusPct(parseFloat(p.get('bp')) || 15); }
    setEquity(parseInt(p.get('eq'), 10) || 0);
    const dc = p.get('dc');
    if (dc) {
      const dest = COUNTRIES.find(c => c.iso === dc);
      if (dest) {
        setDestinationState(dest);
        setDestBurden(parseFloat(p.get('db'))   || dest.burdenRate * 100);
        setDestBenefits(parseInt(p.get('dbf'), 10) || dest.fixedBenefits * 12);
        const dbm = p.get('dbm');
        if (dbm === 'amt') { setDestBonusMode('amount'); setDestBonusFlat(parseFloat(p.get('dbfl')) || 0); }
        else { setDestBonusMode('pct'); setDestBonusPct(parseFloat(p.get('dbp')) || 15); }
        setDestEquity(parseInt(p.get('dbeq'), 10) || 0);
      }
    }
    urlLoaded.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch live FX rates
  useEffect(() => {
    fetch(FX_API_URL)
      .then(r => r.json())
      .then(d => { if (d.rates) { setFxRates(d.rates); setFxApiOk(true); } })
      .catch(() => {});
  }, []);

  // Auto-detect user's country from IP and pre-fill origin
  useEffect(() => {
    if (urlLoaded.current) return; // skip if state was restored from URL
    const applyIpData = (d) => {
      setIpData(d);
      if (d.country_code && !origin) {
        const c = COUNTRIES.find(x => x.iso === d.country_code);
        if (c) {
          setOriginState(c);
          setOriginBurden(c.burdenRate * 100);
          setOriginBenefits(c.fixedBenefits * 12);
        }
      }
    };
    // 1. Check localStorage cache (24h TTL)
    try {
      const cached = localStorage.getItem(IP_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < IP_CACHE_TTL && data.country_code) {
          applyIpData(data);
          return;
        }
      }
    } catch (_) {}
    // 2. Try providers in sequence; cache on first success
    const tryNext = (urls) => {
      if (!urls.length) return;
      fetch(urls[0])
        .then(r => r.json())
        .then(d => {
          if (!d.country_code) throw new Error('no country_code');
          try { localStorage.setItem(IP_CACHE_KEY, JSON.stringify({ data: d, ts: Date.now() })); } catch (_) {}
          applyIpData(d);
        })
        .catch(() => tryNext(urls.slice(1)));
    };
    tryNext(IP_API_URLS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Write URL params (debounced 500ms) so state is shareable ──
  useEffect(() => {
    clearTimeout(urlWriteTimer.current);
    urlWriteTimer.current = setTimeout(() => {
      const p = new URLSearchParams();
      if (origin) {
        p.set('oc', origin.iso);
        p.set('ob', originBurden.toFixed(1));
        p.set('obf', String(originBenefits));
      }
      if (destination) {
        p.set('dc', destination.iso);
        p.set('db', destBurden.toFixed(1));
        p.set('dbf', String(destBenefits));
        p.set('dbm', destBonusMode === 'amount' ? 'amt' : 'pct');
        p.set('dbp', String(destBonusPct));
        p.set('dbfl', String(destBonusFlat));
        p.set('dbeq', String(destEquity));
      }
      p.set('bs', String(baseSalary));
      p.set('bm', bonusMode === 'amount' ? 'amt' : 'pct');
      p.set('bp', String(bonusMode === 'amount' ? bonusFlat : bonusPct));
      p.set('eq', String(equity));
      const qs = p.toString();
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    }, 500);
    return () => clearTimeout(urlWriteTimer.current);
  }, [origin, destination, baseSalary, bonusMode, bonusPct, bonusFlat, equity,
      originBurden, originBenefits, destBurden, destBenefits,
      destBonusMode, destBonusPct, destBonusFlat, destEquity]);

  // ── Derived bonus ──
  const effectiveBonusPct = useMemo(() =>
    bonusMode === 'pct' ? bonusPct : (baseSalary > 0 ? bonusFlat / baseSalary * 100 : 0),
    [bonusMode, bonusPct, bonusFlat, baseSalary]
  );

  // ── Location handlers ──
  const setOrigin = useCallback((c) => {
    setOriginState(c);
    if (!c) { setDestinationState(null); return; }
    setOriginBurden(c.burdenRate * 100);
    setOriginBenefits(c.fixedBenefits * 12);
  }, []);

  const setDestination = useCallback((c) => {
    setDestinationState(c);
    if (!c) return;
    setDestBurden(c.burdenRate * 100);
    setDestBenefits(c.fixedBenefits * 12);
  }, []);

  const handleCountryClick = useCallback((c) => {
    setOriginState(prev => {
      if (!prev) {
        setOriginBurden(c.burdenRate * 100);
        setOriginBenefits(c.fixedBenefits * 12);
        return c;
      }
      if (c.id === prev.id) { setDestinationState(null); return prev; }
      setDestinationState(cur => {
        if (cur?.id !== c.id) {
          setDestBurden(c.burdenRate * 100);
          setDestBenefits(c.fixedBenefits * 12);
          return c;
        }
        return cur;
      });
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setOriginState(null);
    setDestinationState(null);
  }, []);

  // ── Calculations ──
  const originCosts = useMemo(() =>
    calcCosts(origin, baseSalary, effectiveBonusPct, equity, originBurden, originBenefits),
    [origin, baseSalary, effectiveBonusPct, equity, originBurden, originBenefits]
  );

  // Always-cost-neutral baseline (used for salary insights + savings reference)
  const destCostsNeutral = useMemo(() => {
    if (!originCosts || !destination || !origin) return null;
    const originRate = fxRates[origin.currency]      || 1;
    const destRate   = fxRates[destination.currency] || 1;
    const flcDest    = (originCosts.total / originRate) * destRate;
    if (destBonusMode === 'pct') {
      return calcNeutralDest(flcDest, destination, destBonusPct, destEquity, false, destBurden, destBenefits);
    } else {
      return calcNeutralDest(flcDest, destination, destBonusFlat, destEquity, true, destBurden, destBenefits);
    }
  }, [originCosts, origin, destination, destBonusMode, destBonusPct, destBonusFlat, destEquity, fxRates, destBurden, destBenefits]);

  // Active dest costs: neutral normally, or override-based in savings mode
  const destCosts = useMemo(() => {
    if (savingsMode && destBaseSalaryOverride !== null && destination) {
      const effectivePct = destBonusMode === 'pct' ? destBonusPct
        : (destBaseSalaryOverride > 0 ? destBonusFlat / destBaseSalaryOverride * 100 : 0);
      return calcCosts(destination, destBaseSalaryOverride, effectivePct, destEquity, destBurden, destBenefits);
    }
    return destCostsNeutral;
  }, [destCostsNeutral, savingsMode, destBaseSalaryOverride, destination, destBonusMode, destBonusPct, destBonusFlat, destEquity, destBurden, destBenefits]);

  // When savings mode toggles on (or dest changes while on), pre-fill override with neutral base
  useEffect(() => {
    if (savingsMode) {
      setDestBaseSalaryOverride(destCostsNeutral ? Math.round(destCostsNeutral.base) : null);
    } else {
      setDestBaseSalaryOverride(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savingsMode, destination?.id]);

  const destDisplayBonusPct = destCosts
    ? (destCosts.base > 0 ? destCosts.bonus / destCosts.base * 100 : 0)
    : destBonusPct;

  const step = !origin ? 1 : !destination ? 2 : 3;

  // ── Salary display ──
  const salaryDisplayValue = salaryMode === 'annual' ? baseSalary : Math.round(baseSalary / 12);
  const handleSalaryChange = (raw) => {
    const val = raw ? Number(raw) : 0;
    setBaseSalary(salaryMode === 'annual' ? val : val * 12);
  };

  // ── Flag helper ──
  const FlagIcon = ({ iso, size = 14 }) => (
    <span className={`fi fi-${iso.toLowerCase()} shrink-0`}
      style={{ width: size, height: Math.round(size * 0.75), borderRadius: 2, display: 'inline-block' }} />
  );

  return (
    <div className="min-h-screen bg-space-950 text-slate-200 flex flex-col font-sans">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-space-900/80 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 rounded-xl shadow-lg shadow-blue-900/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight font-display leading-none">
                Comp<span className="text-blue-400">Pass</span>
              </h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Global Headcount Transfer Planner</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-medium bg-space-800/60 border border-slate-800 rounded-full px-5 py-1.5">
            {[
              { n:1, label:'Origin',      done: step >= 1 },
              { n:2, label:'Destination', done: step >= 2 },
              { n:3, label:'Budget',      done: step >= 3 },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className={`w-3 h-3 ${s.done ? 'text-slate-500' : 'text-slate-700'}`} />}
                <span className={`flex items-center gap-1.5 transition-colors ${s.done ? (s.n===3?'text-emerald-400':'text-blue-400') : 'text-slate-600'}`}>
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${s.done ? (s.n===3?'bg-emerald-500/20 text-emerald-400':'bg-blue-500/20 text-blue-400') : 'bg-slate-800 text-slate-600'}`}>{s.n}</span>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${copied ? 'bg-emerald-900/30 border-emerald-600/50 text-emerald-400' : 'bg-space-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button onClick={reset} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors bg-space-800 px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-600">
              <RefreshCw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className={`overflow-hidden transition-all duration-700 ${step === 3 ? 'max-h-0 opacity-0' : 'max-h-72 opacity-100'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-display leading-tight mb-2">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Know the Budget.</span>
                <br /><span className="text-white">Before You Move the Position.</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
                Model the full employer cost when transferring a position across borders. Select origin and destination countries to instantly see the cost-neutral salary, employer burden, and total loaded cost in the new location.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-end shrink-0">
              {[
                { icon: <Building2 className="w-3.5 h-3.5" />, label: '170+ Countries' },
                { icon: <BarChart3  className="w-3.5 h-3.5" />, label: 'Real Employer Burden' },
                { icon: <Sparkles  className="w-3.5 h-3.5" />, label: 'Instant Budget Model' },
              ].map(b => (
                <span key={b.label} className="flex items-center gap-1.5 bg-space-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="text-blue-400">{b.icon}</span> {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* Globe — sticky left panel */}
        <div className="w-full lg:w-[58%] h-[52vh] lg:h-[calc(100vh-64px)] lg:sticky lg:top-16 overflow-hidden">
          <GlobeSection origin={origin} destination={destination} onCountryClick={handleCountryClick} />
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-[42%] overflow-y-auto p-4 md:p-5 space-y-4">

          {/* ── Transfer Route ── */}
          <div className="bg-space-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400" /> Transfer Route
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <CountrySearch label="Origin" value={origin} onChange={setOrigin} placeholder="Search countries…" accentColor="blue"
                labelExtra={ipData && <IpTip data={ipData} />} />
              <CountrySearch label="Destination" value={destination} onChange={setDestination} placeholder="Search countries…" accentColor="green" />
            </div>
          </div>

          {/* ── Position Details (compact, 2-col when dest selected) ── */}
          {origin && (
            <div className="bg-space-800/60 border border-slate-700/50 rounded-2xl p-4 animate-fade-in-up">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Calculator className="w-3.5 h-3.5 text-blue-400" /> Position Details
              </h3>

              <div className={`grid gap-x-4 gap-y-2 ${destination ? 'grid-cols-2' : 'grid-cols-1'}`}>

                {/* ── Column headers ── */}
                <div className="flex items-center gap-1.5 pb-1 border-b border-blue-500/20">
                  <FlagIcon iso={origin.iso} />
                  <span className="text-xs font-bold text-blue-400 truncate">{origin.name}</span>
                  <span className="text-[9px] text-slate-600 font-mono ml-auto shrink-0">{origin.currency}</span>
                </div>
                {destination && (
                  <div className="flex items-center gap-1.5 pb-1 border-b border-emerald-500/20">
                    <FlagIcon iso={destination.iso} />
                    <span className="text-xs font-bold text-emerald-400 truncate">{destination.name}</span>
                    <span className="text-[9px] text-slate-600 font-mono ml-auto shrink-0">{destination.currency}</span>
                  </div>
                )}

                {/* ── Base Salary ── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Base Salary</label>
                    <ModeToggle value={salaryMode} opts={[{value:'annual',label:'Yr'},{value:'monthly',label:'Mo'}]} onChange={setSalaryMode} small />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{origin.symbol}</span>
                    <input type="text" value={salaryDisplayValue.toLocaleString()}
                      onChange={e => { const v = e.target.value.replace(/\D/g,''); handleSalaryChange(v); }}
                      className="w-full bg-space-900 border border-slate-700 rounded-lg py-2 pl-6 pr-3 text-sm text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all" />
                  </div>
                  {salaryMode === 'monthly' && <p className="text-[9px] text-slate-600 mt-0.5 pl-0.5">{origin.symbol}{baseSalary.toLocaleString()} / yr</p>}
                </div>
                {destination && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Base Salary</label>
                      <div className="flex items-center gap-1">
                        {/* Cost-Neutral / Savings mode toggle */}
                        <ModeToggle
                          value={savingsMode ? 'savings' : 'neutral'}
                          opts={[{value:'neutral',label:'C.N',title:'Cost Neutral'},{value:'savings',label:'Sav',title:'Show Savings'}]}
                          onChange={v => setSavingsMode(v === 'savings')}
                          small
                        />
                        {/* Yr / Mo always visible */}
                        <ModeToggle value={destSalaryMode} opts={[{value:'annual',label:'Yr'},{value:'monthly',label:'Mo'}]} onChange={setDestSalaryMode} small />
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{destination.symbol}</span>
                      {savingsMode ? (
                        <input type="text"
                          value={destSalaryMode === 'monthly'
                            ? Math.round((destBaseSalaryOverride ?? 0) / 12).toLocaleString()
                            : (destBaseSalaryOverride ?? 0).toLocaleString()}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g,'');
                            const annual = destSalaryMode === 'monthly' ? (v ? Number(v) * 12 : 0) : (v ? Number(v) : 0);
                            setDestBaseSalaryOverride(annual);
                          }}
                          className={`w-full bg-space-900 border rounded-lg py-2 pl-6 pr-3 text-sm font-mono outline-none transition-all ${
                            destBaseSalaryOverride !== null && destCostsNeutral && Math.abs(destBaseSalaryOverride - destCostsNeutral.base) > 1
                              ? 'border-amber-500/50 text-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20'
                              : 'border-emerald-700/40 text-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'}`}
                        />
                      ) : (
                        <input type="text" readOnly
                          value={destCosts ? (destSalaryMode === 'monthly' ? Math.round(destCosts.base/12) : Math.round(destCosts.base)).toLocaleString() : '—'}
                          className="w-full bg-space-950 border border-emerald-700/30 rounded-lg py-2 pl-6 pr-3 text-sm text-emerald-300 font-mono cursor-not-allowed" />
                      )}
                    </div>
                    {/* Hints below input */}
                    {!savingsMode && destSalaryMode === 'monthly' && destCosts && <p className="text-[9px] text-slate-600 mt-0.5 pl-0.5">{destination.symbol}{Math.round(destCosts.base).toLocaleString()} / yr</p>}
                    {savingsMode && destCostsNeutral && (
                      <div className="flex items-center justify-between mt-0.5 pl-0.5">
                        <p className="text-[9px] text-slate-500">
                          Cost-neutral: {destination.symbol}{destSalaryMode === 'monthly'
                            ? Math.round(destCostsNeutral.base / 12).toLocaleString()
                            : Math.round(destCostsNeutral.base).toLocaleString()}
                          {destSalaryMode === 'monthly' && destBaseSalaryOverride !== null &&
                            <span className="text-slate-600 ml-1">({destination.symbol}{Math.round(destBaseSalaryOverride).toLocaleString()}/yr)</span>}
                        </p>
                        {destBaseSalaryOverride !== null && Math.abs(destBaseSalaryOverride - destCostsNeutral.base) > 1 && (
                          <button onClick={() => setDestBaseSalaryOverride(Math.round(destCostsNeutral.base))}
                            className="text-[9px] text-slate-600 hover:text-amber-400 transition-colors">↺ reset</button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Bonus ── */}
                <BonusInput mode={bonusMode} onModeChange={setBonusMode} pct={bonusPct} onPctChange={setBonusPct}
                  flat={bonusFlat} onFlatChange={setBonusFlat} symbol={origin.symbol} baseSalary={baseSalary} />
                {destination && (
                  <BonusInput mode={destBonusMode} onModeChange={setDestBonusMode} pct={destBonusPct} onPctChange={setDestBonusPct}
                    flat={destBonusFlat} onFlatChange={setDestBonusFlat} symbol={destination.symbol} baseSalary={destCosts?.base ?? 0} />
                )}

                {/* ── Annual Equity ── */}
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Annual Equity</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{origin.symbol}</span>
                    <input type="text" value={equity.toLocaleString()}
                      onChange={e => { const v = e.target.value.replace(/\D/g,''); setEquity(v ? Number(v) : 0); }}
                      className="w-full bg-space-900 border border-slate-700 rounded-lg py-2 pl-6 pr-3 text-sm text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all" />
                  </div>
                </div>
                {destination && (
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Annual Equity</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{destination.symbol}</span>
                      <input type="text" value={destEquity.toLocaleString()}
                        onChange={e => { const v = e.target.value.replace(/\D/g,''); setDestEquity(v ? Number(v) : 0); }}
                        className="w-full bg-space-900 border border-slate-700 rounded-lg py-2 pl-6 pr-3 text-sm text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all" />
                    </div>
                  </div>
                )}

                {/* ── Employer Burden Override ── */}
                <OverridePct value={originBurden} onChange={setOriginBurden} defaultVal={origin.burdenRate * 100}
                  label="Employer Burden" tip={BURDEN_TIP} />
                {destination && (
                  <OverridePct value={destBurden} onChange={setDestBurden} defaultVal={destination.burdenRate * 100}
                    label="Employer Burden" tip={BURDEN_TIP} />
                )}

                {/* ── Fixed Benefits Override ── */}
                <OverrideAmt value={originBenefits} onChange={setOriginBenefits} defaultVal={origin.fixedBenefits * 12}
                  symbol={origin.symbol} label="Fixed Benefits /yr" tip={BENEFITS_TIP} />
                {destination && (
                  <OverrideAmt value={destBenefits} onChange={setDestBenefits} defaultVal={destination.fixedBenefits * 12}
                    symbol={destination.symbol} label="Fixed Benefits /yr" tip={BENEFITS_TIP} />
                )}

              </div>
            </div>
          )}

          {/* ── Single-country breakdown (origin only, no destination) ── */}
          {origin && originCosts && !destination && (
            <div className="bg-space-800/60 border border-blue-500/20 rounded-2xl overflow-hidden animate-fade-in-up">
              <div className="px-4 py-3 bg-space-900/50 border-b border-slate-700/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlagIcon iso={origin.iso} size={16} />
                  <span className="text-blue-300 font-bold text-sm">{origin.name}</span>
                  <span className="text-xs font-mono text-slate-600">{origin.currency}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Position Cost</span>
              </div>
              <div className="divide-y divide-slate-700/20">
                {[
                  { label: salaryMode === 'monthly' ? 'Base /mo' : 'Base /yr', val: salaryMode === 'monthly' ? Math.round(originCosts.base/12) : Math.round(originCosts.base) },
                  { label: `Bonus (${effectiveBonusPct.toFixed(1)}%)`, val: Math.round(originCosts.bonus), sub: true },
                  { label: 'Annual Equity', val: Math.round(originCosts.equity), sub: true },
                  { label: `Employer Burden (${originBurden.toFixed(1)}%)`, val: Math.round(originCosts.burden), plus: true },
                  { label: 'Fixed Benefits /yr', val: Math.round(originCosts.benefits), plus: true },
                ].map(({ label, val, sub, plus }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2">
                    <span className={`text-xs ${sub ? 'text-slate-500 pl-3' : plus ? 'text-slate-400' : 'text-slate-300'}`}>{label}</span>
                    <span className={`font-mono text-xs ${plus ? 'text-rose-400/80' : 'text-slate-200'}`}>{plus ? '+ ' : ''}{origin.symbol}{val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-space-900/40 border-t border-slate-700/40 flex justify-between items-center">
                <span className="text-slate-300 font-bold text-sm">Total Annual Cost</span>
                <span className="font-mono font-bold text-white">{origin.symbol}{Math.round(originCosts.total).toLocaleString()}</span>
              </div>
              {fxRates[origin.currency] && (
                <div className="px-4 py-2 border-t border-slate-700/30 flex justify-between items-center">
                  <span className="text-emerald-400 text-xs font-bold flex items-center gap-1"><DollarSign className="w-3 h-3" />Total (USD)</span>
                  <span className="font-mono font-bold text-emerald-300">${Math.round(originCosts.total / (fxRates[origin.currency] || 1)).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Cost Breakdown Chart ── */}
          {origin && destination && originCosts && destCosts && (
            <CostBreakdownChart
              origin={origin} destination={destination}
              originCosts={originCosts} destCosts={destCosts}
              fxRates={fxRates}
            />
          )}

          {/* ── Side-by-side Comparison Table (both countries) ── */}
          {origin && destination && originCosts && destCosts && (
            <ComparisonTable
              origin={origin} originCosts={originCosts}
              destination={destination} destCosts={destCosts}
              salaryMode={salaryMode} destSalaryMode={destSalaryMode}
              effectiveBonusPct={effectiveBonusPct} destDisplayBonusPct={destDisplayBonusPct}
              fxRates={fxRates} fxApiOk={fxApiOk}
              originBurden={originBurden} destBurden={destBurden}
            />
          )}

          {/* ── Transfer Bottom Line ── */}
          {origin && destination && destCostsNeutral && (
            <div className="bg-space-800/60 border border-blue-500/20 rounded-2xl overflow-hidden animate-fade-in-up">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-900/25 to-emerald-900/25 border-b border-slate-700/40 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Transfer Bottom Line</span>
              </div>
              {/* Narrative */}
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs text-slate-400 leading-relaxed">
                  To keep the budget flat when moving a position from{' '}
                  <span className="text-blue-300 font-semibold">{origin.name}</span> to{' '}
                  <span className="text-emerald-300 font-semibold">{destination.name}</span>, offer:
                </p>
              </div>
              {/* Key figures */}
              <div className="px-4 pb-4 space-y-0">
                {/* Base salary */}
                <div className="flex items-center justify-between py-2.5 border-b border-slate-700/20">
                  <span className="text-xs text-slate-500">Base salary</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-sm">
                      {destination.symbol}{Math.round(destCostsNeutral.base / 12).toLocaleString()}
                      <span className="text-slate-500 font-normal text-xs"> /mo</span>
                    </span>
                    <span className="text-slate-600 text-[10px] ml-2">
                      ({destination.symbol}{Math.round(destCostsNeutral.base).toLocaleString()} /yr)
                    </span>
                  </div>
                </div>
                {/* Annual bonus */}
                <div className="flex items-center justify-between py-2.5 border-b border-slate-700/20">
                  <span className="text-xs text-slate-500">Annual bonus</span>
                  <div className="text-right">
                    <span className="font-mono text-slate-200 text-sm">
                      {destination.symbol}{Math.round(destCostsNeutral.bonus).toLocaleString()}
                    </span>
                    <span className="text-slate-600 text-[10px] ml-2">
                      ({destDisplayBonusPct.toFixed(1)}% of base)
                    </span>
                  </div>
                </div>
                {/* Equity — only if non-zero */}
                {destCostsNeutral.equity > 0 && (
                  <div className="flex items-center justify-between py-2.5 border-b border-slate-700/20">
                    <span className="text-xs text-slate-500">Annual equity</span>
                    <span className="font-mono text-slate-200 text-sm">
                      {destination.symbol}{Math.round(destCostsNeutral.equity).toLocaleString()}
                    </span>
                  </div>
                )}
                {/* Total employer cost */}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs font-bold text-emerald-400">Total employer cost</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-300 text-sm">
                      {destination.symbol}{Math.round(destCostsNeutral.total).toLocaleString()}
                    </span>
                    {fxRates[destination.currency] && (
                      <span className="text-slate-500 text-[10px] ml-2">
                        (${Math.round(destCostsNeutral.total / fxRates[destination.currency]).toLocaleString()} USD)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Empty state ── */}
          {!origin && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 animate-fade-in">
              <div className="p-5 bg-space-800 rounded-full border border-slate-700">
                <Briefcase className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Select origin and destination countries to model your position transfer budget — or click any country on the globe.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
