'use client';

import { ProfileCard } from '@/_components/layout/common/ProfileCard';
import { Collapse, Typography } from 'antd';

export default function ProfilePage({ profiles }) {
  if (!Array.isArray(profiles) || profiles.length === 0) return null;

  if (profiles.length === 1) {
    return <ProfileCard profile={profiles[0]} />;
  }

  return (
    <div style={{ maxWidth: 1280, margin: '64px auto', padding: '0 24px' }}>
      <Collapse
        accordion
        size='large'
        expandIconPosition='start'
        className='profile-collapse'
        expandIcon={({ isActive }) => (
          <span
            style={{
              transition: 'transform 0.2s',
              transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: 16
            }}
          >
            ▶
          </span>
        )}
      >
        {profiles.map((profile) => (
          <Collapse.Panel
            header={
              <Typography.Title level={2} style={{ marginBottom: 4 }}>
                {profile.profileName}
              </Typography.Title>
            }
            key={profile._id}
          >
            <ProfileCard profile={profile} />
          </Collapse.Panel>
        ))}
      </Collapse>
    </div>
  );
}
