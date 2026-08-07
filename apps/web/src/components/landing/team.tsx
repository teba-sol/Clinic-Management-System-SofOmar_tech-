import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal } from './reveal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const memberImages = ['/docy.jpg', '/femDocx.jpg', '/nurseX.jpg', '/labxy.jpg'];

interface StaffMember {
  id: string;
  name: string;
  role: 'doctor' | 'nurse' | 'lab_tech' | string;
}

export function Team() {
  const { t } = useTranslation();
  const [staff, setStaff] = useState<StaffMember[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API}/booking/staff`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) setStaff(data.slice(0, 8));
      })
      .catch(() => {
        if (active) setStaff([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!staff) return null;

  return (
    <section id="team" className="bg-brand-50/60 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 lg:text-4xl">{t('landing.team.title')}</h2>
          <p className="mt-3 text-base text-muted-foreground">{t('landing.team.subtitle')}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {staff.map((member, i) => (
            <Reveal key={member.id} delay={(i % 4) * 80}>
              <div className="group flex h-full flex-col items-center rounded-2xl border border-brand-100 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="[perspective:1000px]">
                  <div className="relative overflow-hidden rounded-2xl ring-1 ring-brand-100 transition-transform duration-500 ease-out [transform:translateY(0)_rotateX(0deg)_rotateY(0deg)] [transform-style:preserve-3d] group-hover:shadow-2xl group-hover:[transform:translateY(-2.5rem)_rotateX(-25deg)_rotateY(-45deg)]">
                    <img
                      src={memberImages[i % memberImages.length]}
                      alt={member.name}
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-brand-900">{member.name}</h3>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-brand-700">
                  {t(`landing.team.roles.${member.role}`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-10">
          <div className="group [perspective:1200px]">
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-brand-100 transition-transform duration-500 ease-out [transform:translateY(0)_rotateX(0deg)_rotateY(0deg)] [transform-style:preserve-3d] group-hover:shadow-2xl group-hover:[transform:translateY(-0.75rem)_rotateX(-5deg)_rotateY(0deg)]">
              <img src="/members.jpg" alt={t('landing.team.groupAlt')} className="w-full object-cover" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
