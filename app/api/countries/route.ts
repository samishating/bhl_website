import { NextResponse } from 'next/server';

const countries = [
  { name: 'France', code: 'FR', dial_code: '+33', flag: '🇫🇷' },
  { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧' },
  { name: 'Germany', code: 'DE', dial_code: '+49', flag: '🇩🇪' },
  { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dial_code: '+61', flag: '🇦🇺' },
  { name: 'Spain', code: 'ES', dial_code: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: 'IT', dial_code: '+39', flag: '🇮🇹' },
  { name: 'Netherlands', code: 'NL', dial_code: '+31', flag: '🇳🇱' },
  { name: 'Belgium', code: 'BE', dial_code: '+32', flag: '🇧🇪' },
  { name: 'Switzerland', code: 'CH', dial_code: '+41', flag: '🇨🇭' },
  { name: 'Austria', code: 'AT', dial_code: '+43', flag: '🇦🇹' },
  { name: 'Sweden', code: 'SE', dial_code: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dial_code: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', dial_code: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: 'FI', dial_code: '+358', flag: '🇫🇮' },
  { name: 'Portugal', code: 'PT', dial_code: '+351', flag: '🇵🇹' },
  { name: 'Ireland', code: 'IE', dial_code: '+353', flag: '🇮🇪' },
  { name: 'Japan', code: 'JP', dial_code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dial_code: '+82', flag: '🇰🇷' },
  { name: 'China', code: 'CN', dial_code: '+86', flag: '🇨🇳' },
  { name: 'India', code: 'IN', dial_code: '+91', flag: '🇮🇳' },
  { name: 'Brazil', code: 'BR', dial_code: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dial_code: '+52', flag: '🇲🇽' },
  { name: 'Morocco', code: 'MA', dial_code: '+212', flag: '🇲🇦' },
  { name: 'Algeria', code: 'DZ', dial_code: '+213', flag: '🇩🇿' },
  { name: 'Tunisia', code: 'TN', dial_code: '+216', flag: '🇹🇳' },
  { name: 'United Arab Emirates', code: 'AE', dial_code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', dial_code: '+966', flag: '🇸🇦' },
  { name: 'Turkey', code: 'TR', dial_code: '+90', flag: '🇹🇷' },
].sort((a, b) => a.name.localeCompare(b.name));

export async function GET() {
  return NextResponse.json({ countries });
}
