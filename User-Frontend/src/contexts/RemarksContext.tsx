import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';

interface IncomingFeedback {
  id: number;
  fromDepartment: string;
  ratingGiven: number;
  remark: string;
  category: string | null;
}

interface OutgoingFeedback {
  id: number;
  department: string;
  rating: number;
  yourRemark: string;
  category: string | null;
  theirResponse: {
    explanation: string;
    actionPlan: string;
    responsiblePerson: string;
  };
  acknowledged: boolean;
}

interface RemarksContextType {
  incoming: IncomingFeedback[];
  outgoing: OutgoingFeedback[];
  loadingIncoming: boolean;
  loadingOutgoing: boolean;
  errorIncoming: string | null;
  errorOutgoing: string | null;
  fetchIncoming: () => Promise<void>;
  fetchOutgoing: () => Promise<void>;
  respondToFeedback: (payload: {
    id: number;
    explanation: string;
    action_plan: string;
    responsible_person: string;
  }) => Promise<void>;
  acknowledgeFeedback: (id: number) => Promise<void>;
}

const RemarksContext = createContext<RemarksContextType | undefined>(undefined);

export const RemarksProvider = ({ children }: { children: ReactNode }) => {
  const [incoming, setIncoming] = useState<IncomingFeedback[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingFeedback[]>([]);
  const [loadingIncoming, setLoadingIncoming] = useState(false);
  const [loadingOutgoing, setLoadingOutgoing] = useState(false);
  const [errorIncoming, setErrorIncoming] = useState<string | null>(null);
  const [errorOutgoing, setErrorOutgoing] = useState<string | null>(null);

  const fetchIncoming = async () => {
    setLoadingIncoming(true);
    setErrorIncoming(null);
    try {
      const res = await axios.get('/api/remarks/incoming', { withCredentials: true });
      console.log("INCOMING FEEDBACKS (from backend):", res.data); // <-- This will show in browser console
      setIncoming(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setErrorIncoming('Failed to fetch incoming feedback.');
    } finally {
      setLoadingIncoming(false);
    }
  };

  const fetchOutgoing = async () => {
    setLoadingOutgoing(true);
    setErrorOutgoing(null);
    try {
      const res = await axios.get('/api/remarks/outgoing', { withCredentials: true });
      setOutgoing(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setErrorOutgoing('Failed to fetch outgoing feedback.');
    } finally {
      setLoadingOutgoing(false);
    }
  };

  const respondToFeedback = async (payload: {
    id: number;
    explanation: string;
    action_plan: string;
    responsible_person: string;
  }) => {
    await axios.post('/api/remarks/respond', payload, { withCredentials: true });
    await fetchIncoming();
    await fetchOutgoing();
  };

  const acknowledgeFeedback = async (id: number) => {
    await axios.post('/api/remarks/acknowledge', { id }, { withCredentials: true });
    // Remove the acknowledged feedback from outgoing immediately
    setOutgoing((prev) => prev.filter((fb) => fb.id !== id));
  };

  useEffect(() => {
    fetchIncoming();
    fetchOutgoing();
  }, []);

  return (
    <RemarksContext.Provider
      value={{
        incoming,
        outgoing,
        loadingIncoming,
        loadingOutgoing,
        errorIncoming,
        errorOutgoing,
        fetchIncoming,
        fetchOutgoing,
        respondToFeedback,
        acknowledgeFeedback,
      }}
    >
      {children}
    </RemarksContext.Provider>
  );
};

export const useRemarks = () => {
  const ctx = useContext(RemarksContext);
  if (!ctx) throw new Error('useRemarks must be used within a RemarksProvider');
  return ctx;
};
