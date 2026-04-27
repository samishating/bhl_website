import { NextResponse } from 'next/server';

const countries = [
  { name: 'France', code: 'FR', dial_code: '+33' },
  { name: 'United States', code: 'US', dial_code: '+1' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44' },
  { name: 'Germany', code: 'DE', dial_code: '+49' },
  { name: 'Canada', code: 'CA', dial_code: '+1' },
  { name: 'Australia', code: 'AU', dial_code: '+61' },
  { name: 'Spain', code: 'ES', dial_code: '+34' },
  { name: 'Italy', code: 'IT', dial_code: '+39' },
  { name: 'Netherlands', code: 'NL', dial_code: '+31' },
  { name: 'Belgium', code: 'BE', dial_code: '+32' },
  { name: 'Switzerland', code: 'CH', dial_code: '+41' },
  { name: 'Austria', code: 'AT', dial_code: '+43' },
  { name: 'Sweden', code: 'SE', dial_code: '+46' },
  { name: 'Norway', code: 'NO', dial_code: '+47' },
  { name: 'Denmark', code: 'DK', dial_code: '+45' },
  { name: 'Finland', code: 'FI', dial_code: '+358' },
  { name: 'Portugal', code: 'PT', dial_code: '+351' },
  { name: 'Ireland', code: 'IE', dial_code: '+353' },
  { name: 'Japan', code: 'JP', dial_code: '+81' },
  { name: 'South Korea', code: 'KR', dial_code: '+82' },
  { name: 'China', code: 'CN', dial_code: '+86' },
  { name: 'India', code: 'IN', dial_code: '+91' },
  { name: 'Brazil', code: 'BR', dial_code: '+55' },
  { name: 'Mexico', code: 'MX', dial_code: '+52' },
  { name: 'Morocco', code: 'MA', dial_code: '+212' },
  { name: 'Algeria', code: 'DZ', dial_code: '+213' },
  { name: 'Tunisia', code: 'TN', dial_code: '+216' },
  { name: 'United Arab Emirates', code: 'AE', dial_code: '+971' },
  { name: 'Saudi Arabia', code: 'SA', dial_code: '+966' },
  { name: 'Turkey', code: 'TR', dial_code: '+90' },
].sort((a, b) => a.name.localeCompare(b.name));

export async function GET() {
  return NextResponse.json({ countries });
}
