import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTools, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="bg-gradient-to-tr from-pink-500 to-violet-600 text-white p-2 rounded-lg shadow-lg transform transition-transform hover:scale-105 active:scale-95">
                                <FontAwesomeIcon icon={faTools} className="text-xl" />
                            </div>
                            <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-violet-600 tracking-tight">
                                SheinTool
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-600 hover:text-pink-600 font-medium transition-colors">Home</Link>
                        <Link to="/about" className="text-gray-600 hover:text-pink-600 font-medium transition-colors">About</Link>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="bg-gray-900 text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform active:scale-95">
                            GitHub
                        </a>
                    </div>

                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-md active:bg-gray-100"
                        >
                            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-4 space-y-2">
                            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50">Home</Link>
                            <Link to="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50">About</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
