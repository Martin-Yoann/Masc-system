import type { ReactNode } from "react";
import "./globals.css";
import "antd/dist/reset.css";
import AntdRegistry from "./AntdRegistry";
import { I18nProvider } from "./I18nProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <AntdRegistry>
          <I18nProvider>{children}</I18nProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
