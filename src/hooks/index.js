import { CONSTANT_USER_ROLE_ADMIN } from '@/config/constants';
import config from '@/services/(routes)/config';
import { useMemo } from 'react';
import useSWR from 'swr';

export function useProfiles() {
  const { data, error, isLoading, mutate } = useSWR(`${config.baseApiUrl}/profiles/get`);

  return {
    profiles: data?.profiles || [],
    error,
    isLoading,
    mutate // call this after add/edit/delete
  };
}

export function useProfilesByUserId(id) {
  const { data, error, isLoading, mutate } = useSWR(`${config.baseApiUrl}/profiles/get-profiles-by-userid?user=${id}`);

  return {
    profiles: data?.profiles || [],
    error,
    isLoading,
    mutate // call this after add/edit/delete
  };
}

export function usePhones() {
  const { data, error, isLoading, mutate } = useSWR(`${config.baseApiUrl}/phones/get`);

  return {
    phones: data?.phones || [],
    error,
    isLoading,
    mutate
  };
}

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR(`${config.baseApiUrl}/users/get`);

  return {
    users: data?.users || [],
    error,
    isLoading,
    mutate
  };
}

export function useInterviews(url) {
  const { data, error, isLoading, mutate } = useSWR(url);

  return {
    interviews: data?.interviews || [],
    total: data?.total || 0,
    error,
    isLoading,
    mutate
  };
}

export function useResumes(url) {
  const { data, error, isLoading, mutate } = useSWR(url);

  return {
    resumes: data?.resumes || [],
    total: data?.total || 0,
    error,
    isLoading,
    mutate
  };
}

export function useJobs(url) {
  const { data, error, isLoading, mutate } = useSWR(url);

  return {
    jobs: data?.jobs || [],
    total: data?.total || 0,
    error,
    isLoading,
    mutate
  };
}

export function useEffectiveProfiles(user) {
  const { profiles: allProfiles } = useProfiles();
  const { profiles: userProfiles } = useProfilesByUserId(user?.id);

  return useMemo(() => {
    return user?.role === CONSTANT_USER_ROLE_ADMIN
      ? allProfiles || []
      : userProfiles || [];
  }, [user?.role, allProfiles, userProfiles]);
}