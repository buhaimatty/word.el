import { useEffect, useState } from "react";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function Timer({ resetSignal }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0); // reset on mount
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval); // clean up
  }, [resetSignal]);

  return <p className="">{formatTime(seconds)}</p>;
}
