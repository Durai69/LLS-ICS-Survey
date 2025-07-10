import React, { createContext, useContext, useState, ReactNode } from 'react';
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

  const fetchIncoming = async () => {
    const res = await axios.get('/api/remarks/incoming', { withCredentials: true });
    setIncoming(res.data as IncomingFeedback[]);
  };

  const fetchOutgoing = async () => {
    const res = await axios.get('/api/remarks/outgoing', { withCredentials: true });
    setOutgoing(res.data as OutgoingFeedback[]);
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
    await fetchOutgoing();
  };

  return (
    <RemarksContext.Provider
      value={{
        incoming,
        outgoing,
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