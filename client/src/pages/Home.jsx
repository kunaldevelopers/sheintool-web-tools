import { TOOLS } from '../data/tools';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

export default function Home() {
    return (
        <div className="space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                    All-in-One <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">File Tools</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Convert, edit, and manage your files with ease. Fast, secure, and completely free.
                </p>
            </div>

            <div className="space-y-10">
                {TOOLS.map((category, idx) => (
                    <div key={idx}>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-pink-500 pl-4">
                            {category.category}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {category.items.map((tool) => (
                                <Link to={tool.path} key={tool.id} className="group">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="h-full bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-6 transition-all duration-200"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-pink-50 text-pink-600 rounded-lg group-hover:bg-pink-600 group-hover:text-white transition-colors duration-300">
                                                <FontAwesomeIcon icon={tool.icon} className="text-2xl" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                                            {tool.name}
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-2">
                                            {tool.desc}
                                        </p>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
