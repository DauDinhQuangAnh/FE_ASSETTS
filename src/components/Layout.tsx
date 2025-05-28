import { ReactNode } from 'react';
import Header from './Header';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Header />
      <div
        style={{
          paddingTop: '60px',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa'
        }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
