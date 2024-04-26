import { useRef } from 'react'
import {Mind} from '@kdev/bade-mind-core';
export default function useMind(
  mind?: Mind.Graphic
): Mind.Graphic {
  const mindRef = useRef<Mind.Graphic>();
  if (!mindRef.current) {
    if (mind) {
      mindRef.current = mind;
    } else {
      mindRef!.current = new Mind.Graphic();
    }
  }
  return mindRef.current;
}
