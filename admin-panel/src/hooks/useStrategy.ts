import { useEffect, useState } from "react";

export function useStrategy() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/v1/strategy/propose")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return data;
}
