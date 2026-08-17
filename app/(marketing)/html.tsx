import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>InvisiProof — Request proof. Verify the risk. Protect the evidence.</title>
        <meta name="description" content="Analyze suspicious images, messages, and URLs—or request private evidence and receive a risk assessment without exposing the raw evidence." />
        <meta property="og:title" content="InvisiProof — Private Risk Verification" />
        <meta property="og:description" content="Request proof. Verify the risk. Protect the evidence." />
        <meta property="og:url" content="https://invisiproof.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
