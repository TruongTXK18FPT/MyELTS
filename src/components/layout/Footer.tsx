import Link from 'next/link';
import { GraduationCap, Mail, Phone, Twitter, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary/50 pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="font-headline text-2xl font-bold text-text-main">
                MyELTS
              </span>
            </Link>
            <p className="text-text-muted text-sm">
              Nền tảng học IELTS thông minh, cá nhân hóa lộ trình và luyện tập với AI.
            </p>
          </div>

          <div>
            <h3 className="font-headline font-semibold text-text-main mb-4">Tính năng</h3>
            <ul className="space-y-2">
              <li><Link href="/tests" className="text-sm text-text-muted hover:text-primary transition-colors">AI Test Center</Link></li>
              <li><Link href="/vocabulary" className="text-sm text-text-muted hover:text-primary transition-colors">Vocabulary Hub</Link></li>
              <li><Link href="/ai-chat" className="text-sm text-text-muted hover:text-primary transition-colors">IELTS Chat AI</Link></li>
              <li><Link href="/roadmap" className="text-sm text-text-muted hover:text-primary transition-colors">Roadmap cá nhân</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-headline font-semibold text-text-main mb-4">Liên hệ</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm text-text-muted">support@myelts.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm text-text-muted">0123 456 789</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-headline font-semibold text-text-main mb-4">Theo dõi chúng tôi</h3>
            <div className="flex space-x-4">
                <Link href="#" className="text-text-muted hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
                <Link href="#" className="text-text-muted hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
                <Link href="#" className="text-text-muted hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} MyELTS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
