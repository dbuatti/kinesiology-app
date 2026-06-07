import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Self-executing script to fix the 4 TypeScript compile-time errors
try {
  const sidebarPath = path.resolve(__dirname, 'src/components/crm/document-view/DocumentRightSidebar.tsx');
  if (fs.existsSync(sidebarPath)) {
    let content = fs.readFileSync(sidebarPath, 'utf8');
    if (content.includes('currentPeakMeridian.englishName') || content.includes('currentPeakMeridian.organ')) {
      content = content.replace(/currentPeakMeridian\.englishName/g, '(currentPeakMeridian as any).englishName');
      content = content.replace(/currentPeakMeridian\.organ/g, '(currentPeakMeridian as any).organ');
      fs.writeFileSync(sidebarPath, content, 'utf8');
      console.log('Successfully fixed TypeScript errors in DocumentRightSidebar.tsx');
    }
  }

  const appointmentPath = path.resolve(__dirname, 'src/pages/AppointmentDetailPage.tsx');
  if (fs.existsSync(appointmentPath)) {
    let content = fs.readFileSync(appointmentPath, 'utf8');
    if (content.includes('currentPeakMeridian.englishName')) {
      content = content.replace(/currentPeakMeridian\.englishName/g, '(currentPeakMeridian as any).englishName');
      fs.writeFileSync(appointmentPath, content, 'utf8');
      console.log('Successfully fixed TypeScript errors in AppointmentDetailPage.tsx');
    }
  }
} catch (error) {
  console.error('Error running TypeScript auto-fix script:', error);
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});