import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';
import { GlowPrivacy, GlowTerms } from './Glow';

/** Privacy notice and terms of use (review drafts generated with the site sections). */
export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  useEffect(() => {
    document.title = `${kind === 'privacy' ? 'Privacy notice' : 'Terms of use'} · GrantLoom`;
    window.scrollTo(0, 0);
  }, [kind]);
  return (
    <div className="site">
      <header className="site-nav">
        <div className="wrap spread">
          <Link to="/" aria-label="GrantLoom home"><Logo /></Link>
          <Link to="/" className="btn btn-ghost btn-sm">← Back to the site</Link>
        </div>
      </header>
      <main>{kind === 'privacy' ? <GlowPrivacy /> : <GlowTerms />}</main>
    </div>
  );
}
