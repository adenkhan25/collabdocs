'use client';

import { Download, FileDown, FileText, Code2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api';

export function ExportMenu({ documentId }: { documentId: string }) {
  const download = (format: 'pdf' | 'docx' | 'html') => {
    const token = localStorage.getItem('collabdocs_token');
    const url = `${API_URL}/documents/${documentId}/export/${format}?token=${encodeURIComponent(
      token || ''
    )}`;
    window.open(url, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => download('pdf')}>
          <FileDown className="h-4 w-4" /> Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => download('docx')}>
          <FileText className="h-4 w-4" /> Export as DOCX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => download('html')}>
          <Code2 className="h-4 w-4" /> Export as HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
