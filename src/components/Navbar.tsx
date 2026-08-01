'use client';

import {useState, useEffect} from 'react';
import {Menu, X, ChevronRight} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
// Theme toggle removed per user request

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY) {
          if (!isMobileMenuOpen) setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobileMenuOpen]);

  const navLinks = [
    {name: 'Home', href: '/'},
    {name: 'Events', href: '/events'},
    {name: 'Team', href: '/team'},
  ];

  const getIsActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <motion.nav
        initial={{y: -18, opacity: 0}}
        animate={{y: 0, opacity: 1}}
        transition={{duration: 0.32, ease: 'easeOut'}}
        className={`fixed top-0 left-0 right-0 z-50 py-5 transition-transform duration-300 ease-out ${
          !isVisible ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="site-container">
          <motion.div
            layout
            transition={{duration: 0.25, ease: 'easeOut'}}
            className={`w-full relative transition-[border-radius,background-color,box-shadow,padding,transform] duration-300 border border-black/[0.03] dark:border-white/[0.03] rounded-xl ${isScrolled || isMobileMenuOpen ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl px-6 py-4' : 'bg-white/40 dark:bg-slate-950/25 backdrop-blur-md px-5 py-3 sm:px-6'}`}
          >
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group shrink-0">
                <div className={`relative flex items-center justify-center transition-[width,height] duration-200 ${isScrolled || isMobileMenuOpen ? 'w-14 h-14' : 'w-16 h-16'}`}>
                  <img src="/ccrc_it_logo.jpg" alt="CITC" width="480" height="209" className="w-full h-full object-contain dark:hidden" fetchPriority="high" />
                  <img src="/ccrc_it_logo.jpg" alt="CITC" width="480" height="209" className="w-full h-full object-contain hidden dark:block" fetchPriority="high" />
                </div>
              </Link>

              <motion.div
                className="hidden md:flex items-center bg-black/5 dark:bg-white/[0.03] rounded-md px-1.5 py-1 border border-black/5 dark:border-white/[0.05]"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {opacity: 0, y: -6},
                  visible: {opacity: 1, y: 0, transition: {staggerChildren: 0.04, when: 'beforeChildren', duration: 0.28}},
                }}
              >
                {navLinks.map((link) => {
                  const active = getIsActive(link.href);
                  return (
                    <motion.div key={link.name} variants={{hidden: {opacity: 0, y: -6}, visible: {opacity: 1, y: 0, transition: {duration: 0.22}}}} className="mx-0">
                      <Link
                        key={link.name}
                        href={link.href}
                        style={{willChange: 'transform'}}
                        className={`group relative inline-flex items-center px-5 py-2 text-sm rounded-md transform-gpu transition-all duration-300 ease-out ${active ? 'text-black dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-citc-navy dark:hover:text-white'} ${active ? '' : 'hover:-translate-y-[2px] hover:scale-[1.02]'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citc-blue/70`}
                      >
                        <span className="relative z-10 transition-colors duration-300 ease-out">
                          {link.name}
                        </span>
                        <ChevronRight className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-0 transition-all duration-200 ease-out group-hover:translate-x-1 group-hover:opacity-100" />
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              <motion.div className="hidden md:flex items-center gap-4" initial={{opacity: 0, y: -8}} animate={{opacity: 1, y: 0, transition: {duration: 0.32, ease: 'easeOut'}}}>
                <Link
                  href="/join"
                  style={{willChange: 'transform'}}
                  className="group px-6 py-2.5 bg-black text-white font-semibold rounded-md border border-slate-800 shadow-sm transform-gpu transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.03] hover:shadow-lg dark:bg-black dark:text-white dark:border-white/10 dark:hover:bg-slate-950 active:scale-95"
                >
                  <span className="relative flex items-center gap-2">
                    Become a Member <ChevronRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>

              <div className="flex md:hidden items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  aria-expanded={isMobileMenuOpen}
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  className="md:hidden"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: {opacity: 0, y: -8, scale: 0.98},
                    visible: {opacity: 1, y: 0, scale: 1, transition: {staggerChildren: 0.04, when: 'beforeChildren', duration: 0.28, ease: 'easeOut'}},
                    exit: {opacity: 0, y: -6, scale: 0.98, transition: {duration: 0.18}},
                  }}
                >
                  <motion.div
                    className="flex flex-col space-y-6 px-4 py-8"
                    variants={{hidden: {}, visible: {}, exit: {}}}
                  >
                    {navLinks.map((link) => (
                      <motion.div
                        key={link.name}
                        variants={{
                          hidden: {opacity: 0, y: 8},
                          visible: {opacity: 1, y: 0, transition: {duration: 0.22}},
                        }}
                      >
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`text-xl font-bold transition-colors ${
                            getIsActive(link.href) ?
                              'text-[var(--color-citc-blue)]' :
                              'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {link.name}
                        </Link>
                      </motion.div>
                    ))}

                    <motion.div className="pt-8 border-t border-slate-200 dark:border-white/10" variants={{hidden: {opacity: 0, y: 8}, visible: {opacity: 1, y: 0, transition: {duration: 0.24}}}}>
                      <Link
                        href="/join"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center px-8 py-4 bg-black text-white font-bold rounded-md w-fit min-w-[200px] border border-slate-800 shadow-sm transform-gpu transition-all duration-200 ease-in-out hover:scale-105 hover:bg-slate-900 dark:bg-black dark:text-white dark:border-white/10 dark:hover:bg-slate-950"
                      >
                        Become a Member
                      </Link>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.nav>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[45] bg-black/10 backdrop-blur-[4px] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      )}
    </>
  );
}
