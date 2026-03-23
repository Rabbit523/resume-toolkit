import { Typography, Row, Col } from 'antd';
import Image from 'next/image';

export const AvatarFallback = ({ name }) => {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: '#1677ff',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        fontWeight: 600
      }}
    >
      {initials}
    </div>
  );
};

function Section({ title, children }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        marginBottom: 32,
        boxShadow: '0 6px 20px rgba(0,0,0,0.05)'
      }}
    >
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        {title}
      </Typography.Title>
      {children}
    </div>
  );
}

export const ProfileCard = ({ profile }) => {
  return (
    <div
      style={{
        maxWidth: 1280,
        padding: '0 24px'
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 32,
          marginBottom: 32,
          boxShadow: '0 6px 20px rgba(0,0,0,0.06)'
        }}
      >
        <Row gutter={32} align='middle'>
          <Col>
            {profile.avatar ? (
              <Image src={profile.avatar} alt={profile.profileName} width={120} height={120} style={{ borderRadius: '50%' }} />
            ) : (
              <AvatarFallback name={profile.profileName} />
            )}
          </Col>

          <Col flex='auto'>
            <Typography.Title level={2} style={{ marginBottom: 4 }}>
              {profile.profileName}
            </Typography.Title>

            <Typography.Text type='secondary' style={{ fontSize: 16 }}>
              {profile.profileTitle}
            </Typography.Text>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {profile.profileEmail && (
                <Typography.Text>
                  📧 <a href={`mailto:${profile.profileEmail}`}>{profile.profileEmail}</a>
                </Typography.Text>
              )}

              {profile.profileMobile && <Typography.Text>📞 {profile.profileMobile}</Typography.Text>}

              {profile.profileLinkedIn && (
                <Typography.Text>
                  🔗{' '}
                  <a
                    href={profile.profileLinkedIn.startsWith('http') ? profile.profileLinkedIn : `https://${profile.profileLinkedIn}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    LinkedIn Profile
                  </a>
                </Typography.Text>
              )}

              {(profile.profileAddress?.street ||
                profile.profileAddress?.city ||
                profile.profileAddress?.state ||
                profile.profileAddress?.country) && (
                <Typography.Text type='secondary'>
                  📍{' '}
                  {[
                    profile.profileAddress?.street,
                    profile.profileAddress?.city,
                    profile.profileAddress?.state,
                    profile.profileAddress?.country
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Typography.Text>
              )}
            </div>
          </Col>
        </Row>
      </div>

      {profile.summary && (
        <Section title='About'>
          <Typography.Paragraph style={{ fontSize: 15 }}>{profile.summary}</Typography.Paragraph>
        </Section>
      )}

      {Array.isArray(profile.skills) && profile.skills.length > 0 && (
        <Section title='Skills'>
          <Row gutter={[12, 12]}>
            {profile.skills.map((skill) => (
              <Col key={skill}>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: '#f5f7fa',
                    border: '1px solid #e5e7eb',
                    fontSize: 13
                  }}
                >
                  {skill}
                </span>
              </Col>
            ))}
          </Row>
        </Section>
      )}

      {Array.isArray(profile.profileEducation) && profile.profileEducation.length > 0 && (
        <Section title='Education'>
          {profile.profileEducation.map((edu, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <Typography.Text strong>{edu.institution}</Typography.Text>
              <div style={{ fontSize: 14, color: '#555' }}>
                {edu.fieldOfStudy} — {edu.educationLevel}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {edu.startDate} – {edu.yearOfCompletion}
              </div>
            </div>
          ))}
        </Section>
      )}

      {Array.isArray(profile.profileWorkExperience) && profile.profileWorkExperience.length > 0 && (
        <Section title='Work Experience'>
          {profile.profileWorkExperience.map((exp, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 20,
                marginBottom: 16
              }}
            >
              <Row gutter={16}>
                <Col span={10}>
                  <Typography.Text strong>{exp.employer}</Typography.Text>
                  <div style={{ fontSize: 14 }}>{exp.jobTitle}</div>
                </Col>

                <Col span={8}>
                  <div style={{ fontSize: 13 }}>
                    {exp.startDate} – {exp.endDate || 'Present'}
                  </div>
                </Col>

                <Col span={6}>
                  <div style={{ fontSize: 13, color: '#666' }}>{exp.location || 'N/A'}</div>
                </Col>
              </Row>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
};
