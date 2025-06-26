import useSWR from 'swr';

/**
 * Default fetcher for SWR
 */
const defaultFetcher = async (url) => {
  const res = await fetch(url);
  
  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

/**
 * Hook for fetching interns data with SWR
 */
export function useInterns(options = {}) {
  const { collegeId, mentorId, status, page = 1, limit = 50 } = options;
  
  // Build query string
  let queryString = `page=${page}&limit=${limit}`;
  if (collegeId) queryString += `&collegeId=${collegeId}`;
  if (mentorId) queryString += `&mentorId=${mentorId}`;
  if (status) queryString += `&status=${status}`;
  
  const { data, error, mutate, isLoading } = useSWR(
    `/api/interns?${queryString}`,
    defaultFetcher,
    {
      revalidateOnFocus: false, // Don't revalidate when window focuses
      revalidateOnReconnect: true, // Revalidate when browser regains connection
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      dedupingInterval: 30 * 1000, // Deduplicate requests within 30 seconds
    }
  );
  
  return {
    interns: data?.interns || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching college interns data with SWR (for super-mentors)
 */
export function useCollegeInterns() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/super-mentor/college-interns',
    defaultFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      dedupingInterval: 30 * 1000, // Deduplicate requests within 30 seconds
    }
  );
  
  return {
    interns: data?.interns || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching user profile data with SWR
 */
export function useProfile() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/profile',
    defaultFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 10 * 60 * 1000, // Refresh every 10 minutes
      dedupingInterval: 60 * 1000, // Deduplicate requests within 1 minute
    }
  );
  
  return {
    profile: data?.profile,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching attendance data with SWR
 */
export function useAttendance(userId, options = {}) {
  const { startDate, endDate } = options;
  
  // Build query string
  let queryString = userId ? `userId=${userId}` : '';
  if (startDate) queryString += `&startDate=${startDate}`;
  if (endDate) queryString += `&endDate=${endDate}`;
  
  const { data, error, mutate, isLoading } = useSWR(
    `/api/attendance${queryString ? `?${queryString}` : ''}`,
    defaultFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      dedupingInterval: 30 * 1000, // Deduplicate requests within 30 seconds
    }
  );
  
  return {
    attendance: data?.attendance || [],
    summary: data?.summary,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching tasks data with SWR
 */
export function useTasks(options = {}) {
  const { userId, status, categoryId, page = 1, limit = 50 } = options;
  
  // Build query string
  let queryString = `page=${page}&limit=${limit}`;
  if (userId) queryString += `&userId=${userId}`;
  if (status) queryString += `&status=${status}`;
  if (categoryId) queryString += `&categoryId=${categoryId}`;
  
  const { data, error, mutate, isLoading } = useSWR(
    `/api/tasks?${queryString}`,
    defaultFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      dedupingInterval: 30 * 1000, // Deduplicate requests within 30 seconds
    }
  );
  
  return {
    tasks: data?.tasks || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching GitLab activity data with SWR
 */
export function useGitLabActivity(username, options = {}) {
  const { days = 30 } = options;
  
  const { data, error, mutate, isLoading } = useSWR(
    `/api/gitlab/activity/${username}?days=${days}`,
    defaultFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30 * 60 * 1000, // Refresh every 30 minutes
      dedupingInterval: 5 * 60 * 1000, // Deduplicate requests within 5 minutes
    }
  );
  
  return {
    activity: data?.activity || [],
    stats: data?.stats,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}