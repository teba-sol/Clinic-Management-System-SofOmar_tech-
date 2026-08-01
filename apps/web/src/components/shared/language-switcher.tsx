import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromoo' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onValueChange={(v) => i18n.changeLanguage(v)}
    >
      <SelectTrigger className="w-32 h-8 text-xs gap-1">
        <Globe className="size-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
