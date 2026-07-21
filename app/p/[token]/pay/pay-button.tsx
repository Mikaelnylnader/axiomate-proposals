"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function PayButton({
  token,
  label,
}: {
  token: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      const result = await createCheckoutSession(token, "full");
      if (result?.url) {
        window.location.href = result.url;
      } else if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("Failed to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}
      <Button onClick={handlePay} disabled={loading} size="md">
        {loading ? "Loading..." : label}
      </Button>
    </div>
  );
}
