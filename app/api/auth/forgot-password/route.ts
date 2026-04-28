import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { sendResetPasswordEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    // For security, always return success even if user doesn't exist
    // to prevent account enumeration attacks.
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Hash token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Save hashed token and expiry (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    // Send email (with unhashed token)
    const result = await sendResetPasswordEmail(user.email, token);
    
    if (!result.success) {
      console.error('[ForgotPassword] Email failed:', result.error);
      // In development, you might want to show the token if email fails
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          message: 'Email failed to send. Token (DEV ONLY): ' + token,
          token 
        });
      }
    }

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[ForgotPassword] Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
