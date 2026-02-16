import { useState } from 'react';
import { TOOLS } from '../data/tools';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');

    // Flatten tools for search involves collecting all items across categories and filtering
    // But we want to maintain categories if possible, or show a search results list?
    // "Filter tools in real time" usually implies hiding non-matching items.

    const filterTools = (categoryItems) => {
        if (!searchTerm) return categoryItems;
        return categoryItems.filter(tool =>
            tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tool.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tool.tags && tool.tags.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Hero Section */}
            <div className="text-center space-y-6 pt-10">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
                    Every tool you need to work with <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">Files & PDFs</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Highly productive, completely free, and fully functional tools.
                </p>

                {/* Search Bar */}
                <div className="max-w-xl mx-auto relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for tools (e.g. 'resume', 'merge', 'video')..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-full shadow-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Tools Grid */}
            <div className="space-y-12">
                {TOOLS.map((category, idx) => {
                    const filteredItems = filterTools(category.items);
                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={idx} className="animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 pl-4 border-l-4 border-pink-500">
                                {category.category}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredItems.map((tool) => (
                                    <Link to={tool.path} key={tool.id} className="group">
                                        <motion.div
                                            whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)" }}
                                            whileTap={{ scale: 0.98 }}
                                            className="h-full bg-white rounded-xl border border-gray-100 p-6 transition-all duration-200 hover:border-pink-200"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-700 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-colors duration-300">
                                                    <FontAwesomeIcon icon={tool.icon} className="text-2xl" />
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                                                {tool.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                                                {tool.desc}
                                            </p>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* No Results State */}
                {TOOLS.every(cat => filterTools(cat.items).length === 0) && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No tools found matching "{searchTerm}"</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-pink-600 hover:underline font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
