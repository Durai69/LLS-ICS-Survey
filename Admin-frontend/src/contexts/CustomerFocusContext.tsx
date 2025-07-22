import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export interface CustomerFocusItem {
  id: string;
  survey_date: string;
  toDepartment: string;
  fromDepartment: string;
  remark: string;
  action_plan: string;
  responsible_person: string;
  target_date: string;
  acknowledged: boolean;
}

const CustomerFocusContext = createContext<{
  data: CustomerFocusItem[];
  loading: boolean;
  error: string | null;
}>({
  data: [],
  loading: false,
  error: null,
});

export const CustomerFocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CustomerFocusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get<CustomerFocusItem[]>("/api/remarks/customer-focus", { withCredentials: true })
      .then(res => {
        // Filter out items with null or empty remark just in case
        const filtered = res.data.filter(item => item.remark && item.remark.trim() !== "");
        setData(filtered);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, []);

  return (
    <CustomerFocusContext.Provider value={{ data, loading, error }}>
      {children}
    </CustomerFocusContext.Provider>
  );
};

export const useCustomerFocus = () => useContext(CustomerFocusContext);