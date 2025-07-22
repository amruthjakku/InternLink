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
 * Hook for fetching AI developer interns data with SWR
 */
export function useAIDeveloperInterns(options = {}) {
  const { collegeId, techLeadId, status, page = 1, limit = 50 } = options;
  
  // Build query string
  let queryString = `page=${page}&limit=${limit}`;
  if (collegeId) queryString += `&collegeId=${collegeId}`;
  if (techLeadId) queryString += `&techLeadId=${techLeadId}`;
  if (status) queryString += `&status=${status}`;

  const { data, error, mutate, isLoading } = useSWR(
    `/api/ai-developer-interns?${queryString}`,
    defaultFetcher,
    {
      revalidateOnFocus: false, // Don't revalidate when window focuses
      revalidateOnReconnect: true, // Revalidate when browser regains connection
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      dedupingInterval: 30 * 1000, // Deduplicate requests within 30 seconds
    }
  );
  
  return {
    aiDeveloperAI Developer Interns: data?.aiDeveloperAI Developer Interns || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Hook for fetching college AI developer interns data with SWR (for POCs)
 */
export function useCollegeAIDeveloperInterns() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/poc/college-interns',
    defaultFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      dedupingInterval: 30 * 1000, // Deduplicate requests within 30 seconds
    }
  );
  
  return {
    aiDeveloperAI Developer Interns: data?.aiDeveloperAI Developer Interns || [],
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
 * Hook for fetching GitLab activity data with SWR and enhanced caching
 */
export function useGitLabActivity(username, options = {}) {
  const { days = 30 } = options;
  
  const { data, error, mutate, isLoading } = useSWR(
    username ? `/api/gitlab/activity/${username}?days=${days}` : null,
    defaultFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes (faster for better UX)
      dedupingInterval: 2 * 60 * 1000, // Deduplicate requests within 2 minutes
      errorRetryInterval: 30 * 1000, // Retry failed requests after 30 seconds
      errorRetryCount: 3, // Maximum 3 retries
      onError: (error) => {
        console.warn(`GitLab activity fetch failed for user ${username}:`, error);
      },
      onSuccess: (data) => {
        if (data && !data.error) {
          console.log(`✅ GitLab activity loaded for ${username}: ${data.activity?.length || 0} activities`);
        }
      }
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