'use client';
import { Select, Input, Space, Row, Col, Form } from 'antd';
import { useEffect, useState } from 'react';
import { useGlobalContext } from '@/context/auth';
import { isValidJobUrl, showToastErrorMsg, showToastInfoMsg } from '@/helpers/frontend';
import { ContentWrapper, Container, StyledButton } from '@/_components/layout/client/styled';
import profileService from '@/services/(routes)/profiles';

const { TextArea } = Input;

export default function ResumePage() {
  const { loginUser } = useGlobalContext();
  const { user: currentUser } = loginUser || {};

  const [jobUrl, setUrl] = useState('');
  const [jobUrlError, setJobUrlError] = useState(null);
  const [jobDesc, setDesc] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');

  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState('');

  const [isWorking, setWorking] = useState(false);
  const [isCovering, setCovering] = useState(false);

  const [resumeExists, setResumeExists] = useState(false);
  const [canGenerateCover, setCanGenerateCover] = useState(false);
  const [checkedDuplicate, setCheckedDuplicate] = useState(false);

  const fetchProfiles = async () => {
    try {
      const data = await profileService.getProfilesByUserId();
      if (!data.error) setProfiles(data.profiles || []);
      else showToastErrorMsg(data.msg);
    } catch {
      showToastErrorMsg('Failed to load profiles.');
    }
  };

  useEffect(() => {
    if (currentUser) fetchProfiles();
  }, [currentUser]);

  const checkResumeExists = async () => {
    const res = await fetch('/api/resume/check-valid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        jobLink: jobUrl,
        jobDescription: jobDesc,
        companyName,
        position
      })
    });

    const data = await res.json();
    return data.exists;
  };

  useEffect(() => {
    if (checkedDuplicate && resumeExists && !canGenerateCover) {
      showToastErrorMsg('This resume already exists. Generation disabled.');
    }
  }, [resumeExists, checkedDuplicate, canGenerateCover]);

  useEffect(() => {
    setResumeExists(false);
    setCanGenerateCover(false);
    setWorking(false);
    setCheckedDuplicate(false);
  }, [jobUrl, jobDesc, profileId, companyName, position]);

  const generateResumePDF = async () => {
    setWorking(true);

    if (!jobUrl || !isValidJobUrl(jobUrl)) {
      setWorking(false);
      setJobUrlError('Please enter a valid Job URL');
      return showToastErrorMsg('Invalid Job URL');
    }

    if (!jobDesc || !profileId || !companyName || !position) {
      setWorking(false);
      return showToastErrorMsg('Please fill all required fields');
    }

    const exists = await checkResumeExists();
    setCheckedDuplicate(true);

    if (exists) {
      setResumeExists(true);
      setWorking(false);
      return;
    }

    const a = {
      url: jobUrl,
      desc: jobDesc,
      profileId,
      userId: currentUser.id,
      companyName,
      position
    };

    try {
      const res = await fetch('/api/resume/create-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: jobUrl,
          desc: jobDesc,
          profileId,
          userId: currentUser.id,
          companyName,
          position
        })
      });

      if (!res.ok) throw new Error('Failed to generate resume');

      const blob = await res.blob();
      const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'resume.pdf';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setCanGenerateCover(true);
      setResumeExists(true);
      showToastInfoMsg('Resume generated successfully!');
    } catch {
      showToastErrorMsg('Resume generation failed.');
    }

    setWorking(false);
  };

  const generateCoverPDF = async () => {
    if (!companyName || !position) {
      return showToastErrorMsg('Company and position required');
    }

    setCovering(true);

    try {
      const res = await fetch('/api/resume/create-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: jobUrl,
          desc: jobDesc,
          profileId,
          companyName,
          position
        })
      });

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'cover.pdf';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      showToastInfoMsg('Cover letter generated!');
    } catch {
      showToastErrorMsg('Cover generation failed.');
    }

    setCovering(false);
    setCanGenerateCover(false);
  };

  return (
    <ContentWrapper className='resume'>
      <Container>
        <Form layout='vertical'>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label='Job URL'>
                <Input
                  placeholder='Job URL'
                  value={jobUrl}
                  disabled={isWorking}
                  status={jobUrlError ? 'error' : undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUrl(value.trim());

                    if (!value) {
                      setJobUrlError('Job URL is required');
                    } else if (!isValidJobUrl(value)) {
                      setJobUrlError('Please enter a valid URL (https://...)');
                    } else {
                      setJobUrlError(null);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Profile'>
                <Select
                  placeholder='Select Profile'
                  disabled={isWorking}
                  value={profileId || undefined}
                  onChange={setProfileId}
                  options={profiles.map((p) => ({
                    label: p.profileName,
                    value: p._id
                  }))}
                  optionFilterProp='label'
                  showSearch
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label='Company Name'>
                <Input
                  placeholder='Company Name'
                  value={companyName}
                  disabled={isWorking}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Position'>
                <Input placeholder='Position' value={position} disabled={isWorking} onChange={(e) => setPosition(e.target.value)} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <TextArea
              rows={24}
              placeholder='Paste Job Description'
              value={jobDesc}
              disabled={isWorking}
              onChange={(e) => setDesc(e.target.value)}
            />
          </Form.Item>

          <Space>
            <StyledButton
              variant='primary'
              size='large'
              disabled={isWorking || resumeExists || !!jobUrlError || !companyName || !position}
              loading={isWorking}
              onClick={generateResumePDF}
            >
              {resumeExists ? 'Resume Already Exists' : 'Generate Resume'}
            </StyledButton>
            {canGenerateCover && (
              <StyledButton variant='secondary' size='large' loading={isCovering} onClick={generateCoverPDF}>
                Generate Cover
              </StyledButton>
            )}
          </Space>
        </Form>
      </Container>
    </ContentWrapper>
  );
}
