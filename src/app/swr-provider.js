"use client";
import { SWRConfig } from "swr";
import { showToastErrorMsg } from "@/helpers/frontend";
import authHeader from "@/helpers/auth-header";

const fetcher = async (url) => {
  const headers = authHeader(); // 🔥 inject token here

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,       // 🔥 add Authorization: Bearer token
    },
  });

  if (!res.ok) {
    const err = new Error("API request failed");
    err.status = res.status;
    err.info = await res.json().catch(() => null);
    throw err;
  }

  return res.json();
};

export default function SWRProvider({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 60000,
        errorRetryCount: 3,
        onError: (error) => {
          showToastErrorMsg(error?.info?.msg || "Something went wrong.");
        }
      }}
    >
      {children}
    </SWRConfig>
  );
}
