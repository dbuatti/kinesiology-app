
import type { ReactNode } from 'react';
import { PRIMITIVE_REFLEXES } from '@/data/primitive-reflex-data';
import { CRANIAL_NERVES } from '@/data/cranial-nerve-data';
import { MUSCLE_GROUPS, MIDLINE_MUSCLES } from '@/data/muscle-data';
import CheckItem from './CheckItem';

interface AlignSectionProps {
  pattern: any;
  onToggle: (category: string, name: string, nextStatus: string, side?: 'L' | 'R') => void;
}

const SubHeader = ({ id, children }: { id?: string; children: ReactNode }) => (
  <h3 id={id} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 mt-10 border-l-4 border-slate-200 pl-3 scroll-mt-24">{children}</h3>
);

const AlignSection = ({ pattern, onToggle }: AlignSectionProps) => {
  // Helper to map group name to ID
  const getGroupId = (groupName: string) => {
    if (groupName.includes('Intrinsic')) return 'a-m-intrinsic';
    if (groupName.includes('Upper')) return 'a-m-upper';
    if (groupName.includes('Arm')) return 'a-m-arm';
    if (groupName.includes('Head')) return 'a-m-head';
    if (groupName.includes('Lower Body')) return 'a-m-lower';
    if (groupName.includes('Lower Leg')) return 'a-m-foot';
    return '';
  };

  return (
    <div className="space-y-16">
      <div id="a-reflexes" className="scroll-mt-24">
        <SubHeader>Primitive Reflexes</SubHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
          {PRIMITIVE_REFLEXES.map(reflex => (
            <div key={reflex.id} className="space-y-0.5">
              {reflex.isLateralized ? (
                <>
                  <CheckItem category="primitiveReflexes" name={reflex.name} side="L" pattern={pattern} onToggle={onToggle} />
                  <CheckItem category="primitiveReflexes" name={reflex.name} side="R" pattern={pattern} onToggle={onToggle} />
                </>
              ) : (
                <CheckItem category="primitiveReflexes" name={reflex.name} pattern={pattern} onToggle={onToggle} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div id="a-nerves" className="scroll-mt-24">
        <SubHeader>Cranial Nerves</SubHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
          {CRANIAL_NERVES.map(nerve => {
            const name = `${nerve.name}: ${nerve.latinName}`;
            return (
              <div key={nerve.id} className="space-y-0.5">
                {nerve.isLateralized ? (
                  <>
                    <CheckItem category="cranialNerves" name={name} side="L" pattern={pattern} onToggle={onToggle} />
                    <CheckItem category="cranialNerves" name={name} side="R" pattern={pattern} onToggle={onToggle} />
                  </>
                ) : (
                  <CheckItem category="cranialNerves" name={name} pattern={pattern} onToggle={onToggle} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div id="a-muscles" className="scroll-mt-24">
        <SubHeader>Muscle Assessment</SubHeader>
        <div className="space-y-12">
          {Object.entries(MUSCLE_GROUPS).map(([group, muscles]) => (
            <div key={group} id={getGroupId(group)} className="space-y-3 scroll-mt-24">
              <h4 className="text-[9px] font-black uppercase text-slate-400 border-l-2 border-slate-200 pl-2 tracking-widest">{group}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-0.5">
                {muscles.map(muscle => (
                  <div key={muscle} className="space-y-0.5">
                    {MIDLINE_MUSCLES.includes(muscle) ? (
                      <CheckItem category="muscles" name={muscle} pattern={pattern} onToggle={onToggle} />
                    ) : (
                      <>
                        <CheckItem category="muscles" name={muscle} side="L" pattern={pattern} onToggle={onToggle} />
                        <CheckItem category="muscles" name={muscle} side="R" pattern={pattern} onToggle={onToggle} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlignSection;