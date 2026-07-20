import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className='bg-base-100 text-base-content relative h-[300px] [clip-path:polygon(0%_0,100%_0,100%_100%,0_100%)] border-t border-base-content/10 font-sans'>
      <div className="relative h-[calc(100vh+300px)] -top-[100vh]">
        <div className="sticky top-[calc(100vh-300px)] h-[300px]">
          
          {/* Content */}
          <div className="w-full h-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-8 flex flex-col justify-between">
            
            {/* Top Row: CTA + Quick Nav */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* CTA */}
              <div className="md:col-span-7 flex flex-col space-y-2">
                <span className="font-condensed text-sm font-bold uppercase tracking-wider text-base-content/60">
                  Have a project in mind?
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight uppercase leading-none font-condensed">
                  Let’s work together
                </h2>
                <div className="pt-2">
                  <a
                    href="mailto:contact@asadbek.dev"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-base-content hover:opacity-80 transition-opacity group"
                  >
                    <span className="font-condensed text-lg font-bold uppercase tracking-tight">
                      Get In Touch
                    </span>
                    <span className="relative flex items-center justify-center w-7 h-7 rounded-full border border-current overflow-hidden group-hover:bg-base-content group-hover:text-base-100 transition-colors duration-300">
                      <span className="absolute transition-transform duration-300 ease-in-out group-hover:-translate-y-full group-hover:translate-x-full">
                        ↗
                      </span>
                      <span className="absolute transition-transform duration-300 ease-in-out translate-y-full -translate-x-full group-hover:translate-y-0 group-hover:translate-x-0">
                        ↗
                      </span>
                    </span>
                  </a>
                </div>
              </div>

              {/* Links */}
              <div className="md:col-span-5 grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <span className="font-condensed text-xs font-bold uppercase tracking-widest text-base-content/50">
                    Navigation
                  </span>
                  <ul className="flex flex-col space-y-1 text-sm font-medium">
                    <li>
                      <Link to="/" className="hover:opacity-60 transition-opacity">
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link to="/work" className="hover:opacity-60 transition-opacity">
                        Work
                      </Link>
                    </li>
                    <li>
                      <Link to="/about" className="hover:opacity-60 transition-opacity">
                        About
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col space-y-2">
                  <span className="font-condensed text-xs font-bold uppercase tracking-widest text-base-content/50">
                    Socials
                  </span>
                  <ul className="flex flex-col space-y-1 text-sm font-medium">
                    <li>
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:opacity-60 transition-opacity">
                        GitHub
                      </a>
                    </li>
                    <li>
                      <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:opacity-60 transition-opacity">
                        LinkedIn
                      </a>
                    </li>
                    <li>
                      <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:opacity-60 transition-opacity">
                        Twitter / X
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Bottom Row: Branding & Copyright */}
            <div className="pt-4 border-t border-base-content/10 flex flex-row justify-between items-center text-xs font-medium text-base-content/60">
              <p>© {new Date().getFullYear()} Asadbek. All rights reserved.</p>
              <p className="font-condensed uppercase tracking-wider">
                GSAP + React
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

export default Footer