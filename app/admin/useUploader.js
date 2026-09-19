"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadFileWithProgress } from "@/lib/api";

// Shared admin uploader: upload(file, opts) posts with LIVE progress.
// Returns { upProg, upload } — render <UploadRing prog={upProg} /> wherever
// the upload happens. The green 100% tick holds ~2s, then fades out.
export default function useUploader() {
  const [upProg, setUpProg] = useState(null);
  const timer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    []
  );

  const upload = useCallback(async (file, opts) => {
    clearTimeout(timer.current);
    try {
      const url = await uploadFileWithProgress(file, {
        ...opts,
        onProgress: (p) => setUpProg(p),
      });
      timer.current = setTimeout(() => setUpProg(null), 2200);
      return url;
    } catch (err) {
      clearTimeout(timer.current);
      setUpProg(null);
      throw err;
    }
  }, []);

  return { upProg, upload };
}
