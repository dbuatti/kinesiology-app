"use client";

import React from 'react';
import DocInput from './DocInput';

interface EmbedSectionProps {
  appointment: any;
  saveField: (field: string, value: any) => Promise<void>;
}

const EmbedSection = ({ appointment, saveField }: EmbedSectionProps) => {
  const handleFieldChange = (field: string, value: string) => {
    saveField(field, value);
  };

  return (
    <div className="space-y-10">
      <DocInput 
        label="Final Re-Assessment & Prescribed Homework" 
        value={appointment.session_north_star} 
        field="session_north_star" 
        placeholder="Verify integration and define the client's daily practice..." 
        multiline 
        onChange={handleFieldChange}
      />
      <DocInput 
        label="General Session Notes" 
        value={appointment.notes} 
        field="notes" 
        placeholder="Any additional observations or context..." 
        multiline 
        onChange={handleFieldChange}
      />
      <DocInput 
        label="Practitioner Reflection (Private)" 
        value={appointment.journal} 
        field="journal" 
        placeholder="Personal insights for the Sandbox..." 
        multiline 
        onChange={handleFieldChange}
      />
    </div>
  );
};

export default EmbedSection;