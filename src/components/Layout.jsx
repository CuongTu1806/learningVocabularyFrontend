import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, hideFooter = false, mainClassName = '' }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Header />
      <main className={`flex-grow min-h-0 ${mainClassName}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
