-- Add new column for Harmonic Rocking Notes
ALTER TABLE public.appointments
ADD COLUMN harmonic_rocking_notes TEXT;

-- Update the RLS policy for appointments to allow updates on the new column
-- RLS policy 'Users can manage their own appointments' already covers all columns (*)

-- Update the auto-tracking function to include the new procedure
CREATE OR REPLACE FUNCTION public.increment_procedure_count()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Track BOLT Test
  IF (TG_OP = 'INSERT' AND NEW.bolt_score IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.bolt_score IS NOT NULL AND 
      (OLD.bolt_score IS NULL OR OLD.bolt_score != NEW.bolt_score)) THEN
    
    PERFORM auto_track_procedure(
      NEW.user_id,
      'BOLT Test',
      'Body Oxygen Level Test - measures CO2 tolerance and breathing efficiency',
      'flask'
    );
    
    UPDATE public.procedures
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id 
      AND LOWER(name) LIKE '%bolt%'
      AND enabled = true
      AND current_count < target_count;
  END IF;
  
  -- Track Heart/Brain Coherence Assessment
  IF (TG_OP = 'INSERT' AND NEW.coherence_score IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.coherence_score IS NOT NULL AND 
      (OLD.coherence_score IS NULL OR OLD.coherence_score != NEW.coherence_score)) THEN
    
    PERFORM auto_track_procedure(
      NEW.user_id,
      'Heart/Brain Coherence',
      'Assessment of heart-brain integration and autonomic regulation',
      'activity'
    );
    
    UPDATE public.procedures
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id 
      AND LOWER(name) LIKE '%coherence%'
      AND enabled = true
      AND current_count < target_count;
  END IF;
  
  -- Track Range of Motion Assessment (Cogs)
  IF (TG_OP = 'INSERT' AND (NEW.sagittal_plane_notes IS NOT NULL OR NEW.frontal_plane_notes IS NOT NULL OR NEW.transverse_plane_notes IS NOT NULL)) OR 
     (TG_OP = 'UPDATE' AND (NEW.sagittal_plane_notes IS NOT NULL OR NEW.frontal_plane_notes IS NOT NULL OR NEW.transverse_plane_notes IS NOT NULL) AND 
      (OLD.sagittal_plane_notes IS NULL OR OLD.frontal_plane_notes IS NULL OR OLD.transverse_plane_notes IS NULL OR
       OLD.sagittal_plane_notes IS DISTINCT FROM NEW.sagittal_plane_notes OR OLD.frontal_plane_notes IS DISTINCT FROM NEW.frontal_plane_notes OR OLD.transverse_plane_notes IS DISTINCT FROM NEW.transverse_plane_notes)) THEN
    
    PERFORM auto_track_procedure(
      NEW.user_id,
      'Range of Motion Assessment',
      'Cogs - Mobility evaluation across sagittal, frontal, and transverse planes',
      'target'
    );
    
    UPDATE public.procedures
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id 
      AND (LOWER(name) LIKE '%range of motion%' OR LOWER(name) LIKE '%cogs%')
      AND enabled = true
      AND current_count < target_count;
  END IF;
  
  -- Track Fakuda Step Test
  IF (TG_OP = 'INSERT' AND NEW.fakuda_notes IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.fakuda_notes IS NOT NULL AND OLD.fakuda_notes IS DISTINCT FROM NEW.fakuda_notes) THEN
    
    PERFORM auto_track_procedure(
      NEW.user_id,
      'Fakuda Step Test',
      'Neurological assessment for midline/vestibule cerebellum imbalances',
      'footprints'
    );
    
    UPDATE public.procedures
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id 
      AND LOWER(name) LIKE '%fakuda%'
      AND enabled = true
      AND current_count < target_count;
  END IF;

  -- Track Sharpened Rhombergs Test
  IF (TG_OP = 'INSERT' AND NEW.sharpened_rhombergs_notes IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.sharpened_rhombergs_notes IS NOT NULL AND OLD.sharpened_rhombergs_notes IS DISTINCT FROM NEW.sharpened_rhombergs_notes) THEN
    
    PERFORM auto_track_procedure(
      NEW.user_id,
      'Sharpened Rhombergs Test',
      'Neurological assessment for midline cerebellum and proprioception',
      'scale'
    );
    
    UPDATE public.procedures
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id 
      AND LOWER(name) LIKE '%rhombergs%'
      AND enabled = true
      AND current_count < target_count;
  END IF;

  -- Track Frontal Lobe Assessment
  IF (TG_OP = 'INSERT' AND NEW.frontal_lobe_notes IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.frontal_lobe_notes IS NOT NULL AND OLD.frontal_lobe_notes IS DISTINCT FROM NEW.frontal_lobe_notes) THEN
    
    PERFORM auto_track_procedure(
      NEW.user_id,
      'Frontal Lobe Assessment',
      'Rapid open/closed hand drill to assess frontal cortex asymmetry',
      'hand'
    );
    
    UPDATE public.procedures
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id 
      AND LOWER(name) LIKE '%frontal lobe%'
      AND enabled = true
      AND current_count < target_count;
  END IF;
  
  -- Track Sympathetic Down Regulation (Harmonic Rocking)
  IF (TG_OP = 'INSERT' AND NEW.harmonic_rocking_notes IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.harmonic_rocking_notes IS NOT NULL AND OLD.harmonic_rocking_notes IS DISTINCT FROM NEW.harmonic_rocking_notes) THEN
    
    PERFORM auto_track_procedure(
      NEW.user_id,
      'Sympathetic Down Regulation',
      'Harmonic Rocking technique to shift nervous system state',
      'heart'
    );
    
    UPDATE public.procedures
    SET current_count = current_count + 1
    WHERE user_id = NEW.user_id 
      AND LOWER(name) LIKE '%sympathetic down regulation%'
      AND enabled = true
      AND current_count < target_count;
  END IF;
  
  RETURN NEW;
END;
$$;