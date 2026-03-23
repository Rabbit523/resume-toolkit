import { SpeedInsights } from '@vercel/speed-insights/next';
import GlobalProvider from '../context/auth';
import SWRProvider from './swr-provider';
import ClientLayout from '@/_components/layout/client/ClientLayout';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import 'antd/dist/reset.css';

export const metadata = { title: 'TopDevsLLC Toolkit', icons: { icon: '/favicon.ico' } };

export default async function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning={false} lang='en'>
      <body suppressHydrationWarning={false}>
        <AntdRegistry>
          <GlobalProvider>
            <SWRProvider>
              <ClientLayout props={children} />
            </SWRProvider>
          </GlobalProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
