"use client";

import { useEffect, useState } from "react";
import type { Sample } from "@/types";

export function useSamples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/samples/samples.json")
      .then((res) => res.json())
      .then((data: Sample[]) => {
        setSamples(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { samples, loading };
}
