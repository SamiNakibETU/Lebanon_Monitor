/**
 * Custom error page for Next.js Pages Router fallback.
 * Required to satisfy build when App Router is used.
 */
import type { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>{statusCode ? `Error ${statusCode}` : 'An error occurred'}</h1>
      <p>
        {statusCode
          ? `A ${statusCode} error occurred on the server.`
          : 'An unexpected error occurred.'}
      </p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
