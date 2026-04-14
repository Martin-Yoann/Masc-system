"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import {
  StyleProvider,
  createCache,
  extractStyle,
  type Cache,
} from "@ant-design/cssinjs";

export default function AntdRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState<Cache>(() => createCache());

  useServerInsertedHTML(() => (
    <style
      id="antd-cssinjs"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }}
    />
  ));

  return <StyleProvider cache={cache}>{children}</StyleProvider>;
}

