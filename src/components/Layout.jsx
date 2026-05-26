import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, hideFooter = false, mainClassName = '' }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-grow min-h-0 ${mainClassName}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
