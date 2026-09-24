import { BookOpen, ChartPie, FileText, Globe, MailOpen, Megaphone, Presentation, Printer, QrCode, Sparkles, Zap } from 'lucide-react';

const ICONS = { BookOpen, ChartPie, FileText, Globe, MailOpen, Megaphone, Presentation, Printer, QrCode, Sparkles, Zap };

export default function ServiceIcon({ name, size = 22, ...rest }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" {...rest} />;
}
