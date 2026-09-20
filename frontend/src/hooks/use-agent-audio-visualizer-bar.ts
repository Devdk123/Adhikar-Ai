import { useEffect, useMemo, useRef, useState } from 'react';
import { type AgentState } from '@livekit/components-react';

function generateConnectingSequenceBar(columns: number): number[][] {
  const seq = [];

  for (let x = 0; x < columns; x++) {
    seq.push([x, columns - 1 - x]);
  }

  return seq;
}

function generateListeningSequenceBar(columns: number): number[][] {
  const center = Math.floor(columns / 2);
  const noIndex = -1;

  return [[center], [noIndex]];
}

export function useAgentAudioVisualizerBarAnimator(
  state: AgentState | undefined,
  columns: number,
  interval: number,
): number[] {
  const [index, setIndex] = useState(0);
  const sequence = useMemo(() => {
    if (state === 'thinking' || state === 'listening') return generateListeningSequenceBar(columns);
    if (state === 'connecting' || state === 'initializing') return generateConnectingSequenceBar(columns);
    if (state === undefined || state === 'speaking') return [new Array(columns).fill(0).map((_, idx) => idx)];
    return [[]];
  }, [state, columns]);

  const animationFrameId = useRef<number | null>(null);
  useEffect(() => {
    let startTime = performance.now();

    const animate = (time: DOMHighResTimeStamp) => {
      const timeElapsed = time - startTime;

      if (timeElapsed >= interval) {
        setIndex((prev) => prev + 1);
        startTime = time;
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [interval, columns, state, sequence.length]);

  return sequence[index % sequence.length] ?? [];
}
